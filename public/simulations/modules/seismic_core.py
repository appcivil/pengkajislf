"""
Seismic Response Core Module
Simulasi Respons Spektrum Kegempaan

Referensi Standar:
- SNI 1726:2019: Tata cara perencanaan ketahanan gempa untuk struktur bangunan gedung
- ASCE 7-16 (referensi)

Author: Smart AI Pengkaji SLF
Version: 1.0.0
"""

import numpy as np
import json

def calculate_seismic_response(params):
    """
    Kalkulasi respons seismic berdasarkan SNI 1726:2019.
    
    Parameters:
        params (dict): Parameter yang berisi:
            - seismicZone: Zona gempa (1-6)
            - soilType: Tipe tanah (SA, SB, SC, SD, SE, SF)
            - buildingHeight: Tinggi bangunan (m)
            - numFloors: Jumlah lantai
            - floorWeights: List berat per lantai (kN)
            - buildingType: Tipe struktur ('moment_frame', 'shear_wall', 'dual', 'braced')
            - importanceFactor: Faktor keutamaan (I)
            - responseFactor: Faktor respons (R)
            - siteClass: Kelas situs
            - dampingRatio: Rasio redaman (%)
    
    Returns:
        dict: Hasil analisis seismic dengan base shear, drift, dll.
    """
    # Extract parameters
    seismic_zone = params.get('seismicZone', 3)
    soil_type = params.get('soilType', 'SD')
    building_height = params.get('buildingHeight', 30)
    num_floors = params.get('numFloors', 10)
    
    floor_weights = params.get('floorWeights', None)
    if floor_weights is None:
        # Default uniform weight distribution
        typical_floor_weight = 8000  # kN
        floor_weights = [typical_floor_weight] * num_floors
    
    building_type = params.get('buildingType', 'moment_frame')
    importance_factor = params.get('importanceFactor', 1.0)
    damping_ratio = params.get('dampingRatio', 5.0)  # 5% typical
    
    # Response modification factor (R) by structural system
    r_factors = {
        'moment_frame': 8.0,
        'shear_wall': 6.0,
        'dual': 7.0,
        'braced': 6.0,
        'moment_frame_steel': 8.0,
        'moment_frame_concrete': 8.0,
        'other': 3.0
    }
    response_factor = params.get('responseFactor', r_factors.get(building_type, 3.0))
    
    # Ambil standard seismic parameters
    try:
        ss_zones = SNI_STANDARDS['SEISMIC']['SS_ZONES']
        s1_zones = SNI_STANDARDS['SEISMIC']['S1_ZONES']
    except (NameError, KeyError):
        ss_zones = {1: 0.60, 2: 0.75, 3: 0.85, 4: 1.00, 5: 1.20, 6: 1.60}
        s1_zones = {1: 0.30, 2: 0.35, 3: 0.40, 4: 0.50, 5: 0.60}
    
    # Spectral acceleration parameters
    ss = ss_zones.get(seismic_zone, 0.85)  # Short period
    s1 = s1_zones.get(seismic_zone, 0.40)  # 1-second period
    
    # Site coefficients (Fa and Fv)
    site_coeffs = {
        'SA': {'Fa': 0.8, 'Fv': 0.8},
        'SB': {'Fa': 1.0, 'Fv': 1.0},
        'SC': {'Fa': 1.2, 'Fv': 1.7},
        'SD': {'Fa': 1.6, 'Fv': 2.4},
        'SE': {'Fa': 2.5, 'Fv': 3.5},
        'SF': {'Fa': 2.5, 'Fv': 3.5}  # Special
    }
    
    fa = site_coeffs.get(soil_type, site_coeffs['SD'])['Fa']
    fv = site_coeffs.get(soil_type, site_coeffs['SD'])['Fv']
    
    # Design spectral acceleration
    sms = fa * ss  # Short period
    sm1 = fv * s1  # 1-second period
    
    sds = (2.0 / 3.0) * sms  # Design short period
    sd1 = (2.0 / 3.0) * sm1  # Design 1-second
    
    # Total building weight
    total_weight = sum(floor_weights)
    
    # Natural period approximation (empirical formula)
    # T = Ct * hn^x
    ct_values = {
        'moment_frame_steel': 0.072,
        'moment_frame_concrete': 0.046,
        'shear_wall': 0.049,
        'dual': 0.050,
        'braced': 0.030,
        'other': 0.050
    }
    ct = ct_values.get(building_type, 0.050)
    x = 0.75  # Exponent
    
    natural_period = ct * (building_height ** x)
    
    # Spectral acceleration at natural period (Sa)
    # Response spectrum shape
    t0 = 0.2 * sd1 / sds if sds > 0 else 0.2
    ts = sd1 / sds if sds > 0 else 1.0
    
    if natural_period <= t0:
        sa = sds * (0.4 + 0.6 * natural_period / t0)
    elif natural_period <= ts:
        sa = sds
    else:
        sa = sd1 / natural_period if natural_period > 0 else sds
    
    # Seismic response coefficient (Cs)
    cs = sa / (response_factor / importance_factor)
    
    # Limit Cs
    cs_max = sds / (response_factor / importance_factor)
    cs_min = 0.044 * sds * importance_factor
    
    cs = min(cs, cs_max)
    cs = max(cs, cs_min)
    
    # Base shear
    base_shear = cs * total_weight
    
    # Vertical distribution of forces
    # Fx = (wx * hx^k / sum(wi * hi^k)) * V
    k = 1.0 if natural_period <= 0.5 else 2.0 if natural_period >= 2.5 else 1.0 + (natural_period - 0.5)
    
    floor_heights = [building_height * (i + 1) / num_floors for i in range(num_floors)]
    
    # Calculate distribution
    sum_whk = sum(w * (h ** k) for w, h in zip(floor_weights, floor_heights))
    
    floor_forces = []
    for i, (w, h) in enumerate(zip(floor_weights, floor_heights)):
        fx = (w * (h ** k) / sum_whk) * base_shear if sum_whk > 0 else 0
        floor_forces.append({
            'floor': i + 1,
            'height': round(h, 2),
            'weight': round(w, 2),
            'force_kn': round(fx, 2)
        })
    
    # Story drift calculation (simplified)
    # Assume drift limit H/250 for typical buildings
    drift_limit = building_height / 250  # meters
    
    # Approximate drift calculation
    assumed_stiffness = total_weight * 100  # Simplified stiffness estimation
    
    estimated_drifts = []
    cumulative_drift = 0
    
    for i in range(num_floors):
        # Simplified drift per story
        story_force = floor_forces[i]['force_kn'] * 1000  # N
        story_height = floor_heights[i] - (floor_heights[i-1] if i > 0 else 0)
        story_stiffness = assumed_stiffness / num_floors
        
        story_drift = story_force / story_stiffness if story_stiffness > 0 else 0
        cumulative_drift += story_drift
        
        drift_ratio = story_drift / story_height if story_height > 0 else 0
        
        estimated_drifts.append({
            'floor': i + 1,
            'story_drift_mm': round(story_drift * 1000, 2),
            'drift_ratio': round(drift_ratio, 5),
            'within_limit': drift_ratio < 0.004  # H/250 ≈ 0.004
        })
    
    # Compliance check
    max_drift_ratio = max([d['drift_ratio'] for d in estimated_drifts])
    drift_compliance = max_drift_ratio < 0.004
    
    compliance = {
        'seismic_zone': seismic_zone,
        'soil_type': soil_type,
        'sds': round(sds, 3),
        'sd1': round(sd1, 3),
        'natural_period': round(natural_period, 3),
        'base_shear_kn': round(base_shear, 2),
        'cs': round(cs, 4),
        'drift_compliance': drift_compliance,
        'max_drift_ratio': round(max_drift_ratio, 5),
        'drift_limit': 0.004,
        'passes': drift_compliance
    }
    
    # Seismic hazard level
    if sds < 0.25:
        hazard_level = 'Low'
    elif sds < 0.50:
        hazard_level = 'Moderate'
    elif sds < 0.75:
        hazard_level = 'High'
    else:
        hazard_level = 'Very High'
    
    # Recommendations
    recommendations = []
    
    recommendations.append(
        f"Analisis seismic untuk Zona {seismic_zone} ({hazard_level} hazard): "
        f"SDS={sds:.3f}g, SD1={sd1:.3f}g"
    )
    
    recommendations.append(
        f"Base shear: {base_shear:.1f} kN ({cs:.4f} × {total_weight:.1f} kN), "
        f"perioda alami: {natural_period:.3f}s"
    )
    
    if not drift_compliance:
        recommendations.append(
            f"ALERT: Drift ratio ({max_drift_ratio:.5f}) melebihi batas (0.004). "
            f"Struktur memerlukan pengecekan drift detail oleh tenaga ahli."
        )
    else:
        recommendations.append(
            f"Drift ratio ({max_drift_ratio:.5f}) memenuhi batas SNI (0.004)."
        )
    
    if sds > 0.50:
        recommendations.append(
            f"Zona gempa tinggi (SDS={sds:.3f}g). Pastikan detailing ductile dan joints properly designed."
        )
    
    if soil_type in ['SE', 'SF']:
        recommendations.append(
            f"Tipe tanah {soil_type} memerlukan analisis geoteknik mendalam (potensi liquefaction)."
        )
    
    result = {
        'seismic_parameters': {
            'zone': seismic_zone,
            'hazard_level': hazard_level,
            'soil_type': soil_type,
            'ss': round(ss, 3),
            's1': round(s1, 3),
            'fa': fa,
            'fv': fv,
            'sms': round(sms, 3),
            'sm1': round(sm1, 3),
            'sds': round(sds, 3),
            'sd1': round(sd1, 3)
        },
        
        'building_response': {
            'total_weight_kn': round(total_weight, 2),
            'natural_period_sec': round(natural_period, 3),
            'cs': round(cs, 4),
            'base_shear_kn': round(base_shear, 2),
            'response_factor': response_factor,
            'importance_factor': importance_factor
        },
        
        'floor_forces': floor_forces,
        'story_drifts': estimated_drifts,
        'compliance': compliance,
        
        'recommendations': recommendations,
        'sni_reference': 'SNI 1726:2019'
    }
    
    return result


# Test function
if __name__ == '__main__':
    SNI_STANDARDS = {
        'SEISMIC': {
            'SS_ZONES': {1: 0.60, 2: 0.75, 3: 0.85, 4: 1.00, 5: 1.20, 6: 1.60},
            'S1_ZONES': {1: 0.30, 2: 0.35, 3: 0.40, 4: 0.50, 5: 0.60}
        }
    }
    
    test_params = {
        'seismicZone': 3,
        'soilType': 'SD',
        'buildingHeight': 30,
        'numFloors': 10,
        'buildingType': 'moment_frame',
        'importanceFactor': 1.0
    }
    
    result = calculate_seismic_response(test_params)
    print(json.dumps(result, indent=2))
