"""
Acoustics Core Module
Rekening Kebisingan Lingkungan & Sound Transmission

Referensi Standar:
- SNI 6729:2013: Nilai ambang bising dan cara pengukuran
- ASTM E413: Classification for Rating Sound Insulation
- ASTM E90: Laboratory Measurement of Airborne Sound Transmission

STC (Sound Transmission Class):
- 50-60: Excellent (concert halls, recording studios)
- 45-50: Very Good (private offices, meeting rooms)
- 40-45: Good (residential, classrooms)
- 35-40: Fair (general office)
- 25-35: Poor (minimal privacy)

Author: Smart AI Pengkaji SLF
Version: 1.0.0
"""

import numpy as np
import json

def calculate_acoustics(params):
    """
    Kalkulasi transmisi suara dan rekomendasi peredaman.
    
    Parameters:
        params (dict): Parameter yang berisi:
            - sourceNoiseLevel: Tingkat kebisingan sumber (dB)
            - sourceType: Tipe sumber ('traffic', 'industry', 'aircraft', 'railway')
            - distanceToSource: Jarak ke sumber (m)
            - barrierExists: Apakah ada barrier
            - barrierHeight: Tinggi barrier (m)
            - barrierDistance: Jarak barrier dari gedung (m)
            - wallMaterial: Material dinding ('single_glass', 'double_glass', 'brick', 'concrete')
            - wallThickness: Ketebalan dinding (mm)
            - roomType: Tipe ruang ('office', 'residential', 'classroom', 'hospital', 'studio')
            - roomVolume: Volume ruang (m³)
            - targetNoiseLevel: Target kebisingan interior (dB)
    
    Returns:
        dict: Hasil kalkulasi STC, peredaman yang diperlukan, dll.
    """
    # Extract parameters
    source_noise = params.get('sourceNoiseLevel', 75)  # dB
    source_type = params.get('sourceType', 'traffic')
    distance = params.get('distanceToSource', 50)  # m
    
    barrier_exists = params.get('barrierExists', False)
    barrier_height = params.get('barrierHeight', 3)  # m
    barrier_distance = params.get('barrierDistance', 10)  # m
    
    wall_material = params.get('wallMaterial', 'single_glass')
    wall_thickness = params.get('wallThickness', 100)  # mm
    
    room_type = params.get('roomType', 'office')
    room_volume = params.get('roomVolume', 100)  # m³
    
    target_noise = params.get('targetNoiseLevel', None)
    
    # Default target noise levels by room type (dB)
    target_noise_defaults = {
        'office': 45,
        'residential': 40,
        'classroom': 35,
        'hospital': 35,
        'studio': 30,
        'conference': 40,
        'library': 35,
        'theater': 30
    }
    
    if target_noise is None:
        target_noise = target_noise_defaults.get(room_type, 45)
    
    # Source noise levels by type (at 30m)
    source_noise_defaults = {
        'traffic': 75,      # dB (busy road)
        'industry': 80,    # dB (factory)
        'aircraft': 85,    # dB (airport vicinity)
        'railway': 78,     # dB (train)
        'construction': 85, # dB
        'commercial': 70,  # dB (busy commercial area)
        'residential': 55  # dB (quiet residential)
    }
    
    if source_noise == 0:
        source_noise = source_noise_defaults.get(source_type, 70)
    
    # Noise attenuation with distance
    # Inverse square law: -6 dB per doubling of distance
    distance_attenuation = 20 * np.log10(distance / 30) if distance > 0 else 0
    
    # Calculate exterior noise level at building facade
    exterior_noise = source_noise - distance_attenuation
    
    # Barrier attenuation (if exists)
    barrier_attenuation = 0
    if barrier_exists and barrier_height > 0:
        # Simplified barrier calculation
        # Fresnel number approximation
        path_difference = barrier_height * 2  # Simplified
        barrier_attenuation = min(20, 10 + 5 * np.log10(path_distance / barrier_distance)) if barrier_distance > 0 else 10
        barrier_attenuation = max(0, min(20, barrier_attenuation))  # 0-20 dB typical
        exterior_noise -= barrier_attenuation
    
    # Wall/fenestration STC ratings
    stc_ratings = {
        'single_glass': {'stc': 25, 'name': 'Kaca tunggal 3mm'},
        'double_glass': {'stc': 35, 'name': 'Kaca ganda (air gap 12mm)'},
        'triple_glass': {'stc': 42, 'name': 'Kaca triple'},
        'single_glass_laminated': {'stc': 32, 'name': 'Kaca laminasi 6mm'},
        'brick_110': {'stc': 45, 'name': 'Bata 110mm + plaster'},
        'brick_220': {'stc': 50, 'name': 'Bata 220mm + plaster'},
        'concrete_150': {'stc': 52, 'name': 'Beton 150mm'},
        'concrete_200': {'stc': 55, 'name': 'Beton 200mm'},
        'gypsum_single': {'stc': 35, 'name': 'Gypsum single layer'},
        'gypsum_double': {'stc': 45, 'name': 'Gypsum double layer with insulation'}
    }
    
    wall_data = stc_ratings.get(wall_material, stc_ratings['single_glass'])
    current_stc = wall_data['stc']
    wall_name = wall_data['name']
    
    # Calculate interior noise level
    # Interior noise = Exterior noise - STC
    interior_noise = exterior_noise - current_stc
    
    # Calculate required STC
    required_stc = exterior_noise - target_noise
    
    # Determine if current construction is adequate
    stc_adequate = current_stc >= required_stc
    
    # STC quality rating
    if current_stc >= 50:
        stc_quality = 'Excellent'
        privacy_level = 'Complete privacy'
    elif current_stc >= 45:
        stc_quality = 'Very Good'
        privacy_level = 'High privacy'
    elif current_stc >= 40:
        stc_quality = 'Good'
        privacy_level = 'Normal privacy'
    elif current_stc >= 35:
        stc_quality = 'Fair'
        privacy_level = 'Limited privacy'
    else:
        stc_quality = 'Poor'
        privacy_level = 'Minimal privacy'
    
    # Interior noise level assessment
    if interior_noise <= 35:
        noise_quality = 'Excellent'
    elif interior_noise <= 40:
        noise_quality = 'Good'
    elif interior_noise <= 50:
        noise_quality = 'Fair'
    else:
        noise_quality = 'Poor'
    
    # Recommendation for STC improvement
    stc_recommendations = {
        'single_glass': ['double_glass', 'single_glass_laminated'],
        'double_glass': ['triple_glass', 'double_glass_acoustic'],
        'triple_glass': ['triple_glass_laminated'],
        'brick_110': ['brick_220', 'brick_110_insulated'],
        'brick_220': ['concrete_200', 'brick_220_insulated'],
        'concrete_150': ['concrete_200', 'concrete_150_insulated'],
        'gypsum_single': ['gypsum_double', 'gypsum_insulated']
    }
    
    # Compliance check with SNI 6729:2013
    # Industrial area: 70 dB, Commercial: 60 dB, Residential: 55 dB
    noise_limits = {
        'industry': 70,
        'commercial': 60,
        'residential': 55,
        'hospital': 45,
        'school': 55,
        'office': 60
    }
    
    exterior_limit = noise_limits.get(source_type, 60)
    exterior_compliance = exterior_noise <= exterior_limit
    
    # Interior compliance
    interior_limit = target_noise + 5  # Allow 5 dB tolerance
    interior_compliance = interior_noise <= interior_limit
    
    # Generate recommendations
    recommendations = []
    
    recommendations.append(
        f"Kebisingan sumber ({source_type}): {source_noise} dB di 30m, "
        f"dengan attenuasi jarak ({distance}m): {distance_attenuation:.1f} dB"
    )
    
    recommendations.append(
        f"Level kebisingan di facade: {exterior_noise:.1f} dB, "
        f"interior dengan STC {current_stc}: {interior_noise:.1f} dB"
    )
    
    if barrier_exists:
        recommendations.append(
            f"Barrier ({barrier_height}m tinggi): reduksi {barrier_attenuation:.1f} dB"
        )
    
    if not stc_adequate:
        stc_shortfall = required_stc - current_stc
        recommendations.append(
            f"ALERT: STC kurang {stc_shortfall:.0f} dB untuk target {target_noise} dB interior. "
            f"Diperlukan STC {required_stc:.0f}, saat ini {current_stc}."
        )
        
        # Suggest improvements
        if wall_material in stc_recommendations:
            better_options = stc_recommendations[wall_material]
            for option in better_options:
                if option in stc_ratings and stc_ratings[option]['stc'] >= required_stc:
                    recommendations.append(
                        f"Rekomendasi: Ganti dengan {stc_ratings[option]['name']} "
                        f"(STC {stc_ratings[option]['stc']})"
                    )
                    break
        
        if not barrier_exists and exterior_noise - target_noise > current_stc + 5:
            recommendations.append(
                "Pertimbangkan noise barrier eksternal (3-4m tinggi) untuk reduksi tambahan 10-15 dB."
            )
    else:
        recommendations.append(
            f"Konstruksi {wall_name} memenuhi persyaratan peredaman (STC {current_stc} ≥ {required_stc})."
        )
    
    if not exterior_compliance:
        recommendations.append(
            f"Kebisingan eksterior ({exterior_noise:.1f} dB) melebihi limit {exterior_limit} dB untuk zona {source_type}."
        )
    
    if not interior_compliance:
        recommendations.append(
            f"Kebisingan interior ({interior_noise:.1f} dB) tidak memenuhi target untuk {room_type} ({target_noise} dB)."
        )
    
    # Additional acoustic treatments
    if interior_noise > target_noise + 10:
        recommendations.append(
            "Tambahan treatment akustik interior: acoustic ceiling, wall panels, atau double glazing."
        )
    
    result = {
        'source_noise': {
            'type': source_type,
            'level_at_30m_db': source_noise,
            'distance_m': distance,
            'distance_attenuation_db': round(distance_attenuation, 2),
            'barrier_attenuation_db': round(barrier_attenuation, 2) if barrier_exists else 0,
            'exterior_level_db': round(exterior_noise, 2),
            'exterior_limit_db': exterior_limit,
            'exterior_compliance': exterior_compliance
        },
        
        'sound_isolation': {
            'current_material': wall_name,
            'current_stc': current_stc,
            'stc_quality': stc_quality,
            'privacy_level': privacy_level,
            'required_stc': round(required_stc, 1),
            'stc_adequate': stc_adequate
        },
        
        'interior_acoustics': {
            'room_type': room_type,
            'calculated_noise_db': round(interior_noise, 2),
            'target_noise_db': target_noise,
            'noise_quality': noise_quality,
            'compliance': interior_compliance
        },
        
        'compliance_summary': {
            'exterior_compliance': exterior_compliance,
            'interior_compliance': interior_compliance,
            'overall_status': 'Compliant' if (exterior_compliance and interior_compliance) else 'Non-Compliant'
        },
        
        'recommendations': recommendations,
        'reference_standard': 'SNI 6729:2013, ASTM E413'
    }
    
    return result


# Test function
if __name__ == '__main__':
    test_params = {
        'sourceNoiseLevel': 75,
        'sourceType': 'traffic',
        'distanceToSource': 30,
        'barrierExists': False,
        'wallMaterial': 'single_glass',
        'roomType': 'office',
        'targetNoiseLevel': 45
    }
    
    result = calculate_acoustics(test_params)
    print(json.dumps(result, indent=2))
