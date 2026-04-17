"""
Solid Waste Management Core Module
Simulasi Manajemen Persampahan (TPS & Routing)

Referensi Standar:
- SNI 19-2454-2002: Tata cara pengelolaan sampah di perkantoran dan permukiman
- Permen LH No. 13/2021: Pengelolaan Sampah Rumah Tangga
- Peraturan Menteri PUPR tentang SLF

Author: Smart AI Pengkaji SLF
Version: 1.0.0
"""

import numpy as np
import json

def calculate_waste_management(params):
    """
    Kalkulasi sistem manajemen persampahan gedung.
    
    Parameters:
        params (dict): Parameter yang berisi:
            - buildingType: Tipe bangunan ('apartment', 'office', 'hotel', 'market', 'hospital')
            - netFloorArea: Luas lantai netto (m²)
            - maxOccupants: Jumlah penghuni maksimum
            - floors: Jumlah lantai
            - operationalDays: Hari operasional per minggu
            - hasCentralAC: Apakah ada AC sentral (bool)
            - recyclingRate: Persentase daur ulang (%)
    
    Returns:
        dict: Hasil kalkulasi timbulan sampah, kebutuhan TPS, dll.
    """
    # Extract parameters
    building_type = params.get('buildingType', 'apartment')
    net_floor_area = params.get('netFloorArea', 1000)  # m²
    max_occupants = params.get('maxOccupants', None)
    floors = params.get('floors', 1)
    operational_days = params.get('operationalDays', 7)
    has_central_ac = params.get('hasCentralAC', False)
    recycling_rate = params.get('recyclingRate', 20) / 100  # Convert to decimal
    
    # Waste generation rates by building type (L/person/day or kg/m²/day)
    # Based on SNI and Permen LH
    waste_rates = {
        'apartment': {
            'per_person_lday': 3.0,      # Liter per person per day
            'per_person_kgday': 0.4,     # kg per person per day
            'occupant_density': 0.03,     # person/m² (residential)
            'organic_pct': 60,
            'anorganic_pct': 35,
            'b3_pct': 5
        },
        'office': {
            'per_person_lday': 2.0,
            'per_person_kgday': 0.25,
            'occupant_density': 0.08,    # person/m² (office)
            'organic_pct': 40,
            'anorganic_pct': 55,
            'b3_pct': 5
        },
        'hotel': {
            'per_person_lday': 4.0,
            'per_person_kgday': 0.5,
            'occupant_density': 0.04,    # person/room, adjusted for area
            'organic_pct': 55,
            'anorganic_pct': 40,
            'b3_pct': 5
        },
        'market': {
            'per_m2_kgday': 5.0,          # kg per m² per day (very high)
            'organic_pct': 80,
            'anorganic_pct': 18,
            'b3_pct': 2
        },
        'hospital': {
            'per_bed_kgday': 2.5,
            'bed_density': 0.01,          # bed/m²
            'organic_pct': 35,
            'anorganic_pct': 40,
            'b3_pct': 25                  # B3 (Bahan Berbahaya dan Beracun) very high
        },
        'mall': {
            'per_person_lday': 2.5,
            'per_person_kgday': 0.3,
            'occupant_density': 0.15,
            'organic_pct': 45,
            'anorganic_pct': 50,
            'b3_pct': 5
        }
    }
    
    # Get waste rate for building type
    rate = waste_rates.get(building_type, waste_rates['apartment'])
    
    # Calculate occupants if not provided
    if max_occupants is None:
        if 'occupant_density' in rate:
            max_occupants = int(net_floor_area * rate['occupant_density'])
        elif 'bed_density' in rate:
            max_occupants = int(net_floor_area * rate['bed_density'])
        else:
            max_occupants = int(net_floor_area * 0.05)  # Default
    
    # Calculate daily waste generation
    if building_type == 'market':
        daily_waste_kg = net_floor_area * rate['per_m2_kgday']
        daily_waste_l = daily_waste_kg * 3  # Approximate conversion
    elif building_type == 'hospital':
        num_beds = max_occupants  # In this context, max_occupants = beds for hospital
        daily_waste_kg = num_beds * rate['per_bed_kgday']
        daily_waste_l = daily_waste_kg * 3
    else:
        daily_waste_kg = max_occupants * rate['per_person_kgday']
        daily_waste_l = max_occupants * rate['per_person_lday']
    
    # Weekly and monthly waste
    weekly_waste_kg = daily_waste_kg * operational_days
    monthly_waste_kg = weekly_waste_kg * 4.3  # Average weeks per month
    annual_waste_kg = daily_waste_kg * 365
    
    # Waste composition
    organic_kg = daily_waste_kg * (rate['organic_pct'] / 100)
    anorganic_kg = daily_waste_kg * (rate['anorganic_pct'] / 100)
    b3_kg = daily_waste_kg * (rate['b3_pct'] / 100)
    
    # Recyclable waste (from anorganic)
    recyclable_kg = anorganic_kg * recycling_rate
    residual_kg = daily_waste_kg - recyclable_kg
    
    # TPS (Tempat Pembuangan Sementara) Calculation
    # Standard: TPS capacity should hold 1-3 days of waste
    # Area requirement: 0.1-0.2 m² per m² floor area for high-rise
    
    tps_capacity_days = 2  # Standard holding period
    tps_required_volume_m3 = (daily_waste_l / 1000) * tps_capacity_days * 1.5  # 50% safety factor
    
    # TPS floor area (assuming 1.5m height)
    tps_required_area_m2 = tps_required_volume_m3 / 1.5
    
    # Alternative: per floor calculation for high-rise
    if floors > 4:
        # For high-rise, TPS needed per every few floors
        tps_per_floors = 4
        num_tps_locations = int(np.ceil(floors / tps_per_floors))
        tps_per_location_m2 = tps_required_area_m2 / num_tps_locations
    else:
        num_tps_locations = 1
        tps_per_location_m2 = tps_required_area_m2
    
    # Collection schedule calculation
    # Based on waste generation rate
    if daily_waste_kg > 1000:
        collection_frequency = 'daily'
        collection_interval_days = 1
    elif daily_waste_kg > 500:
        collection_frequency = 'twice_weekly'
        collection_interval_days = 3
    elif daily_waste_kg > 200:
        collection_frequency = 'weekly'
        collection_interval_days = 7
    else:
        collection_frequency = 'twice_weekly'
        collection_interval_days = 3
    
    # B3 waste requires special handling - more frequent collection
    if b3_kg > 10:  # More than 10kg B3 per day
        b3_collection = 'daily'
    else:
        b3_collection = 'twice_weekly'
    
    # Truck requirement calculation
    # Assume 5-ton truck capacity
    truck_capacity_kg = 5000
    waste_per_collection = daily_waste_kg * collection_interval_days
    trucks_per_collection = np.ceil(waste_per_collection / truck_capacity_kg)
    
    # Compliance check
    # Minimum TPS area per SNI
    min_tps_area_required = net_floor_area * 0.001  # 0.1% of floor area minimum
    tps_compliance = tps_required_area_m2 >= min_tps_area_required
    
    # Waste at source separation compliance
    waste_separation_compliance = recycling_rate >= 0.15  # Minimum 15%
    
    # Generate recommendations
    recommendations = []
    
    recommendations.append(
        f"Timbulan sampah: {daily_waste_kg:.1f} kg/hari ({daily_waste_l:.0f} L/hari) "
        f"untuk {max_occupants} penghuni."
    )
    
    recommendations.append(
        f"Komposisi: Organik {rate['organic_pct']}% ({organic_kg:.1f} kg), "
        f"Anorganik {rate['anorganic_pct']}% ({anorganic_kg:.1f} kg), "
        f"B3 {rate['b3_pct']}% ({b3_kg:.1f} kg)."
    )
    
    recommendations.append(
        f"Luas TPS minimal yang diperlukan: {tps_required_area_m2:.1f} m² "
        f"(kapasitas {tps_capacity_days} hari timbulan)."
    )
    
    if floors > 4:
        recommendations.append(
            f"Untuk gedung bertingkat ({floors} lantai), disarankan {num_tps_locations} lokasi TPS."
        )
    
    recommendations.append(
        f"Frekuensi pengangkutan: {collection_frequency} "
        f"({trucks_per_collection:.0f} truk {waste_per_collection:.0f} kg per koleksi)."
    )
    
    if b3_kg > 0:
        recommendations.append(
            f"Sampah B3 sebesar {b3_kg:.1f} kg/hari memerlukan penanganan khusus "
            f"dengan frekuensi pengangkutan {b3_collection}."
        )
    
    if not waste_separation_compliance:
        recommendations.append(
            "Tingkatkan pemilahan sampah (recycling rate < 15%). "
            "Target: minimal 20% untuk memenuhi standar."
        )
    
    if has_central_ac:
        recommendations.append(
            "Sistem AC sentral menghasilkan filter/sampah khusus. "
            "Pastikan ada prosedur pengelolaan HVAC waste."
        )
    
    result = {
        'building_type': building_type,
        'max_occupants': max_occupants,
        'net_floor_area_m2': net_floor_area,
        'floors': floors,
        
        'waste_generation': {
            'daily_kg': round(daily_waste_kg, 2),
            'daily_liters': round(daily_waste_l, 1),
            'weekly_kg': round(weekly_waste_kg, 2),
            'monthly_kg': round(monthly_waste_kg, 2),
            'annual_kg': round(annual_waste_kg, 2)
        },
        
        'waste_composition': {
            'organic_kg': round(organic_kg, 2),
            'organic_pct': rate['organic_pct'],
            'anorganic_kg': round(anorganic_kg, 2),
            'anorganic_pct': rate['anorganic_pct'],
            'b3_kg': round(b3_kg, 2),
            'b3_pct': rate['b3_pct'],
            'recyclable_kg': round(recyclable_kg, 2),
            'residual_kg': round(residual_kg, 2)
        },
        
        'tps_requirements': {
            'capacity_days': tps_capacity_days,
            'required_volume_m3': round(tps_required_volume_m3, 2),
            'required_area_m2': round(tps_required_area_m2, 2),
            'min_required_area_m2': round(min_tps_area_required, 2),
            'compliance': tps_compliance,
            'num_locations': num_tps_locations,
            'area_per_location_m2': round(tps_per_location_m2, 2) if floors > 4 else None
        },
        
        'collection_schedule': {
            'frequency': collection_frequency,
            'interval_days': collection_interval_days,
            'trucks_per_collection': int(trucks_per_collection),
            'waste_per_collection_kg': round(waste_per_collection, 2),
            'b3_collection_frequency': b3_collection
        },
        
        'compliance': {
            'tps_compliance': tps_compliance,
            'waste_separation_compliance': waste_separation_compliance,
            'overall_status': 'Compliant' if (tps_compliance and waste_separation_compliance) else 'Partial'
        },
        
        'recommendations': recommendations,
        'reference_standard': 'SNI 19-2454-2002, Permen LH No. 13/2021'
    }
    
    return result


# Test function
if __name__ == '__main__':
    test_params = {
        'buildingType': 'apartment',
        'netFloorArea': 5000,
        'maxOccupants': 150,
        'floors': 10,
        'operationalDays': 7,
        'recyclingRate': 25
    }
    
    result = calculate_waste_management(test_params)
    print(json.dumps(result, indent=2))
