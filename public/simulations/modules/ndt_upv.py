"""
NDT UPV Core Module
Simulasi Uji Ultrasonic Pulse Velocity (UPV) untuk Beton

Referensi Standar:
- ASTM C597: Standard Test Method for Pulse Velocity Through Concrete
- SNI 2847:2019: Persyaratan beton struktural (indirect reference)

Interpretasi Kualitas (ASTM C597):
- > 4.0 km/s: Excellent
- 3.5 - 4.0 km/s: Good
- 3.0 - 3.5 km/s: Doubtful
- < 3.0 km/s: Poor / Cracked

Author: Smart AI Pengkaji SLF
Version: 1.0.0
"""

import numpy as np
import json

def simulate_upv(params):
    """
    Simulasi uji Ultrasonic Pulse Velocity (UPV) untuk deteksi kerusakan beton.
    
    Parameters:
        params (dict): Parameter pengujian yang berisi:
            - age: Umur beton (tahun)
            - exposure: Tingkat eksposur ('mild', 'moderate', 'severe')
            - numTestPoints: Jumlah titik uji
            - fieldVelocities: Nilai UPV aktual dari lapangan (optional)
            - crackProbability: Probabilitas adanya retak (0-1)
            - expectedQuality: Kualitas yang diharapkan ('excellent', 'good', 'doubtful', 'poor')
    
    Returns:
        dict: Hasil pengujian dengan kualitas beton dan deteksi potensi retak
    """
    age_years = params.get('age', 10)
    exposure = params.get('exposure', 'mild')
    num_points = params.get('numTestPoints', 10)
    field_velocities = params.get('fieldVelocities', None)
    crack_probability = params.get('crackProbability', 0.1)
    expected_quality = params.get('expectedQuality', None)
    
    # Base pulse velocity (km/s) - degradation dengan umur dan eksposur
    # Excellent: >4.0, Good: 3.5-4.0, Doubtful: 3.0-3.5, Poor: <3.0
    base_velocities = {
        'mild': {
            'excellent': 4.2,
            'good': 3.8,
            'doubtful': 3.3,
            'poor': 2.8
        },
        'moderate': {
            'excellent': 4.0,
            'good': 3.6,
            'doubtful': 3.1,
            'poor': 2.6
        },
        'severe': {
            'excellent': 3.8,
            'good': 3.4,
            'doubtful': 2.9,
            'poor': 2.4
        }
    }
    
    # Degradasi dengan umur (% per tahun)
    degradation_rates = {
        'mild': 0.015,      # 1.5% per tahun
        'moderate': 0.030,  # 3% per tahun
        'severe': 0.050     # 5% per tahun
    }
    
    # Determine base velocity
    exp_data = base_velocities.get(exposure, base_velocities['mild'])
    
    if expected_quality and expected_quality in exp_data:
        base_v = exp_data[expected_quality]
    else:
        # Default ke 'good'
        base_v = exp_data['good']
    
    # Apply age degradation
    degr_rate = degradation_rates.get(exposure, 0.03)
    age_factor = 1 - (degr_rate * age_years)
    age_factor = max(0.5, age_factor)  # Maximum 50% degradation
    
    base_velocity = base_v * age_factor
    
    # Generate atau gunakan field velocities
    if field_velocities and len(field_velocities) > 0:
        velocities = np.array(field_velocities)
        num_points = len(velocities)
    else:
        velocities = []
        for i in range(num_points):
            # Some points mungkin ada crack
            has_crack = np.random.random() < crack_probability
            
            if has_crack:
                # Crack reduces velocity significantly (70% reduction)
                v = base_velocity * np.random.uniform(0.5, 0.8)
            else:
                # Normal variation
                v = base_velocity * np.random.normal(1.0, 0.05)
            
            v = max(v, 1.5)  # Minimum realistic velocity
            velocities.append(v)
        
        velocities = np.array(velocities)
    
    # Statistics
    v_mean = np.mean(velocities)
    v_min = np.min(velocities)
    v_max = np.max(velocities)
    v_std = np.std(velocities)
    v_median = np.median(velocities)
    
    # Quality rating berdasarkan mean velocity
    if v_mean > 4.0:
        quality_rating = 'Excellent'
        quality_description = 'Beton berkualitas sangat baik, homogen, tidak ada kerusakan'
    elif v_mean > 3.5:
        quality_rating = 'Good'
        quality_description = 'Beton berkualitas baik, struktur padat'
    elif v_mean > 3.0:
        quality_rating = 'Doubtful'
        quality_description = 'Beton memerlukan investigasi lebih lanjut, kemungkinan porositas tinggi'
    else:
        quality_rating = 'Poor'
        quality_description = 'Beton bermasalah, kemungkinan retak atau delaminasi'
    
    # Crack detection (velocity < 3.0 km/s menandakan potensi retak)
    crack_threshold = 3.0
    potential_cracks = np.sum(velocities < crack_threshold)
    crack_percentage = (potential_cracks / num_points) * 100
    
    # Severity assessment
    if crack_percentage == 0:
        crack_severity = 'None'
    elif crack_percentage < 10:
        crack_severity = 'Minor'
    elif crack_percentage < 30:
        crack_severity = 'Moderate'
    else:
        crack_severity = 'Severe'
    
    # Homogeneity assessment
    cv = (v_std / v_mean) * 100 if v_mean > 0 else 0
    if cv < 5:
        homogeneity = 'Excellent'
    elif cv < 10:
        homogeneity = 'Good'
    elif cv < 15:
        homogeneity = 'Fair'
    else:
        homogeneity = 'Poor'
    
    # Estimasi modulus elastisitas dinamis (simplified)
    # Ed = ρ * Vp² * (1 + ν) * (1 - 2ν) / (1 - ν)
    # dengan asumsi ρ = 2400 kg/m³, ν = 0.2
    rho = 2400  # kg/m³
    nu = 0.2    # Poisson's ratio
    v_mean_m_s = v_mean * 1000  # Convert to m/s
    
    dynamic_modulus = rho * (v_mean_m_s ** 2) * (1 + nu) * (1 - 2 * nu) / (1 - nu)
    dynamic_modulus_gpa = dynamic_modulus / 1e9  # Convert to GPa
    
    # Generate recommendations
    recommendations = []
    
    if quality_rating in ['Doubtful', 'Poor']:
        recommendations.append(
            f"Kualitas beton {quality_rating.lower()} (VP: {v_mean:.2f} km/s). "
            f"{quality_description}. Perlu investigasi detail."
        )
    
    if potential_cracks > 0:
        recommendations.append(
            f"Terdeteksi {potential_cracks} dari {num_points} lokasi ({crack_percentage:.1f}%) "
            f"dengan potensi retak/defect (VP < {crack_threshold} km/s)."
        )
        if crack_severity in ['Moderate', 'Severe']:
            recommendations.append(
                f"Tingkat keparahan: {crack_severity}. "
                "Rekomendasi: Visual inspection, core test, atau GPR untuk mapping kerusakan."
            )
    
    if homogeneity == 'Poor':
        recommendations.append(
            f"Heterogenitas tinggi (CV={cv:.1f}%). "
            "Indikasi variasi kualitas beton antar lokasi."
        )
    
    if not recommendations:
        recommendations.append(
            f"Kualitas beton {quality_rating.lower()} (VP: {v_mean:.2f} km/s). "
            "Tidak terdeteksi masalah signifikan."
        )
    
    result = {
        'test_type': 'Ultrasonic Pulse Velocity (UPV)',
        'test_method': 'ASTM C597',
        'age_years': age_years,
        'exposure_condition': exposure,
        'num_test_points': num_points,
        'pulse_velocities': [round(float(v), 2) for v in velocities],
        'velocity_mean': round(float(v_mean), 2),
        'velocity_min': round(float(v_min), 2),
        'velocity_max': round(float(v_max), 2),
        'velocity_median': round(float(v_median), 2),
        'velocity_std': round(float(v_std), 2),
        'quality_rating': quality_rating,
        'quality_description': quality_description,
        'potential_cracks_detected': int(potential_cracks),
        'crack_percentage': round(float(crack_percentage), 1),
        'crack_severity': crack_severity,
        'homogeneity': homogeneity,
        'coefficient_of_variation': round(float(cv), 2),
        'dynamic_elastic_modulus_gpa': round(float(dynamic_modulus_gpa), 2),
        'recommendations': recommendations,
        'reference_standard': 'ASTM C597'
    }
    
    return result


# Test function
if __name__ == '__main__':
    test_params = {
        'age': 15,
        'exposure': 'moderate',
        'numTestPoints': 10,
        'crackProbability': 0.2
    }
    
    result = simulate_upv(test_params)
    print(json.dumps(result, indent=2))
