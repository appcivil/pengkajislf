"""
Stormwater Management Core Module
Simulasi Manajemen Air Hujan (Zero Run-off)

Referensi Standar:
- SNI 03-2453-2002: Tata cara perencanaan drainase permukaan
- Permen PU No. 12/PRT/M/2014: Penyelenggaraan sistem drainase perkotaan
- Konsep Bangunan Hijau: Zero Runoff

Author: Smart AI Pengkaji SLF
Version: 1.0.0
"""

import numpy as np
import json

def calculate_stormwater(params):
    """
    Kalkulasi manajemen air hujan untuk Zero Runoff.
    
    Parameters:
        params (dict): Parameter yang berisi:
            - roofArea: Luas atap (m²)
            - parkingArea: Luas parkir (m²)
            - pavedArea: Luas teraspal (m²)
            - grassArea: Luas area rumput/tanah (m²)
            - rainfallIntensity: Intensitas hujan (mm/jam)
            - rainfallDuration: Durasi hujan (jam)
            - location: Lokasi (untuk data curah hujan default)
            - infiltrationRate: Laju infiltrasi tanah (mm/jam)
            - existingInfiltration: Volume infiltrasi existing (m³)
    
    Returns:
        dict: Hasil kalkulasi volume air hujan, kebutuhan sumur resapan, dll.
    """
    # Extract parameters
    roof_area = params.get('roofArea', 200)
    parking_area = params.get('parkingArea', 100)
    paved_area = params.get('pavedArea', 50)
    grass_area = params.get('grassArea', 100)
    
    rainfall_intensity = params.get('rainfallIntensity', 100)  # mm/jam
    rainfall_duration = params.get('rainfallDuration', 2)    # jam
    location = params.get('location', 'Jakarta')
    infiltration_rate = params.get('infiltrationRate', 20)   # mm/jam
    existing_infiltration = params.get('existingInfiltration', 0)  # m³
    
    # Runoff coefficients (SNI standard)
    runoff_coeffs = {
        'roof': 0.95,
        'concrete': 0.85,
        'asphalt': 0.90,
        'pavers': 0.60,
        'grass': 0.35,
        'open_soil': 0.30
    }
    
    # Default rainfall intensity by location (2-year return period, 2-hour duration)
    location_rainfall = {
        'Jakarta': 100,
        'Bandung': 80,
        'Surabaya': 70,
        'Medan': 90,
        'Makassar': 60,
        'Denpasar': 75,
        'Yogyakarta': 85,
        'Semarang': 78,
        'Palembang': 88
    }
    
    if location in location_rainfall and rainfall_intensity == 100:
        rainfall_intensity = location_rainfall[location]
    
    # Calculate catchment areas
    total_area = roof_area + parking_area + paved_area + grass_area
    
    # Calculate runoff volume for each surface type
    # Q = C * I * A (Rational Method)
    # Volume = Q * Duration
    
    # Convert intensity to m/hour
    i_m_per_hour = rainfall_intensity / 1000  # mm to m
    
    # Roof runoff
    roof_runoff_rate = runoff_coeffs['roof'] * i_m_per_hour * roof_area  # m³/hour
    roof_volume = roof_runoff_rate * rainfall_duration  # m³
    
    # Parking runoff
    parking_runoff_rate = runoff_coeffs['asphalt'] * i_m_per_hour * parking_area
    parking_volume = parking_runoff_rate * rainfall_duration
    
    # Paved area runoff
    paved_runoff_rate = runoff_coeffs['concrete'] * i_m_per_hour * paved_area
    paved_volume = paved_runoff_rate * rainfall_duration
    
    # Grass area runoff (minimal)
    grass_runoff_rate = runoff_coeffs['grass'] * i_m_per_hour * grass_area
    grass_volume = grass_runoff_rate * rainfall_duration
    
    # Total runoff
    total_runoff_rate = roof_runoff_rate + parking_runoff_rate + paved_runoff_rate + grass_runoff_rate
    total_runoff_volume = roof_volume + parking_volume + paved_volume + grass_volume
    
    # Infiltration capacity dari grass area
    grass_infiltration_rate = (infiltration_rate / 1000) * grass_area  # m³/hour
    total_infiltration_capacity = grass_infiltration_rate * rainfall_duration
    
    # Effective runoff yang harus ditampung (setelah infiltrasi)
    effective_runoff = max(0, total_runoff_volume - total_infiltration_capacity - existing_infiltration)
    
    # Calculate required infiltration wells (sumur resapan)
    # Standard well: diameter 1m, depth 3m = 2.36 m³ effective volume
    # Porosity 30%
    well_diameter = 1.0  # m
    well_depth = 3.0     # m
    well_volume = np.pi * (well_diameter / 2) ** 2 * well_depth
    effective_well_volume = well_volume * 0.3  # 30% porosity
    
    # Number of wells required
    wells_required = np.ceil(effective_runoff / effective_well_volume) if effective_runoff > 0 else 0
    
    # Alternative: Detention tank
    # Calculate required detention volume (with 30% safety factor)
    detention_volume_required = effective_runoff * 1.3  # 30% safety factor
    
    # Rainwater harvesting potential (PAH - Penampungan Air Hujan)
    # Roof area is best for harvesting
    pah_utilization = roof_volume * 0.8  # 80% of roof runoff can be harvested
    pah_size_recommended = pah_utilization * 1.2  # 20% buffer
    
    # Compliance check (Zero Runoff = 100% managed)
    managed_volume = total_infiltration_capacity + existing_infiltration
    if wells_required > 0:
        managed_volume += wells_required * effective_well_volume
    
    runoff_managed_pct = (managed_volume / total_runoff_volume * 100) if total_runoff_volume > 0 else 100
    
    # Compliance status
    if runoff_managed_pct >= 100:
        compliance_status = 'Compliant'
        compliance_message = 'Memenuhi Zero Runoff - 100% air hujan termanajemen'
    elif runoff_managed_pct >= 70:
        compliance_status = 'Partial'
        compliance_message = f'Partial compliance - {runoff_managed_pct:.1f}% termanajemen'
    else:
        compliance_status = 'Non-Compliant'
        compliance_message = f'Belum memenuhi - hanya {runoff_managed_pct:.1f}% termanajemen'
    
    # Generate recommendations
    recommendations = []
    
    if wells_required > 0:
        recommendations.append(
            f"Diperlukan {int(wells_required)} sumur resapan (Ø1m x 3m) "
            f"untuk menampung {effective_runoff:.1f} m³ air hujan sisa."
        )
    
    if pah_size_recommended > 5:
        recommendations.append(
            f"Potensi PAH (Penampungan Air Hujan): {pah_utilization:.1f} m³. "
            f"Rekomendasi ukuran: {pah_size_recommended:.1f} m³ (inkl. buffer 20%)."
        )
    
    if runoff_managed_pct < 100:
        recommendations.append(
            f"Untuk Zero Runoff, tambah {100 - runoff_managed_pct:.1f}% kapasitas infiltrasi/detensi."
        )
        recommendations.append("Opsi tambahan: permeable pavement, green roof, bioswale.")
    
    # Surface area summary
    surface_summary = {
        'roof': {'area': roof_area, 'runoff_m3': round(roof_volume, 2), 'coefficient': runoff_coeffs['roof']},
        'parking': {'area': parking_area, 'runoff_m3': round(parking_volume, 2), 'coefficient': runoff_coeffs['asphalt']},
        'paved': {'area': paved_area, 'runoff_m3': round(paved_volume, 2), 'coefficient': runoff_coeffs['concrete']},
        'grass': {'area': grass_area, 'runoff_m3': round(grass_volume, 2), 'coefficient': runoff_coeffs['grass'], 
                  'infiltration_m3': round(min(grass_volume, total_infiltration_capacity), 2)}
    }
    
    result = {
        'location': location,
        'rainfall_intensity_mm_per_hr': rainfall_intensity,
        'rainfall_duration_hr': rainfall_duration,
        'total_catchment_area_m2': total_area,
        'total_runoff_volume_m3': round(total_runoff_volume, 2),
        'total_runoff_rate_m3_per_hr': round(total_runoff_rate, 2),
        'infiltration_capacity_m3': round(total_infiltration_capacity, 2),
        'effective_runoff_to_manage_m3': round(effective_runoff, 2),
        'wells_required': int(wells_required),
        'well_specifications': {
            'diameter_m': well_diameter,
            'depth_m': well_depth,
            'effective_volume_m3': round(effective_well_volume, 2)
        },
        'detention_tank_recommended_m3': round(detention_volume_required, 2),
        'rainwater_harvesting_potential_m3': round(pah_utilization, 2),
        'pah_size_recommended_m3': round(pah_size_recommended, 2),
        'runoff_managed_percentage': round(runoff_managed_pct, 1),
        'compliance': {
            'status': compliance_status,
            'message': compliance_message,
            'zero_runoff_achieved': runoff_managed_pct >= 100
        },
        'surface_breakdown': surface_summary,
        'recommendations': recommendations,
        'sni_reference': 'SNI 03-2453-2002'
    }
    
    return result


# Test function
if __name__ == '__main__':
    test_params = {
        'roofArea': 300,
        'parkingArea': 150,
        'pavedArea': 50,
        'grassArea': 200,
        'rainfallIntensity': 100,
        'rainfallDuration': 2,
        'location': 'Jakarta',
        'infiltrationRate': 25
    }
    
    result = calculate_stormwater(test_params)
    print(json.dumps(result, indent=2))
