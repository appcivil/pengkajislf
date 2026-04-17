"""
Sanitation & Water Supply Core Module
Simulasi Kapasitas Sanitasi dan Air Bersih

Referensi Standar:
- SNI 8153:2015: Sistem plumbing dan sanitasi
- SNI 03-7065-2005: Tata cara perencanaan sistem air bersih
- Permenkes: Standar kesehatan lingkungan

Author: Smart AI Pengkaji SLF
Version: 1.0.0
"""

import numpy as np
import json

def calculate_sanitation(params):
    """
    Kalkulasi sistem air bersih dan sanitasi.
    
    Parameters:
        params (dict): Parameter yang berisi:
            - buildingType: Tipe bangunan
            - maxOccupants: Jumlah penghuni maksimum
            - floors: Jumlah lantai
            - floorHeight: Tinggi per lantai (m)
            - hasCentralHotWater: Apakah ada air panas sentral
            - waterSource: Sumber air ('PDAM', 'well', 'both')
            - pdamPressure: Tekanan PDAM (bar)
            - pdamFlowRate: Debit PDAM (L/dt)
    
    Returns:
        dict: Hasil kalkulasi kebutuhan air, tangki, pompa, dll.
    """
    # Extract parameters
    building_type = params.get('buildingType', 'apartment')
    max_occupants = params.get('maxOccupants', 100)
    floors = params.get('floors', 5)
    floor_height = params.get('floorHeight', 3)
    has_central_hot_water = params.get('hasCentralHotWater', False)
    water_source = params.get('waterSource', 'PDAM')
    pdam_pressure = params.get('pdamPressure', 1.5)  # bar
    pdam_flow = params.get('pdamFlowRate', 2.0)  # L/dt
    
    # Water demand standards (L/person/day)
    # SNI 03-7065-2005
    water_demand_standards = {
        'apartment': 150,       # L/person/day
        'office': 100,
        'hotel': 200,
        'hospital': 400,
        'school': 50,
        'market': 30,         # L/m²/day
        'mall': 5,            # L/m²/day
        'factory': 100,
        'mosque': 10,         # L/person/prayer
        'restaurant': 30      # L/m²/day
    }
    
    # Peak factor (simultaneous usage)
    peak_factors = {
        'apartment': 1.5,
        'office': 1.3,
        'hotel': 1.4,
        'hospital': 1.2,
        'school': 2.0,
        'market': 1.8,
        'mall': 1.6,
        'factory': 1.3
    }
    
    # Get water demand
    base_demand = water_demand_standards.get(building_type, 150)
    peak_factor = peak_factors.get(building_type, 1.5)
    
    # Daily water demand
    daily_demand = max_occupants * base_demand
    
    # Peak hourly demand (typically morning 6-8 or evening 18-20)
    # Assume 20% of daily demand in 2 hours
    peak_hourly_demand = daily_demand * 0.20  # L/hour peak
    peak_flow_rate = (peak_hourly_demand / 3600) * peak_factor * 1000  # L/s
    
    # Tank sizing
    # Ground tank: 30% of daily demand minimum
    ground_tank_capacity = daily_demand * 0.30
    
    # Roof tank: 20% of daily demand, or 1-2 hours of peak flow
    roof_tank_capacity = daily_demand * 0.20
    
    # STP (Sewage Treatment Plant) sizing
    # Wastewater = 80% of water consumption
    wastewater_volume = daily_demand * 0.80
    
    # STP capacity (minimum 1 day retention)
    stp_capacity = wastewater_volume
    
    # For BOD calculation
    bod_per_person = 30  # g/person/day
    total_bod = max_occupants * bod_per_person / 1000  # kg/day
    
    # STP design flow (peak)
    stp_design_flow = (wastewater_volume / 24) * 1.5  # m³/hour with peaking
    
    # Pump sizing
    # Static head calculation
    static_head = floors * floor_height  # meters
    
    # Friction loss (estimate 20-30% of static head)
    friction_loss = static_head * 0.25
    
    # Total dynamic head (TDH)
    tdh = static_head + friction_loss + 5  # 5m for outlet pressure
    
    # Pump flow rate = roof tank refill rate (assume 2 hours to fill)
    pump_flow_rate = roof_tank_capacity / 2  # m³/hour
    
    # Pump power (kW) = (ρ × g × Q × H) / (3600 × η)
    # ρ = 1000 kg/m³, g = 9.81 m/s², η = 0.6 (pump efficiency)
    pump_power = (1000 * 9.81 * (pump_flow_rate / 3600) * tdh) / (1000 * 0.6)
    
    # PDAM compliance check
    pdam_min_pressure = 0.2  # bar (minimum untuk plumbing)
    pdam_flow_adequate = pdam_flow >= (daily_demand / 86400)  # L/s comparison
    
    # Compliance
    water_supply_compliance = pdam_pressure >= pdam_min_pressure and pdam_flow_adequate
    
    # Recommendations
    recommendations = []
    
    recommendations.append(
        f"Kebutuhan air: {daily_demand:.0f} L/hari ({base_demand} L/orang) "
        f"untuk {max_occupants} penghuni."
    )
    
    recommendations.append(
        f"Kapasitas tangki disarankan: Ground {ground_tank_capacity:.0f} L, "
        f"Roof {roof_tank_capacity:.0f} L (30% dan 20% dari kebutuhan harian)."
    )
    
    recommendations.append(
        f"Kebutuhan pompa: {pump_flow_rate:.1f} m³/jam, TDH {tdh:.1f}m, "
        f"power estimasi {pump_power:.2f} kW."
    )
    
    recommendations.append(
        f"Kapasitas STP: {stp_capacity:.0f} L/hari (BOD load: {total_bod:.1f} kg/hari)."
    )
    
    if not water_supply_compliance:
        if pdam_pressure < pdam_min_pressure:
            recommendations.append(
                f"Tekanan PDAM ({pdam_pressure} bar) kurang dari minimum ({pdam_min_pressure} bar). "
                f"Pompa booster diperlukan."
            )
        if not pdam_flow_adequate:
            recommendations.append(
                f"Debit PDAM ({pdam_flow:.2f} L/s) tidak mencukupi. "
                f"Pertimbangkan sumur cadangan atau tangki lebih besar."
            )
    else:
        recommendations.append(
            "Supply air dari PDAM memenuhi persyaratan minimum."
        )
    
    if has_central_hot_water:
        hot_water_demand = daily_demand * 0.30  # 30% for hot water
        recommendations.append(
            f"Dengan air panas sentral, tambah kapasitas {hot_water_demand:.0f} L "
            f"untuk sistem water heater."
        )
    
    result = {
        'water_demand': {
            'building_type': building_type,
            'max_occupants': max_occupants,
            'base_demand_lpcd': base_demand,
            'daily_total_liters': round(daily_demand, 2),
            'daily_total_m3': round(daily_demand / 1000, 2),
            'peak_hourly_demand': round(peak_hourly_demand, 2),
            'peak_flow_rate_ls': round(peak_flow_rate, 3)
        },
        
        'tank_requirements': {
            'ground_tank_liters': round(ground_tank_capacity, 2),
            'ground_tank_m3': round(ground_tank_capacity / 1000, 2),
            'roof_tank_liters': round(roof_tank_capacity, 2),
            'roof_tank_m3': round(roof_tank_capacity / 1000, 2),
            'total_storage_m3': round((ground_tank_capacity + roof_tank_capacity) / 1000, 2)
        },
        
        'pump_requirements': {
            'flow_rate_m3_per_hr': round(pump_flow_rate, 2),
            'flow_rate_l_per_s': round(pump_flow_rate * 1000 / 3600, 2),
            'static_head_m': round(static_head, 2),
            'friction_loss_m': round(friction_loss, 2),
            'total_dynamic_head_m': round(tdh, 2),
            'pump_power_kw': round(pump_power, 2)
        },
        
        'stp_requirements': {
            'wastewater_volume_liters': round(wastewater_volume, 2),
            'wastewater_volume_m3': round(wastewater_volume / 1000, 2),
            'stp_capacity_m3': round(stp_capacity / 1000, 2),
            'stp_design_flow_m3_per_hr': round(stp_design_flow, 2),
            'bod_load_kg_per_day': round(total_bod, 2)
        },
        
        'pdam_supply': {
            'pressure_bar': pdam_pressure,
            'flow_rate_l_per_s': pdam_flow,
            'min_required_pressure_bar': pdam_min_pressure,
            'flow_adequate': pdam_flow_adequate,
            'compliance': water_supply_compliance
        },
        
        'compliance': {
            'water_supply_compliance': water_supply_compliance,
            'overall_status': 'Compliant' if water_supply_compliance else 'Non-Compliant'
        },
        
        'recommendations': recommendations,
        'reference_standard': 'SNI 8153:2015, SNI 03-7065-2005'
    }
    
    return result


# Test function
if __name__ == '__main__':
    test_params = {
        'buildingType': 'apartment',
        'maxOccupants': 150,
        'floors': 10,
        'floorHeight': 3,
        'hasCentralHotWater': True,
        'waterSource': 'PDAM',
        'pdamPressure': 1.5,
        'pdamFlowRate': 2.0
    }
    
    result = calculate_sanitation(test_params)
    print(json.dumps(result, indent=2))
