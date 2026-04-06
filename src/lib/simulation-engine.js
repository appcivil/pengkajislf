// ============================================================
//  PYODIDE SIMULATION ENGINE
//  Fitur #15: Simulasi Pencahayaan & Ventilasi (SciPy)
//  Fitur #16: Simulasi Jalur Evakuasi (networkx)
//  Fitur #17: NDT Simulator (SciPy)
// ============================================================

import { supabase } from './supabase.js';

// Global Pyodide instance
let pyodideInstance = null;
let pyodideReady = false;

/**
 * Initialize Pyodide dengan lazy loading
 */
export async function initPyodide() {
  if (pyodideInstance) return pyodideInstance;
  
  if (!window.loadPyodide) {
    throw new Error('Pyodide not loaded. Add <script src="https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js"></script> to HTML');
  }
  
  console.log('[Pyodide] Initializing...');
  pyodideInstance = await window.loadPyodide();
  
  // Install required packages
  await pyodideInstance.loadPackage('micropip');
  await pyodideInstance.runPythonAsync(`
import micropip
await micropip.install('numpy')
await micropip.install('scipy')
await micropip.install('networkx')
print("[Pyodide] All packages loaded successfully")
  `);
  
  pyodideReady = true;
  console.log('[Pyodide] Ready');
  return pyodideInstance;
}

/**
 * Fitur #15: Simulasi Pencahayaan (Daylight Factor Calculation)
 * Menggunakan SciPy untuk simulasi pencahayaan alami
 */
export async function simulateLighting(roomDimensions, windowConfig, options = {}) {
  const pyodide = await initPyodide();
  
  const { length, width, height } = roomDimensions;
  const { windowArea, windowHeight, orientation } = windowConfig;
  const { latitude = -6.2, skyCondition = 'clear' } = options;
  
  const pythonCode = `
import numpy as np
from scipy import interpolate

# Room parameters
length = ${length}
width = ${width}
height = ${height}
window_area = ${windowArea}
window_height = ${windowHeight}
orientation = "${orientation}"  # N, S, E, W
latitude = ${latitude}  # Jakarta: -6.2
sky_condition = "${skyCondition}"

# Grid points for calculation (1m x 1m grid)
x_points = np.arange(0.5, length, 1.0)
y_points = np.arange(0.5, width, 1.0)
X, Y = np.meshgrid(x_points, y_points)

# Calculate Daylight Factor (DF) untuk setiap titik
# DF = (E_internal / E_external) * 100%
# Simplified model berdasarkan CIE Overcast Sky method

def calculate_daylight_factor(x, y, height, window_area, window_height, orientation):
    # Distance from window wall (assume window di y=0)
    distance = y
    
    # Angle of visible sky
    h_window = window_height
    theta = np.arctan2(h_window, distance) if distance > 0 else np.pi/2
    
    # Solid angle approximation
    omega = theta * (window_area / h_window) / (2 * np.pi)
    
    # Orientation factor
    orient_factor = {
        'N': 0.9, 'S': 1.2, 'E': 1.0, 'W': 1.0,
        'NE': 0.95, 'NW': 0.95, 'SE': 1.1, 'SW': 1.1
    }.get(orientation, 1.0)
    
    # Sky condition factor
    sky_factor = {'clear': 1.3, 'overcast': 1.0, 'partly': 1.15}.get(sky_condition, 1.0)
    
    # Basic DF calculation (simplified)
    df = omega * orient_factor * sky_factor * 100
    
    # Attenuation dengan jarak
    attenuation = np.exp(-distance / (2 * height))
    
    return min(df * attenuation, 15)  # Max DF 15%

# Calculate untuk semua grid points
df_values = np.zeros_like(X)
illuminance = np.zeros_like(X)

# External illuminance (Jakarta average)
E_external = 10000  # lux (clear day)
if sky_condition == 'overcast':
    E_external = 5000
elif sky_condition == 'partly':
    E_internal = 7500

for i in range(X.shape[0]):
    for j in range(X.shape[1]):
        df = calculate_daylight_factor(X[i,j], Y[i,j], height, window_area, window_height, orientation)
        df_values[i,j] = df
        illuminance[i,j] = df / 100 * E_external

# Statistics
df_avg = np.mean(df_values)
df_min = np.min(df_values)
df_max = np.max(df_values)
illuminance_avg = np.mean(illuminance)

# Compliance check (SNI 03-2396-2001)
compliance = {
    'df_min_required': 0.5,  # 0.5% minimum
    'df_avg_required': 1.0,  # 1.0% average
    'passes_df_min': df_min >= 0.5,
    'passes_df_avg': df_avg >= 1.0,
    'illuminance_min': 150,  # lux
    'passes_illuminance': np.percentile(illuminance, 10) >= 150
}

# Hasil untuk setiap zone
zones = []
zone_size_x = max(1, length // 3)
zone_size_y = max(1, width // 3)

for zx in range(3):
    for zy in range(3):
        x_start = int(zx * len(x_points) / 3)
        x_end = int((zx + 1) * len(x_points) / 3)
        y_start = int(zy * len(y_points) / 3)
        y_end = int((zy + 1) * len(y_points) / 3)
        
        zone_df = np.mean(df_values[y_start:y_end, x_start:x_end])
        zone_ill = np.mean(illuminance[y_start:y_end, x_start:x_end])
        
        zones.append({
            'zone': f"{['Depan', 'Tengah', 'Belakang'][zx]}-{['Kiri', 'Tengah', 'Kanan'][zy]}",
            'daylight_factor': round(float(zone_df), 2),
            'illuminance': round(float(zone_ill), 1),
            'adequate': zone_ill >= 150
        })

result = {
    'daylight_factor_avg': round(float(df_avg), 2),
    'daylight_factor_min': round(float(df_min), 2),
    'daylight_factor_max': round(float(df_max), 2),
    'illuminance_avg': round(float(illuminance_avg), 1),
    'illuminance_min': round(float(np.min(illuminance)), 1),
    'illuminance_max': round(float(np.max(illuminance)), 1),
    'compliance': compliance,
    'zones': zones,
    'recommendations': []
}

# Generate recommendations
if df_avg < 1.0:
    result['recommendations'].append("Daylight factor rata-rata di bawah 1%. Pertimbangkan penambahan jendela atau skylight.")
if df_min < 0.5:
    result['recommendations'].append("Daylight factor minimum di bawah 0.5%. Area tertentu memerlukan pencahayaan buatan tambahan.")
if np.percentile(illuminance, 10) < 150:
    result['recommendations'].append("Illuminance di beberapa area di bawah 150 lux. Perlu tambahan lampu artificial lighting.")

import json
json.dumps(result)
  `;
  
  const result = await pyodide.runPythonAsync(pythonCode);
  return JSON.parse(result);
}

/**
 * Fitur #15: Simulasi Ventilasi (Air Changes per Hour)
 */
export async function simulateVentilation(roomDimensions, openingConfig, options = {}) {
  const pyodide = await initPyodide();
  
  const { length, width, height } = roomDimensions;
  const { windowArea, windowHeight, openablePercentage = 50 } = openingConfig;
  const { windSpeed = 2.0, windDirection = 'N', temperature = 30 } = options;
  
  const pythonCode = `
import numpy as np

# Room parameters
length = ${length}
width = ${width}
height = ${height}
room_volume = length * width * height

# Opening parameters
window_area = ${windowArea}
openable_pct = ${openablePercentage} / 100
effective_area = window_area * openable_pct

# Environmental conditions
wind_speed = ${windSpeed}  # m/s
wind_direction = "${windDirection}"
temperature = ${temperature}  # Celsius

# Calculate Air Changes per Hour (ACH)
# Single-sided ventilation (simplified model)

# Pressure difference dari angin
# Cp (pressure coefficient) depends on wind direction
Cp_values = {
    'N': {'windward': 0.8, 'leeward': -0.4},
    'S': {'windward': 0.8, 'leeward': -0.4},
    'E': {'windward': 0.8, 'leeward': -0.4},
    'W': {'windward': 0.8, 'leeward': -0.4}
}

Cp = Cp_values.get(wind_direction, {'windward': 0.8, 'leeward': -0.4})
delta_P = 0.5 * 1.2 * (wind_speed ** 2) * (Cp['windward'] - Cp['leeward'])

# Discharge coefficient
Cd = 0.6

# Airflow rate (m³/s) - simplified orifice equation
if delta_P > 0:
    Q = Cd * effective_area * np.sqrt(2 * abs(delta_P) / 1.2)
else:
    Q = Cd * effective_area * 0.1  # Minimum natural ventilation

# Add stack effect (thermal buoyancy)
# Simplified calculation
delta_T = 3  # Assume 3°C difference inside-outside
h_npl = ${windowHeight} / 2  # Neutral pressure level
stack_pressure = 9.8 * h_npl * abs(delta_T) / (273 + temperature)
Q_stack = Cd * effective_area * np.sqrt(2 * stack_pressure / 1.2)

# Total airflow
total_Q = np.sqrt(Q**2 + Q_stack**2)

# Air Changes per Hour
ach = (total_Q * 3600) / room_volume

# Wind-driven vs stack-driven ratio
wind_driven_pct = (Q / total_Q) * 100 if total_Q > 0 else 50

# SNI compliance (SNI 03-6572-2001)
# Minimum 5-6 ACH untuk ruang kerja
compliance = {
    'ach_required': 5.0,
    'passes': ach >= 5.0,
    'category': 'Good' if ach >= 6 else 'Adequate' if ach >= 4 else 'Poor'
}

# Temperature distribution (simplified)
# Assume linear gradient dari jendela
zones = []
for i in range(3):  # Near window, middle, far
    distance_ratio = i / 2  # 0 to 1
    temp_zone = temperature - (2 * (1 - distance_ratio))  # Cooler near window
    zones.append({
        'zone': ['Dekat Jendela', 'Tengah Ruang', 'Jauh dari Jendela'][i],
        'temperature': round(float(temp_zone), 1),
        'air_speed': round(float(wind_speed * (1 - distance_ratio * 0.5)), 2),
        'comfort': 'Good' if temp_zone < 28 else 'Warm' if temp_zone < 30 else 'Hot'
    })

result = {
    'air_changes_per_hour': round(float(ach), 2),
    'airflow_rate': round(float(total_Q), 3),
    'room_volume': room_volume,
    'wind_driven_percentage': round(float(wind_driven_pct), 1),
    'stack_driven_percentage': round(float(100 - wind_driven_pct), 1),
    'compliance': compliance,
    'zones': zones,
    'recommendations': []
}

if ach < 5:
    result['recommendations'].append(f"Ventilasi alami ({ach:.1f} ACH) di bawah standar SNI (5 ACH). Pertimbangkan:")
    result['recommendations'].append("- Tambah luas bukaan jendela")
    result['recommendations'].append("- Gunakan cross-ventilation dengan jendela di dinding berlawanan")
    result['recommendations'].append("- Pertimbangkan mechanical ventilation (exhaust fan)")

if temperature > 29:
    result['recommendations'].append("Suhu ruang tinggi. Ventilasi silang atau AC disarankan.")

import json
json.dumps(result)
  `;
  
  const result = await pyodide.runPythonAsync(pythonCode);
  return JSON.parse(result);
}

/**
 * Fitur #16: Simulasi Jalur Evakuasi dengan NetworkX
 */
export async function simulateEvacuation(buildingLayout, population, options = {}) {
  const pyodide = await initPyodide();
  
  const { nodes, edges, exits } = buildingLayout;
  const { numPeople, mobilityFactor = 1.0 } = population;
  const { walkingSpeed = 1.2, reactionTime = 60 } = options;
  
  const pythonCode = `
import networkx as nx
import numpy as np

# Build graph
G = nx.Graph()

# Add nodes with positions
nodes = ${JSON.stringify(nodes)}
edges = ${JSON.stringify(edges)}
exits = ${JSON.stringify(exits)}

for node in nodes:
    G.add_node(node['id'], pos=(node['x'], node['y']), type=node.get('type', 'room'))

for edge in edges:
    # Weight = distance / width factor
    distance = edge.get('length', 5.0)
    width_factor = edge.get('width', 1.0) / 1.2  # Normalize to 1.2m
    capacity = min(edge.get('width', 1.0) * 100, 200)  # people per hour per meter
    
    G.add_edge(edge['from'], edge['to'], 
               weight=distance / width_factor,
               length=distance,
               width=edge.get('width', 1.0),
               capacity=capacity)

# Population parameters
num_people = ${numPeople}
mobility_factor = ${mobilityFactor}  # 1.0 = normal, 0.5 = elderly/disabled
walking_speed = ${walkingSpeed} * mobility_factor  # m/s
reaction_time = ${reactionTime}  # seconds

# Calculate shortest paths from all nodes to nearest exit
node_evacuation = {}

for node_id in G.nodes():
    if node_id in exits:
        continue
        
    min_time = float('inf')
    best_exit = None
    best_path = None
    
    for exit_id in exits:
        try:
            path = nx.shortest_path(G, node_id, exit_id, weight='weight')
            path_length = nx.shortest_path_length(G, node_id, exit_id, weight='length')
            
            # Calculate travel time
            travel_time = path_length / walking_speed
            total_time = reaction_time + travel_time
            
            if total_time < min_time:
                min_time = total_time
                best_exit = exit_id
                best_path = path
        except nx.NetworkXNoPath:
            continue
    
    if best_exit:
        node_evacuation[node_id] = {
            'nearest_exit': best_exit,
            'evacuation_time': round(min_time, 1),
            'path_length': round(path_length, 1),
            'path': best_path
        }

# Identify bottlenecks
def calculate_edge_flow():
    edge_usage = {}
    for node_id, evac in node_evacuation.items():
        path = evac['path']
        for i in range(len(path) - 1):
            edge_key = tuple(sorted([path[i], path[i+1]]))
            edge_usage[edge_key] = edge_usage.get(edge_key, 0) + 1
    return edge_usage

edge_flow = calculate_edge_flow()
bottlenecks = []

for edge_key, flow in edge_flow.items():
    edge_data = G.edges[edge_key]
    capacity = edge_data['capacity'] / 3600  # per second
    width = edge_data['width']
    
    if flow > capacity * 10:  # Flow exceeds capacity
        bottlenecks.append({
            'edge': edge_key,
            'flow': flow,
            'capacity': round(capacity * 3600),
            'width': width,
            'severity': 'High' if flow > capacity * 20 else 'Medium'
        })

# Overall statistics
all_times = [e['evacuation_time'] for e in node_evacuation.values()]
avg_evac_time = np.mean(all_times) if all_times else 0
max_evac_time = max(all_times) if all_times else 0

# Compliance dengan SNI 03-1736-2012 (Gedung Tahan Gempa)
# Maximum evacuation time: 3-5 minutes tergantung tingkat bahaya
compliance = {
    'max_time_required': 300,  # 5 minutes
    'passes': max_evac_time <= 300,
    'average_time': round(float(avg_evac_time), 1),
    'max_time': round(float(max_evac_time), 1)
}

result = {
    'total_nodes': len(nodes),
    'total_exits': len(exits),
    'population': num_people,
    'average_evacuation_time': round(float(avg_evac_time), 1),
    'maximum_evacuation_time': round(float(max_evac_time), 1),
    'compliance': compliance,
    'critical_nodes': [k for k, v in node_evacuation.items() if v['evacuation_time'] > 240],
    'bottlenecks': sorted(bottlenecks, key=lambda x: x['flow'], reverse=True)[:5],
    'node_details': node_evacuation,
    'recommendations': []
}

if max_evac_time > 300:
    result['recommendations'].append(f"Waktu evakuasi maksimum ({max_evac_time:.0f}s) melebihi standar (300s).")
    result['recommendations'].append("Pertimbangkan: Tambah pintu keluar, lebarkan koridor, atau tambah tangga darurat.")

if len(bottlenecks) > 0:
    result['recommendations'].append(f"Teridentifikasi {len(bottlenecks)} bottleneck. Perlu perlebaran koridor/tambah exit.")

if avg_evac_time > 180:
    result['recommendations'].append("Rata-rata waktu evakuasi tinggi. Pertimbangkan penambahan signage dan emergency lighting.")

import json
json.dumps(result)
  `;
  
  const result = await pyodide.runPythonAsync(pythonCode);
  return JSON.parse(result);
}

/**
 * Fitur #17: NDT (Non-Destructive Test) Simulator
 * Simulasi uji UPV, Rebound Hammer, dan GPR
 */
export async function simulateNDT(testType, parameters, options = {}) {
  const pyodide = await initPyodide();
  
  const { material, age, exposure } = parameters;
  const { numTestPoints = 10, confidence = 0.95 } = options;
  
  let pythonCode = '';
  
  switch (testType) {
    case 'rebound_hammer':
      pythonCode = `
import numpy as np
from scipy import stats

# Rebound Hammer Test (Schmidt Hammer)
# Estimate concrete compressive strength

material = "${material}"  # concrete, mortar
age_years = ${age}
exposure = "${exposure}"  # mild, moderate, severe
num_points = ${numTestPoints}

# Base strength berdasarkan umur dan eksposur
base_strength = {
    'mild': {5: 35, 10: 30, 15: 25, 20: 20},
    'moderate': {5: 30, 10: 25, 15: 20, 20: 15},
    'severe': {5: 25, 10: 20, 15: 15, 20: 10}
}.get(exposure, {}).get(int(age_years/5)*5, 20)

# Simulate rebound values (R)
# R typically 20-50 for concrete
R_mean = 20 + (base_strength / 50) * 30
R_std = 3.0

rebound_values = np.random.normal(R_mean, R_std, num_points)
rebound_values = np.clip(rebound_values, 10, 60)

# Convert to compressive strength (simplified formula)
# fc = 0.725 * R + 12.5 (MPa) untuk concrete
fc_estimates = 0.725 * rebound_values + 12.5

# Statistics
fc_mean = np.mean(fc_estimates)
fc_std = np.std(fc_estimates)
ci = stats.t.interval(${confidence}, num_points-1, loc=fc_mean, scale=fc_std/np.sqrt(num_points))

# SNI compliance (SNI 2847:2019)
# K-250 = 20.75 MPa, K-300 = 24.9 MPa, K-350 = 29.05 MPa
fc_required = 20.75  # Minimum K-250
compliance = {
    'fc_mean': round(float(fc_mean), 2),
    'fc_required': fc_required,
    'passes': fc_mean >= fc_required,
    'category': 'Good' if fc_mean >= 30 else 'Fair' if fc_mean >= 20 else 'Poor'
}

result = {
    'test_type': 'Rebound Hammer (Schmidt)',
    'material': material,
    'age_years': age_years,
    'num_test_points': num_points,
    'rebound_values': [round(float(r), 1) for r in rebound_values],
    'rebound_mean': round(float(np.mean(rebound_values)), 1),
    'fc_estimates': [round(float(fc), 2) for fc in fc_estimates],
    'fc_mean': round(float(fc_mean), 2),
    'fc_std': round(float(fc_std), 2),
    'confidence_interval': [round(float(ci[0]), 2), round(float(ci[1]), 2)],
    'compliance': compliance,
    'recommendations': []
}

if fc_mean < fc_required:
    result['recommendations'].append(f"Kekuatan beton ({fc_mean:.1f} MPa) di bawah minimum K-250 ({fc_required} MPa).")
    result['recommendations'].append("Rekomendasi: Lakukan core test untuk verifikasi, pertimbangkan retrofit struktur.")

if fc_std > 5:
    result['recommendations'].append("Variasi kekuatan tinggi (heterogenitas). Perlu investigasi lebih detail.")

import json
json.dumps(result)
      `;
      break;
      
    case 'upv':
      pythonCode = `
import numpy as np

# Ultrasonic Pulse Velocity Test
# Detect cracks and estimate concrete quality

age_years = ${age}
exposure = "${exposure}"
num_points = ${numTestPoints}

# Base pulse velocity (km/s)
# Excellent: >4.0, Good: 3.5-4.0, Doubtful: 3.0-3.5, Poor: <3.0
if exposure == 'mild':
    base_velocity = 4.2 - (age_years * 0.03)
elif exposure == 'moderate':
    base_velocity = 4.0 - (age_years * 0.05)
else:  # severe
    base_velocity = 3.8 - (age_years * 0.08)

# Simulate measurements dengan variasi lokasi
velocities = []
for i in range(num_points):
    # Some points mungkin ada crack
    crack_factor = np.random.choice([1.0, 1.0, 1.0, 0.7], p=[0.7, 0.1, 0.1, 0.1])
    v = base_velocity * crack_factor * np.random.normal(1.0, 0.05)
    velocities.append(max(v, 2.0))

velocities = np.array(velocities)
v_mean = np.mean(velocities)
v_min = np.min(velocities)

# Quality rating
quality = 'Excellent' if v_mean > 4.0 else 'Good' if v_mean > 3.5 else 'Doubtful' if v_mean > 3.0 else 'Poor'

# Crack detection
potential_cracks = np.sum(velocities < 3.0)

result = {
    'test_type': 'Ultrasonic Pulse Velocity (UPV)',
    'pulse_velocities': [round(float(v), 2) for v in velocities],
    'velocity_mean': round(float(v_mean), 2),
    'velocity_min': round(float(v_min), 2),
    'velocity_max': round(float(np.max(velocities)), 2),
    'quality_rating': quality,
    'potential_cracks_detected': int(potential_cracks),
    'homogeneity': 'Uniform' if np.std(velocities) < 0.3 else 'Variable' if np.std(velocities) < 0.6 else 'Non-uniform',
    'recommendations': []
}

if quality in ['Doubtful', 'Poor']:
    result['recommendations'].append(f"Kualitas beton {quality.lower()} (VP: {v_mean:.2f} km/s). Perlu investigasi detail.")
if potential_cracks > 0:
    result['recommendations'].append(f"Terdeteksi {potential_cracks} lokasi dengan potensi retak.")
    result['recommendations'].append("Rekomendasi: Visual inspection, core test, atau GPR untuk mapping kerusakan.")

import json
json.dumps(result)
      `;
      break;
      
    default:
      throw new Error('Unknown NDT test type: ' + testType);
  }
  
  const result = await pyodide.runPythonAsync(pythonCode);
  return JSON.parse(result);
}

/**
 * UI Component untuk Simulation Controls
 */
export function createSimulationPanel(type, onRun) {
  const container = document.createElement('div');
  container.className = 'simulation-panel';
  
  const configs = {
    lighting: {
      title: 'Simulasi Pencahayaan',
      fields: [
        { id: 'length', label: 'Panjang Ruang (m)', type: 'number', value: 10 },
        { id: 'width', label: 'Lebar Ruang (m)', type: 'number', value: 8 },
        { id: 'height', label: 'Tinggi Ruang (m)', type: 'number', value: 3 },
        { id: 'windowArea', label: 'Luas Jendela (m²)', type: 'number', value: 6 },
        { id: 'windowHeight', label: 'Tinggi Jendela (m)', type: 'number', value: 1.5 },
        { id: 'orientation', label: 'Orientasi', type: 'select', options: ['N', 'S', 'E', 'W'] },
      ]
    },
    ventilation: {
      title: 'Simulasi Ventilasi',
      fields: [
        { id: 'length', label: 'Panjang (m)', type: 'number', value: 10 },
        { id: 'width', label: 'Lebar (m)', type: 'number', value: 8 },
        { id: 'height', label: 'Tinggi (m)', type: 'number', value: 3 },
        { id: 'windowArea', label: 'Luas Bukaan (m²)', type: 'number', value: 4 },
        { id: 'windSpeed', label: 'Kecepatan Angin (m/s)', type: 'number', value: 2 },
      ]
    },
    evacuation: {
      title: 'Simulasi Evakuasi',
      fields: [
        { id: 'numPeople', label: 'Jumlah Orang', type: 'number', value: 100 },
        { id: 'walkingSpeed', label: 'Kecepatan Jalan (m/s)', type: 'number', value: 1.2 },
        { id: 'reactionTime', label: 'Waktu Reaksi (s)', type: 'number', value: 60 },
      ]
    },
    ndt: {
      title: 'NDT Simulator',
      fields: [
        { id: 'testType', label: 'Jenis Uji', type: 'select', options: ['rebound_hammer', 'upv'] },
        { id: 'age', label: 'Umur Bangunan (th)', type: 'number', value: 10 },
        { id: 'exposure', label: 'Eksposur', type: 'select', options: ['mild', 'moderate', 'severe'] },
      ]
    }
  };
  
  const config = configs[type];
  if (!config) return null;
  
  container.innerHTML = `
    <div class="card" style="padding:20px">
      <h3 style="margin-bottom:16px"><i class="fas fa-flask"></i> ${config.title}</h3>
      <div class="simulation-form" style="display:grid;gap:12px">
        ${config.fields.map(f => `
          <div>
            <label style="display:block;font-size:12px;color:var(--text-tertiary);margin-bottom:4px">${f.label}</label>
            ${f.type === 'select' ? `
              <select id="sim-${f.id}" class="input" style="width:100%">
                ${f.options.map(o => `<option value="${o}">${o}</option>`).join('')}
              </select>
            ` : `
              <input type="${f.type}" id="sim-${f.id}" class="input" value="${f.value}" style="width:100%">
            `}
          </div>
        `).join('')}
      </div>
      <button class="btn btn-primary" id="sim-run" style="width:100%;margin-top:16px">
        <i class="fas fa-play"></i> Jalankan Simulasi
      </button>
      <div class="simulation-result" style="margin-top:16px"></div>
    </div>
  `;
  
  const runBtn = container.querySelector('#sim-run');
  const resultDiv = container.querySelector('.simulation-result');
  
  runBtn.addEventListener('click', async () => {
    runBtn.disabled = true;
    runBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menjalankan...';
    resultDiv.innerHTML = '';
    
    try {
      const params = {};
      config.fields.forEach(f => {
        const el = container.querySelector(`#sim-${f.id}`);
        params[f.id] = f.type === 'number' ? parseFloat(el.value) : el.value;
      });
      
      const result = await onRun(params);
      resultDiv.innerHTML = renderSimulationResult(result);
    } catch (err) {
      resultDiv.innerHTML = `<div style="color:var(--danger)">Error: ${err.message}</div>`;
    } finally {
      runBtn.disabled = false;
      runBtn.innerHTML = '<i class="fas fa-play"></i> Jalankan Simulasi';
    }
  });
  
  return container;
}

function renderSimulationResult(result) {
  return `
    <div style="background:var(--bg-subtle);padding:16px;border-radius:8px">
      <h4 style="margin-bottom:12px">Hasil Simulasi</h4>
      <pre style="font-size:12px;overflow-x:auto">${JSON.stringify(result, null, 2)}</pre>
    </div>
  `;
}

// Export all
export default {
  initPyodide,
  simulateLighting,
  simulateVentilation,
  simulateEvacuation,
  simulateNDT,
  createSimulationPanel,
  saveSimulasi,
  loadSimulasi,
  getSimulasiSummary,
  deleteSimulasi,
  updateSimulasiStatus
};


/**
 * Save hasil simulasi ke database
 * @param {string} proyekId - ID proyek
 * @param {string} tipe - 'pencahayaan' | 'ventilasi' | 'evakuasi' | 'ndt_rebound' | 'ndt_upv'
 * @param {Object} inputParams - Parameter input
 * @param {Object} hasil - Hasil simulasi
 * @param {Object} options - Options tambahan
 */
export async function saveSimulasi(proyekId, tipe, inputParams, hasil, options = {}) {
  const { status = 'draft', rekomendasi = [] } = options;
  
  // Calculate skor kelayakan dari hasil
  let skorKelayakan = 50;
  if (hasil.compliance) {
    if (hasil.compliance.passes || hasil.compliance.passes_df_avg || hasil.compliance.passes_illuminance) {
      skorKelayakan = 80;
    } else {
      skorKelayakan = 40;
    }
  }
  if (hasil.quality_rating) {
    skorKelayakan = { 'Excellent': 95, 'Good': 80, 'Doubtful': 50, 'Poor': 30 }[hasil.quality_rating] || 50;
  }
  
  const { data, error } = await supabase
    .from('hasil_simulasi')
    .insert([{
      proyek_id: proyekId,
      tipe_simulasi: tipe,
      input_params: inputParams,
      hasil: hasil,
      skor_kelayakan: skorKelayakan,
      status: status,
      compliance: hasil.compliance || {},
      rekomendasi: rekomendasi.length > 0 ? rekomendasi : (hasil.recommendations || [])
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Load semua hasil simulasi untuk proyek
 * @param {string} proyekId - ID proyek
 * @param {string} tipe - Filter by tipe (opsional)
 */
export async function loadSimulasi(proyekId, tipe = null) {
  let query = supabase
    .from('hasil_simulasi')
    .select('*')
    .eq('proyek_id', proyekId)
    .order('created_at', { ascending: false });
  
  if (tipe) {
    query = query.eq('tipe_simulasi', tipe);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Get summary simulasi per proyek dari view
 * @param {string} proyekId - ID proyek
 */
export async function getSimulasiSummary(proyekId) {
  const { data, error } = await supabase
    .from('simulasi_summary')
    .select('*')
    .eq('proyek_id', proyekId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  return data || {
    proyek_id: proyekId,
    total_simulasi: 0,
    sim_pencahayaan: 0,
    sim_ventilasi: 0,
    sim_evakuasi: 0,
    sim_ndt: 0,
    avg_skor_kelayakan: null,
    last_simulasi_at: null
  };
}

/**
 * Delete simulasi
 * @param {string} simulasiId - ID simulasi
 */
export async function deleteSimulasi(simulasiId) {
  const { error } = await supabase
    .from('hasil_simulasi')
    .delete()
    .eq('id', simulasiId);
  
  if (error) throw error;
  return true;
}

/**
 * Update status simulasi
 * @param {string} simulasiId - ID simulasi
 * @param {string} status - 'draft' | 'final' | 'archived'
 */
export async function updateSimulasiStatus(simulasiId, status) {
  const { data, error } = await supabase
    .from('hasil_simulasi')
    .update({ status })
    .eq('id', simulasiId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Load imported field data untuk digunakan dalam simulasi
 * @param {string} proyekId - ID proyek
 * @param {string} tipePengujian - Tipe pengujian yang dicari
 */
export async function loadFieldDataForSimulation(proyekId, tipePengujian) {
  try {
    const { data, error } = await supabase
      .from('field_test_data')
      .select('*')
      .eq('proyek_id', proyekId)
      .eq('tipe_pengujian', tipePengujian)
      .order('imported_at', { ascending: false })
      .limit(1);
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      return {
        hasFieldData: true,
        fieldData: data[0],
        parsedParams: data[0].parsed_params,
        sourceFile: data[0].source_filename,
        importedAt: data[0].imported_at
      };
    }
    
    return { hasFieldData: false };
    
  } catch (err) {
    console.warn('[SimEngine] Failed to load field data:', err);
    return { hasFieldData: false, error: err.message };
  }
}

/**
 * Merge field data dengan parameter simulasi default
 * @param {Object} defaultParams - Parameter default
 * @param {Object} fieldParams - Parameter dari field data
 */
export function mergeWithFieldData(defaultParams, fieldParams) {
  if (!fieldParams) return defaultParams;
  
  // Merge field measurements jika ada
  const merged = { ...defaultParams };
  
  // Override dengan data lapangan
  if (fieldParams.fieldValues) {
    merged.fieldValues = fieldParams.fieldValues;
  }
  if (fieldParams.fieldVelocities) {
    merged.fieldVelocities = fieldParams.fieldVelocities;
  }
  if (fieldParams.fieldMeasurements) {
    merged.fieldMeasurements = fieldParams.fieldMeasurements;
  }
  if (fieldParams.temperatureReadings) {
    merged.temperatureReadings = fieldParams.temperatureReadings;
  }
  if (fieldParams.fieldACH) {
    merged.fieldACH = fieldParams.fieldACH;
  }
  if (fieldParams.fieldLocation) {
    merged.fieldLocation = fieldParams.fieldLocation;
  }
  if (fieldParams.testDate) {
    merged.testDate = fieldParams.testDate;
  }
  
  // Override dimensions jika ada di field data
  if (fieldParams.length) merged.length = fieldParams.length;
  if (fieldParams.width) merged.width = fieldParams.width;
  if (fieldParams.height) merged.height = fieldParams.height;
  if (fieldParams.windowArea) merged.windowArea = fieldParams.windowArea;
  if (fieldParams.windSpeed) merged.windSpeed = fieldParams.windSpeed;
  if (fieldParams.numPeople) merged.numPeople = fieldParams.numPeople;
  if (fieldParams.walkingSpeed) merged.walkingSpeed = fieldParams.walkingSpeed;
  if (fieldParams.reactionTime) merged.reactionTime = fieldParams.reactionTime;
  if (fieldParams.age) merged.age = fieldParams.age;
  
  // Flag untuk menandai data dari lapangan
  merged.hasFieldData = true;
  merged.fieldDataSource = fieldParams.sourceFile || 'Imported Field Data';
  
  return merged;
}

