"""
OTTV Core Module
Overall Thermal Transfer Value Calculation

Referensi Standar:
- SNI 6389:2011: Konservasi energi selubung bangunan pada bangunan gedung
- ASHRAE 90.1 (referensi internasional)

OTTV Limit: < 35 Watt/m² untuk Indonesia

Author: Smart AI Pengkaji SLF
Version: 1.0.0
"""

import numpy as np
import json

def calculate_ottv(params):
    """
    Calculate Overall Thermal Transfer Value (OTTV) untuk evaluasi thermal envelope.
    
    Parameters:
        params (dict): Parameter yang berisi:
            - grossWallArea: Luas dinding bruto (m²)
            - windowArea: Luas jendela/kaca (m²)
            - roofArea: Luas atap (m²)
            - floorArea: Luas lantai (m²)
            - uValueWall: U-Value dinding (W/m²K)
            - uValueWindow: U-Value kaca (W/m²K)
            - uValueRoof: U-Value atap (W/m²K)
            - solarFactorWindow: Faktor solar kaca (SC atau SF)
            - wallAbsorptance: Absorptance dinding (0-1)
            - roofAbsorptance: Absorptance atap (0-1)
            - orientationFactors: Faktor orientasi untuk tiap arah
            - dailySolarRadiation: Radiasi solar harian (Wh/m²)
    
    Returns:
        dict: Hasil kalkulasi OTTV dan compliance
    """
    # Extract parameters
    gross_wall_area = params.get('grossWallArea', 500)
    window_area = params.get('windowArea', 150)
    roof_area = params.get('roofArea', 300)
    floor_area = params.get('floorArea', 500)
    
    u_wall = params.get('uValueWall', 2.0)
    u_window = params.get('uValueWindow', 5.8)
    u_roof = params.get('uValueRoof', 1.5)
    
    solar_factor = params.get('solarFactorWindow', 0.7)
    wall_absorptance = params.get('wallAbsorptance', 0.6)
    roof_absorptance = params.get('roofAbsorptance', 0.7)
    
    # Default solar radiation values (Wh/m²/day) - Jakarta average
    default_solar = {
        'N': 800, 'S': 2800, 'E': 2200, 'W': 2200,
        'NE': 1500, 'SE': 2500, 'SW': 2400, 'NW': 1400,
        'horizontal': 5000  # Roof
    }
    solar_radiation = params.get('dailySolarRadiation', default_solar)
    
    # Orientation distribution (default: equal distribution)
    orientation_dist = params.get('orientationDistribution', {
        'N': 0.125, 'S': 0.125, 'E': 0.125, 'W': 0.125,
        'NE': 0.125, 'SE': 0.125, 'SW': 0.125, 'NW': 0.125
    })
    
    # Ambil standard OTTV limit
    try:
        ottv_max = SNI_STANDARDS['THERMAL']['OTTV_MAX']
        wwr_optimal = SNI_STANDARDS['THERMAL']['WWR_OPTIMAL']
        sc_max = SNI_STANDARDS['THERMAL']['SC_MAX']
    except (NameError, KeyError):
        ottv_max = 35  # Watt/m²
        wwr_optimal = 0.4
        sc_max = 0.25
    
    # Calculate Window-to-Wall Ratio (WWR)
    wwr = window_area / gross_wall_area if gross_wall_area > 0 else 0
    opaque_wall_area = gross_wall_area - window_area
    
    # OTTV Formula: OTTV = (1-WWR) × α × Uw × TD + WWR × SF × SC + (1-WWR) × Uw × TDeq
    # Simplified formula berdasarkan SNI 6389:2011
    
    # Temperature differences
    td_eq = 4.5  # Equivalent temperature difference (K)
    td_wall = 5.0  # Wall temperature difference (K)
    
    # Solar factor per orientation
    total_sf = 0
    for orientation, fraction in orientation_dist.items():
        if orientation in solar_radiation:
            sf_orientation = solar_radiation[orientation] / 1000  # Convert to kWh/m²
            total_sf += sf_orientation * fraction
    
    # OTTV calculation components
    # 1. Opaque wall component
    q_opaque = (1 - wwr) * wall_absorptance * u_wall * td_wall
    
    # 2. Window component (conduction + solar)
    # Conduction through window
    q_window_cond = wwr * u_window * td_eq
    # Solar gain through window
    q_window_solar = wwr * solar_factor * total_sf * 10  # Scaling factor
    
    # 3. Roof component
    roof_solar_factor = solar_radiation.get('horizontal', 5000) / 1000
    q_roof = roof_absorptance * u_roof * td_eq + roof_solar_factor * 2
    
    # Weighted OTTV
    envelope_area = gross_wall_area + roof_area
    
    if envelope_area > 0:
        ottv_wall = q_opaque + q_window_cond + q_window_solar
        ottv_roof = q_roof
        ottv_total = (ottv_wall * gross_wall_area + ottv_roof * roof_area) / envelope_area
    else:
        ottv_total = 0
        ottv_wall = 0
        ottv_roof = 0
    
    # Cooling load estimation
    # Q = OTTV × Area + Internal Loads
    internal_load_per_m2 = 25  # W/m² (lights + people + equipment)
    total_cooling_load = (ottv_total * envelope_area) + (internal_load_per_m2 * floor_area)
    
    # AC tonnage required (1 ton = 3517 W)
    ac_tons_required = total_cooling_load / 3517
    ac_tons_per_m2 = ac_tons_required / floor_area if floor_area > 0 else 0
    
    # Compliance check
    compliance = {
        'ottv_max': ottv_max,
        'passes': bool(ottv_total <= ottv_max),
        'wwr_optimal': wwr_optimal,
        'wwr_current': round(wwr, 3),
        'wwr_passes': bool(wwr <= wwr_optimal),
        'sc_max': sc_max,
        'sc_current': solar_factor,
        'sc_passes': bool(solar_factor <= sc_max)
    }
    
    # Energy efficiency rating
    if ottv_total <= 25:
        efficiency_rating = 'Excellent'
        energy_grade = 'A'
    elif ottv_total <= 35:
        efficiency_rating = 'Good'
        energy_grade = 'B'
    elif ottv_total <= 45:
        efficiency_rating = 'Fair'
        energy_grade = 'C'
    else:
        efficiency_rating = 'Poor'
        energy_grade = 'D'
    
    # Cooling cost estimation (assuming 8 hours/day, 250 days/year, Rp 1,500/kWh)
    annual_cooling_hours = 8 * 250
    annual_energy_kwh = (total_cooling_load / 1000) * annual_cooling_hours / 3  # COP assumption
    annual_cost_idr = annual_energy_kwh * 1500
    
    # Recommendations
    recommendations = []
    
    if ottv_total > ottv_max:
        recommendations.append(
            f"OTTV ({ottv_total:.1f} W/m²) melebihi batas SNI ({ottv_max} W/m²). "
            f"Rekomendasi perbaikan:"
        )
        
        if wwr > wwr_optimal:
            recommendations.append(
                f"- Kurangi WWR dari {wwr:.1%} menjadi max {wwr_optimal:.0%} "
                f"(kurangi luas kaca sekitar {(wwr - wwr_optimal) * gross_wall_area:.1f} m²)"
            )
        
        if solar_factor > sc_max:
            recommendations.append(
                f"- Gunakan kaca Low-E atau solar film (SC sekarang: {solar_factor:.2f}, target: {sc_max:.2f})"
            )
        
        if u_wall > 1.5:
            recommendations.append(
                f"- Perbaiki insulasi dinding (U-value sekarang: {u_wall:.2f}, target: <1.5 W/m²K)"
            )
        
        if u_roof > 1.0:
            recommendations.append(
                f"- Tambah insulasi atap (U-value sekarang: {u_roof:.2f}, target: <1.0 W/m²K)"
            )
    else:
        recommendations.append(
            f"OTTV memenuhi standar SNI 6389:2011 ({ottv_total:.1f} W/m² ≤ {ottv_max} W/m²)."
        )
    
    recommendations.append(
        f"Estimasi kebutuhan AC: {ac_tons_required:.1f} ton ({ac_tons_per_m2:.3f} ton/m²). "
        f"Biaya listrik tahunan: Rp {annual_cost_idr:,.0f}"
    )
    
    result = {
        'ottv_total': round(ottv_total, 2),
        'ottv_wall': round(ottv_wall, 2),
        'ottv_roof': round(ottv_roof, 2),
        'compliance': compliance,
        
        'thermal_parameters': {
            'wwr': round(wwr, 3),
            'opaque_wall_area': round(opaque_wall_area, 2),
            'window_area': window_area,
            'gross_wall_area': gross_wall_area,
            'roof_area': roof_area,
            'envelope_area': envelope_area
        },
        
        'cooling_load': {
            'total_watts': round(total_cooling_load, 2),
            'ac_tons_required': round(ac_tons_required, 2),
            'ac_tons_per_m2': round(ac_tons_per_m2, 4),
            'internal_load_watts': round(internal_load_per_m2 * floor_area, 2)
        },
        
        'energy_efficiency': {
            'rating': efficiency_rating,
            'grade': energy_grade,
            'annual_energy_kwh': round(annual_energy_kwh, 2),
            'annual_cost_idr': round(annual_cost_idr, 2)
        },
        
        'recommendations': recommendations,
        'sni_reference': 'SNI 6389:2011'
    }
    
    return result


# Test function
if __name__ == '__main__':
    SNI_STANDARDS = {
        'THERMAL': {
            'OTTV_MAX': 35,
            'WWR_OPTIMAL': 0.4,
            'SC_MAX': 0.25
        }
    }
    
    test_params = {
        'grossWallArea': 600,
        'windowArea': 200,
        'roofArea': 300,
        'floorArea': 300,
        'uValueWall': 2.0,
        'uValueWindow': 5.8,
        'uValueRoof': 1.5,
        'solarFactorWindow': 0.6,
        'wallAbsorptance': 0.6,
        'roofAbsorptance': 0.7
    }
    
    result = calculate_ottv(test_params)
    print(json.dumps(result, indent=2))
