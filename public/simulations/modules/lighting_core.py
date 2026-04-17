"""
Lighting Core Module
Simulasi Pencahayaan Alami - Daylight Factor Calculation

Referensi Standar:
- SNI 03-2396-2001: Tata cara perancangan sistem pencahayaan alami pada bangunan gedung
- CIE Overcast Sky method

Author: Smart AI Pengkaji SLF
Version: 1.0.0
"""

import numpy as np
from scipy import interpolate
import json

def calculate_daylight_factor(params):
    """
    Calculate daylight factor dan illuminance untuk suatu ruangan.
    
    Parameters:
        params (dict): Parameter simulasi yang berisi:
            - length: Panjang ruang (m)
            - width: Lebar ruang (m)
            - height: Tinggi ruang (m)
            - window_area: Luas jendela (m²)
            - window_height: Tinggi jendela (m)
            - orientation: Orientasi (N, S, E, W, NE, NW, SE, SW)
            - latitude: Latitude lokasi (default: -6.2 untuk Jakarta)
            - sky_condition: Kondisi langit (clear, overcast, partly)
    
    Returns:
        dict: Hasil simulasi dengan daylight factor, illuminance, dan compliance
    """
    # Extract parameters dengan nilai default
    length = params.get('length', 10)
    width = params.get('width', 8)
    height = params.get('height', 3)
    window_area = params.get('windowArea', 6)
    window_height = params.get('windowHeight', 1.5)
    orientation = params.get('orientation', 'S')
    latitude = params.get('latitude', -6.2)
    sky_condition = params.get('skyCondition', 'clear')
    
    # Ambil standard dari SNI_STANDARDS (injected dari Worker)
    try:
        df_min_required = SNI_STANDARDS['DAYLIGHT']['DF_MIN_REQUIRED']
        df_avg_required = SNI_STANDARDS['DAYLIGHT']['DF_AVG_REQUIRED']
        illuminance_min = SNI_STANDARDS['DAYLIGHT']['ILLUMINANCE_MIN']
    except NameError:
        # Fallback jika SNI_STANDARDS tidak tersedia
        df_min_required = 0.5
        df_avg_required = 1.0
        illuminance_min = 150
    
    # Grid points for calculation (1m x 1m grid)
    x_points = np.arange(0.5, length, 1.0)
    y_points = np.arange(0.5, width, 1.0)
    X, Y = np.meshgrid(x_points, y_points)
    
    # Orientation factor
    orient_factor_map = {
        'N': 0.9, 'S': 1.2, 'E': 1.0, 'W': 1.0,
        'NE': 0.95, 'NW': 0.95, 'SE': 1.1, 'SW': 1.1
    }
    orient_factor = orient_factor_map.get(orientation, 1.0)
    
    # Sky condition factor
    sky_factor_map = {'clear': 1.3, 'overcast': 1.0, 'partly': 1.15}
    sky_factor = sky_factor_map.get(sky_condition, 1.0)
    
    # Calculate untuk semua grid points
    df_values = np.zeros_like(X)
    illuminance = np.zeros_like(X)
    
    # External illuminance (Jakarta average)
    E_external = 10000  # lux (clear day)
    if sky_condition == 'overcast':
        E_external = 5000
    elif sky_condition == 'partly':
        E_external = 7500
    
    def calc_df_at_point(x, y):
        """Calculate daylight factor di suatu titik"""
        distance = y  # Distance from window wall (assume window di y=0)
        
        # Angle of visible sky
        h_window = window_height
        theta = np.arctan2(h_window, distance) if distance > 0 else np.pi / 2
        
        # Solid angle approximation
        omega = theta * (window_area / h_window) / (2 * np.pi)
        
        # Basic DF calculation (simplified CIE Overcast Sky)
        df = omega * orient_factor * sky_factor * 100
        
        # Attenuation dengan jarak
        attenuation = np.exp(-distance / (2 * height))
        
        return min(df * attenuation, 15.0)  # Max DF 15%
    
    # Vectorized calculation
    for i in range(X.shape[0]):
        for j in range(X.shape[1]):
            df = calc_df_at_point(X[i, j], Y[i, j])
            df_values[i, j] = df
            illuminance[i, j] = df / 100 * E_external
    
    # Statistics
    df_avg = np.mean(df_values)
    df_min = np.min(df_values)
    df_max = np.max(df_values)
    illuminance_avg = np.mean(illuminance)
    illuminance_p10 = np.percentile(illuminance, 10)
    
    # Compliance check
    compliance = {
        'df_min_required': df_min_required,
        'df_avg_required': df_avg_required,
        'illuminance_min': illuminance_min,
        'passes_df_min': bool(df_min >= df_min_required),
        'passes_df_avg': bool(df_avg >= df_avg_required),
        'passes_illuminance': bool(illuminance_p10 >= illuminance_min),
        'overall_passes': bool(df_min >= df_min_required and df_avg >= df_avg_required)
    }
    
    # Hasil untuk setiap zone (3x3 grid)
    zones = []
    zone_size_x = max(1, int(len(x_points) / 3))
    zone_size_y = max(1, int(len(y_points) / 3))
    
    zone_names_x = ['Depan', 'Tengah', 'Belakang']
    zone_names_y = ['Kiri', 'Tengah', 'Kanan']
    
    for zx in range(3):
        for zy in range(3):
            x_start = int(zx * zone_size_x)
            x_end = min(int((zx + 1) * zone_size_x), len(x_points))
            y_start = int(zy * zone_size_y)
            y_end = min(int((zy + 1) * zone_size_y), len(y_points))
            
            if x_start < x_end and y_start < y_end:
                zone_df = np.mean(df_values[y_start:y_end, x_start:x_end])
                zone_ill = np.mean(illuminance[y_start:y_end, x_start:x_end])
                
                zones.append({
                    'zone': f"{zone_names_x[zx]}-{zone_names_y[zy]}",
                    'daylight_factor': round(float(zone_df), 2),
                    'illuminance': round(float(zone_ill), 1),
                    'adequate': bool(zone_ill >= illuminance_min)
                })
    
    # Generate recommendations
    recommendations = []
    if df_avg < df_avg_required:
        recommendations.append(
            f"Daylight factor rata-rata ({df_avg:.2f}%) di bawah standar SNI ({df_avg_required}%). "
            "Pertimbangkan penambahan jendela atau skylight."
        )
    if df_min < df_min_required:
        recommendations.append(
            f"Daylight factor minimum ({df_min:.2f}%) di bawah standar ({df_min_required}%). "
            "Area tertentu memerlukan pencahayaan buatan tambahan."
        )
    if illuminance_p10 < illuminance_min:
        recommendations.append(
            f"Illuminance di beberapa area ({illuminance_p10:.1f} lux) di bawah standar ({illuminance_min} lux). "
            "Perlu tambahan lampu artificial lighting."
        )
    if not recommendations:
        recommendations.append("Pencahayaan alami memenuhi standar SNI 03-2396-2001.")
    
    result = {
        'daylight_factor_avg': round(float(df_avg), 2),
        'daylight_factor_min': round(float(df_min), 2),
        'daylight_factor_max': round(float(df_max), 2),
        'illuminance_avg': round(float(illuminance_avg), 1),
        'illuminance_min': round(float(np.min(illuminance)), 1),
        'illuminance_max': round(float(np.max(illuminance)), 1),
        'illuminance_p10': round(float(illuminance_p10), 1),
        'compliance': compliance,
        'zones': zones,
        'recommendations': recommendations,
        'sni_reference': 'SNI 03-2396-2001'
    }
    
    return result


# Test function untuk development
if __name__ == '__main__':
    # Mock SNI_STANDARDS untuk testing
    SNI_STANDARDS = {
        'DAYLIGHT': {
            'DF_MIN_REQUIRED': 0.5,
            'DF_AVG_REQUIRED': 1.0,
            'ILLUMINANCE_MIN': 150
        }
    }
    
    test_params = {
        'length': 10,
        'width': 8,
        'height': 3,
        'windowArea': 6,
        'windowHeight': 1.5,
        'orientation': 'S',
        'skyCondition': 'clear'
    }
    
    result = calculate_daylight_factor(test_params)
    print(json.dumps(result, indent=2))
