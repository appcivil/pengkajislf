"""
NDT Rebound Hammer Core Module
Simulasi Uji Palu Pantul (Schmidt Hammer) untuk Estimasi Kekuatan Beton

Referensi Standar:
- SNI 2847:2019: Persyaratan beton struktural untuk bangunan gedung
- ASTM C805: Standard Test Method for Rebound Number of Hardened Concrete

Author: Smart AI Pengkaji SLF
Version: 1.0.0
"""

import numpy as np
from scipy import stats
import json

def simulate_rebound_hammer(params):
    """
    Simulasi uji palu pantul (Schmidt Hammer) untuk estimasi kuat tekan beton.
    
    Parameters:
        params (dict): Parameter pengujian yang berisi:
            - material: Jenis material ('concrete', 'mortar')
            - age: Umur bangunan/beton (tahun)
            - exposure: Tingkat eksposur ('mild', 'moderate', 'severe')
            - numTestPoints: Jumlah titik uji
            - confidence: Level confidence interval (0.90, 0.95, 0.99)
            - fieldValues: Nilai rebound aktual dari lapangan (optional)
    
    Returns:
        dict: Hasil pengujian dengan estimasi kuat tekan dan compliance
    """
    material = params.get('material', 'concrete')
    age_years = params.get('age', 10)
    exposure = params.get('exposure', 'mild')
    num_points = params.get('numTestPoints', 10)
    confidence = params.get('confidence', 0.95)
    field_values = params.get('fieldValues', None)
    
    # Ambil standard dari SNI
    try:
        fc_min = SNI_STANDARDS['CONCRETE']['MIN_STRENGTH']
        k_250 = SNI_STANDARDS['CONCRETE']['K_250']
        k_300 = SNI_STANDARDS['CONCRETE']['K_300']
    except (NameError, KeyError):
        fc_min = 20.75  # MPa (K-250)
        k_250 = 20.75
        k_300 = 24.9
    
    # Base strength berdasarkan umur dan eksposur (degradasi)
    degradation_curves = {
        'mild': {5: 35, 10: 30, 15: 25, 20: 20, 25: 18, 30: 15},
        'moderate': {5: 30, 10: 25, 15: 20, 20: 15, 25: 12, 30: 10},
        'severe': {5: 25, 10: 20, 15: 15, 20: 10, 25: 8, 30: 5}
    }
    
    # Interpolasi umur
    age_keys = sorted(degradation_curves.get(exposure, {}).keys())
    base_strength = 20
    
    if exposure in degradation_curves:
        curve = degradation_curves[exposure]
        # Find closest ages
        lower_age = max([a for a in age_keys if a <= age_years], default=age_keys[0] if age_keys else 5)
        upper_age = min([a for a in age_keys if a >= age_years], default=age_keys[-1] if age_keys else 30)
        
        if lower_age == upper_age:
            base_strength = curve.get(lower_age, 20)
        else:
            # Linear interpolation
            lower_strength = curve.get(lower_age, 20)
            upper_strength = curve.get(upper_age, 20)
            ratio = (age_years - lower_age) / (upper_age - lower_age)
            base_strength = lower_strength + ratio * (upper_strength - lower_strength)
    
    # Rebound values (R)
    if field_values and len(field_values) > 0:
        # Use actual field data
        rebound_values = np.array(field_values)
        num_points = len(rebound_values)
    else:
        # Simulate rebound values
        # R typically 20-50 for concrete, proportional dengan strength
        R_mean = 20 + (base_strength / 50) * 30
        R_std = 3.0  # Standard deviation
        
        rebound_values = np.random.normal(R_mean, R_std, num_points)
        rebound_values = np.clip(rebound_values, 10, 60)
    
    # Convert rebound to compressive strength
    # fc = 0.725 * R + 12.5 (MPa) - simplified formula untuk concrete
    # Untuk mortar, formula berbeda
    if material == 'mortar':
        fc_estimates = 0.5 * rebound_values + 8.0
    else:
        fc_estimates = 0.725 * rebound_values + 12.5
    
    # Statistics
    fc_mean = np.mean(fc_estimates)
    fc_std = np.std(fc_estimates, ddof=1)  # Sample std
    fc_min_observed = np.min(fc_estimates)
    fc_max_observed = np.max(fc_estimates)
    
    # Confidence interval
    if num_points > 1:
        ci = stats.t.interval(confidence, num_points - 1, loc=fc_mean, scale=fc_std / np.sqrt(num_points))
        ci_lower = max(0, ci[0])
        ci_upper = ci[1]
    else:
        ci_lower = fc_mean
        ci_upper = fc_mean
    
    # Quality rating berdasarkan fc_mean
    if fc_mean >= 30:
        quality_rating = 'Excellent'
        quality_score = 95
    elif fc_mean >= 25:
        quality_rating = 'Good'
        quality_score = 80
    elif fc_mean >= 20:
        quality_rating = 'Fair'
        quality_score = 60
    else:
        quality_rating = 'Poor'
        quality_score = 30
    
    # Compliance check dengan SNI 2847:2019
    passes = fc_mean >= fc_min
    
    # Determine concrete grade
    if fc_mean >= 41.5:
        concrete_grade = 'K-500'
    elif fc_mean >= 37.35:
        concrete_grade = 'K-450'
    elif fc_mean >= 33.2:
        concrete_grade = 'K-400'
    elif fc_mean >= 29.05:
        concrete_grade = 'K-350'
    elif fc_mean >= 24.9:
        concrete_grade = 'K-300'
    elif fc_mean >= 20.75:
        concrete_grade = 'K-250'
    elif fc_mean >= 16.6:
        concrete_grade = 'K-200'
    elif fc_mean >= 12.45:
        concrete_grade = 'K-150'
    else:
        concrete_grade = 'K-100'
    
    # Homogeneity check
    cv = (fc_std / fc_mean) * 100 if fc_mean > 0 else 0  # Coefficient of variation
    if cv < 10:
        homogeneity = 'Uniform'
    elif cv < 20:
        homogeneity = 'Variable'
    else:
        homogeneity = 'Non-uniform'
    
    # Generate recommendations
    recommendations = []
    
    if fc_mean < fc_min:
        recommendations.append(
            f"Kekuatan beton ({fc_mean:.1f} MPa) di bawah minimum K-250 ({fc_min} MPa). "
            "Rekomendasi:"
        )
        recommendations.append("- Lakukan core test untuk verifikasi langsung")
        recommendations.append("- Pertimbangkan retrofit struktur jika memungkinkan")
        recommendations.append("- Evaluasi struktural oleh tenaga ahli")
    
    if cv > 20:
        recommendations.append(
            f"Variasi kekuatan tinggi (CV={cv:.1f}%). "
            "Indikasi heterogenitas - perlu investigasi lebih detail."
        )
    
    if not passes:
        recommendations.append(
            f"Bangunan tidak memenuhi standar minimum beton struktural SNI 2847:2019."
        )
    else:
        recommendations.append(
            f"Kualitas beton {quality_rating.lower()}. "
            f"Kekuatan setara {concrete_grade} memenuhi standar minimum SNI 2847:2019."
        )
    
    if len(recommendations) == 0:
        recommendations.append("Hasil uji palu pantul memenuhi persyaratan standar.")
    
    result = {
        'test_type': 'Rebound Hammer (Schmidt)',
        'test_method': 'ASTM C805',
        'material': material,
        'age_years': age_years,
        'exposure_condition': exposure,
        'num_test_points': num_points,
        'rebound_values': [round(float(r), 1) for r in rebound_values],
        'rebound_mean': round(float(np.mean(rebound_values)), 1),
        'rebound_std': round(float(np.std(rebound_values)), 2),
        'fc_estimates': [round(float(fc), 2) for fc in fc_estimates],
        'fc_mean': round(float(fc_mean), 2),
        'fc_std': round(float(fc_std), 2),
        'fc_min': round(float(fc_min_observed), 2),
        'fc_max': round(float(fc_max_observed), 2),
        'confidence_interval': [round(float(ci_lower), 2), round(float(ci_upper), 2)],
        'confidence_level': confidence,
        'concrete_grade': concrete_grade,
        'quality_rating': quality_rating,
        'quality_score': quality_score,
        'homogeneity': homogeneity,
        'coefficient_of_variation': round(float(cv), 2),
        'compliance': {
            'fc_required': fc_min,
            'fc_required_grade': 'K-250',
            'passes': bool(passes),
            'category': quality_rating
        },
        'recommendations': recommendations,
        'sni_reference': 'SNI 2847:2019'
    }
    
    return result


# Test function
if __name__ == '__main__':
    SNI_STANDARDS = {
        'CONCRETE': {
            'MIN_STRENGTH': 20.75,
            'K_250': 20.75,
            'K_300': 24.9
        }
    }
    
    test_params = {
        'material': 'concrete',
        'age': 10,
        'exposure': 'moderate',
        'numTestPoints': 10,
        'confidence': 0.95
    }
    
    result = simulate_rebound_hammer(test_params)
    print(json.dumps(result, indent=2))
