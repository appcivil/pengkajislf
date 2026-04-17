"""
Ventilation Core Module
Simulasi Ventilasi Alami - Air Changes per Hour (ACH)

Referensi Standar:
- SNI 03-6572-2001: Tata cara perencanaan proteksi kebakaran
- SNI 03-6197-2000: Konservasi energi sistem tata udara pada bangunan gedung

Author: Smart AI Pengkaji SLF
Version: 1.0.0
"""

import numpy as np
import json

def calculate_ventilation(params):
    """
    Calculate ventilasi alami dengan Air Changes per Hour (ACH).
    
    Parameters:
        params (dict): Parameter simulasi yang berisi:
            - length: Panjang ruang (m)
            - width: Lebar ruang (m)
            - height: Tinggi ruang (m)
            - windowArea: Luas bukaan jendela (m²)
            - windowHeight: Tinggi jendela (m)
            - openablePercentage: Persentase bukaan yang bisa dibuka (%)
            - windSpeed: Kecepatan angin luar (m/s)
            - windDirection: Arah angin (N, S, E, W)
            - temperature: Suhu ruang (°C)
            - deltaT: Perbedaan suhu dalam-luar (°C)
    
    Returns:
        dict: Hasil simulasi dengan ACH, airflow rate, dan compliance
    """
    # Extract parameters
    length = params.get('length', 10)
    width = params.get('width', 8)
    height = params.get('height', 3)
    window_area = params.get('windowArea', 4)
    window_height = params.get('windowHeight', 1.5)
    openable_pct = params.get('openablePercentage', 50) / 100
    wind_speed = params.get('windSpeed', 2.0)
    wind_direction = params.get('windDirection', 'N')
    temperature = params.get('temperature', 30)
    delta_t = params.get('deltaT', 3)
    
    # Ambil standard dari SNI
    try:
        ach_required = SNI_STANDARDS['VENTILATION']['ACH_MINIMUM']
        ach_recommended = SNI_STANDARDS['VENTILATION']['ACH_RECOMMENDED']
        temp_comfort_min = SNI_STANDARDS['VENTILATION']['TEMPERATURE_COMFORT']['MIN']
        temp_comfort_max = SNI_STANDARDS['VENTILATION']['TEMPERATURE_COMFORT']['MAX']
    except (NameError, KeyError):
        ach_required = 5.0
        ach_recommended = 6.0
        temp_comfort_min = 24
        temp_comfort_max = 27
    
    # Room volume
    room_volume = length * width * height
    
    # Effective opening area
    effective_area = window_area * openable_pct
    
    # Pressure coefficient berdasarkan wind direction
    Cp_values = {
        'N': {'windward': 0.8, 'leeward': -0.4},
        'S': {'windward': 0.8, 'leeward': -0.4},
        'E': {'windward': 0.8, 'leeward': -0.4},
        'W': {'windward': 0.8, 'leeward': -0.4}
    }
    Cp = Cp_values.get(wind_direction, {'windward': 0.8, 'leeward': -0.4})
    
    # Pressure difference dari angin
    rho = 1.2  # kg/m³ (air density)
    delta_P = 0.5 * rho * (wind_speed ** 2) * (Cp['windward'] - Cp['leeward'])
    
    # Discharge coefficient
    Cd = 0.6
    
    # Airflow rate dari wind (m³/s)
    if delta_P > 0:
        Q_wind = Cd * effective_area * np.sqrt(2 * abs(delta_P) / rho)
    else:
        Q_wind = Cd * effective_area * 0.1  # Minimum natural ventilation
    
    # Stack effect (thermal buoyancy)
    h_npl = window_height / 2  # Neutral pressure level
    g = 9.8  # m/s²
    stack_pressure = g * h_npl * abs(delta_t) / (273 + temperature)
    Q_stack = Cd * effective_area * np.sqrt(2 * abs(stack_pressure) / rho)
    
    # Total airflow (vector sum)
    total_Q = np.sqrt(Q_wind**2 + Q_stack**2)
    
    # Air Changes per Hour
    ach = (total_Q * 3600) / room_volume
    
    # Wind-driven vs stack-driven ratio
    wind_driven_pct = (Q_wind / total_Q) * 100 if total_Q > 0 else 50
    
    # Compliance check
    category = 'Good' if ach >= ach_recommended else 'Adequate' if ach >= ach_required else 'Poor'
    
    compliance = {
        'ach_required': ach_required,
        'ach_recommended': ach_recommended,
        'passes': bool(ach >= ach_required),
        'category': category
    }
    
    # Temperature distribution zones
    zones = []
    for i in range(3):
        distance_ratio = i / 2  # 0 to 1
        temp_zone = temperature - (2 * (1 - distance_ratio))  # Cooler near window
        air_speed_zone = wind_speed * (1 - distance_ratio * 0.5)
        
        if temp_zone < temp_comfort_min:
            comfort = 'Cool'
        elif temp_zone <= temp_comfort_max:
            comfort = 'Comfortable'
        elif temp_zone <= 30:
            comfort = 'Warm'
        else:
            comfort = 'Hot'
        
        zones.append({
            'zone': ['Dekat Jendela', 'Tengah Ruang', 'Jauh dari Jendela'][i],
            'temperature': round(float(temp_zone), 1),
            'air_speed': round(float(air_speed_zone), 2),
            'comfort': comfort
        })
    
    # Recommendations
    recommendations = []
    if ach < ach_required:
        recommendations.append(
            f"Ventilasi alami ({ach:.1f} ACH) di bawah standar SNI ({ach_required} ACH). "
            "Pertimbangkan:"
        )
        recommendations.append("- Tambah luas bukaan jendela atau gunakan jendela lebih tinggi")
        recommendations.append("- Gunakan cross-ventilation dengan jendela di dinding berlawanan")
        recommendations.append("- Pertimbangkan mechanical ventilation (exhaust fan)")
    
    if temperature > 30:
        recommendations.append(
            f"Suhu ruang tinggi ({temperature}°C). Ventilasi silang atau AC disarankan."
        )
    
    if ach >= ach_recommended:
        recommendations.append("Ventilasi alami memenuhi standar SNI 03-6572-2001 dengan kategori Baik.")
    elif ach >= ach_required:
        recommendations.append("Ventilasi alami memenuhi standar minimum SNI 03-6572-2001.")
    
    result = {
        'air_changes_per_hour': round(float(ach), 2),
        'airflow_rate': round(float(total_Q), 3),
        'room_volume': round(float(room_volume), 1),
        'wind_driven_percentage': round(float(wind_driven_pct), 1),
        'stack_driven_percentage': round(float(100 - wind_driven_pct), 1),
        'wind_contribution': round(float(Q_wind), 4),
        'stack_contribution': round(float(Q_stack), 4),
        'compliance': compliance,
        'zones': zones,
        'recommendations': recommendations,
        'sni_reference': 'SNI 03-6572-2001'
    }
    
    return result


# Test function
if __name__ == '__main__':
    SNI_STANDARDS = {
        'VENTILATION': {
            'ACH_MINIMUM': 5.0,
            'ACH_RECOMMENDED': 6.0,
            'TEMPERATURE_COMFORT': {'MIN': 24, 'MAX': 27}
        }
    }
    
    test_params = {
        'length': 10,
        'width': 8,
        'height': 3,
        'windowArea': 4,
        'windowHeight': 1.5,
        'openablePercentage': 50,
        'windSpeed': 2.0,
        'windDirection': 'N',
        'temperature': 30
    }
    
    result = calculate_ventilation(test_params)
    print(json.dumps(result, indent=2))
