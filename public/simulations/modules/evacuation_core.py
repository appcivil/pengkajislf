"""
Evacuation Core Module
Simulasi Jalur Evakuasi dengan NetworkX

Referensi Standar:
- SNI 03-1736-2012: Spesifikasi perencanaan ketahanan gempa untuk struktur bangunan gedung
- NFPA 101: Life Safety Code (referensi internasional)

Author: Smart AI Pengkaji SLF
Version: 1.0.0
"""

import networkx as nx
import numpy as np
import json

def simulate_evacuation(params):
    """
    Simulasi jalur evakuasi menggunakan graph theory.
    
    Parameters:
        params (dict): Parameter simulasi yang berisi:
            - nodes: List node dengan {'id', 'x', 'y', 'type'}
            - edges: List edge dengan {'from', 'to', 'length', 'width'}
            - exits: List exit node IDs
            - numPeople: Jumlah orang yang dievakuasi
            - mobilityFactor: Faktor mobilitas (1.0 normal, 0.5 untuk lansia/difabel)
            - walkingSpeed: Kecepatan jalan normal (m/s)
            - reactionTime: Waktu reaksi sebelum evakuasi (s)
    
    Returns:
        dict: Hasil simulasi dengan waktu evakuasi, bottleneck, dan compliance
    """
    nodes = params.get('nodes', [])
    edges = params.get('edges', [])
    exits = params.get('exits', [])
    num_people = params.get('numPeople', 100)
    mobility_factor = params.get('mobilityFactor', 1.0)
    walking_speed = params.get('walkingSpeed', 1.2) * mobility_factor
    reaction_time = params.get('reactionTime', 60)
    
    # Ambil standard dari SNI
    try:
        max_time_required = SNI_STANDARDS['EVACUATION']['MAX_TIME_SECONDS']
        walking_speed_normal = SNI_STANDARDS['EVACUATION']['WALKING_SPEED']
        corridor_width_min = SNI_STANDARDS['EVACUATION']['CORRIDOR_WIDTH_MIN']
    except (NameError, KeyError):
        max_time_required = 300  # 5 menit
        walking_speed_normal = 1.2
        corridor_width_min = 1.5
    
    # Build graph
    G = nx.Graph()
    
    # Add nodes with positions
    for node in nodes:
        G.add_node(
            node['id'], 
            pos=(node.get('x', 0), node.get('y', 0)), 
            type=node.get('type', 'room'),
            zone=node.get('zone', 'unknown')
        )
    
    # Add edges dengan weight calculation
    for edge in edges:
        distance = edge.get('length', 5.0)
        width = edge.get('width', 1.0)
        width_factor = width / 1.2  # Normalize to 1.2m
        
        # Capacity people per hour per meter width
        capacity = min(width * 100, 200)
        
        # Weight = distance / width factor (lebar = lebih cepat)
        weight = distance / max(width_factor, 0.5)
        
        G.add_edge(
            edge['from'], 
            edge['to'],
            weight=weight,
            length=distance,
            width=width,
            capacity=capacity
        )
    
    # Calculate shortest paths dari semua node ke nearest exit
    node_evacuation = {}
    
    for node_id in G.nodes():
        if node_id in exits:
            continue
        
        min_time = float('inf')
        best_exit = None
        best_path = None
        best_path_length = 0
        
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
                    best_path_length = path_length
            except nx.NetworkXNoPath:
                continue
        
        if best_exit:
            node_evacuation[node_id] = {
                'nearest_exit': best_exit,
                'evacuation_time': round(min_time, 1),
                'travel_time': round(min_time - reaction_time, 1),
                'path_length': round(best_path_length, 1),
                'path': best_path
            }
    
    # Calculate edge flow untuk identifikasi bottleneck
    edge_usage = {}
    for evac_data in node_evacuation.values():
        path = evac_data.get('path', [])
        for i in range(len(path) - 1):
            edge_key = tuple(sorted([path[i], path[i+1]]))
            edge_usage[edge_key] = edge_usage.get(edge_key, 0) + 1
    
    # Identify bottlenecks
    bottlenecks = []
    for edge_key, flow in edge_usage.items():
        try:
            edge_data = G.edges[edge_key]
            capacity_per_sec = edge_data['capacity'] / 3600
            width = edge_data['width']
            
            # Check if flow exceeds capacity
            if flow > capacity_per_sec * 10:
                severity = 'High' if flow > capacity_per_sec * 20 else 'Medium'
                bottlenecks.append({
                    'edge': list(edge_key),
                    'flow': flow,
                    'capacity_per_hour': round(capacity_per_sec * 3600),
                    'width': width,
                    'severity': severity
                })
        except KeyError:
            continue
    
    # Overall statistics
    all_times = [e['evacuation_time'] for e in node_evacuation.values()]
    avg_evac_time = np.mean(all_times) if all_times else 0
    max_evac_time = max(all_times) if all_times else 0
    min_evac_time = min(all_times) if all_times else 0
    std_evac_time = np.std(all_times) if len(all_times) > 1 else 0
    
    # Critical nodes (time > 4 minutes)
    critical_threshold = max_time_required * 0.8  # 80% dari max time
    critical_nodes = [
        node_id for node_id, data in node_evacuation.items() 
        if data['evacuation_time'] > critical_threshold
    ]
    
    # Compliance check
    compliance = {
        'max_time_required': max_time_required,
        'passes': bool(max_evac_time <= max_time_required),
        'average_time': round(float(avg_evac_time), 1),
        'max_time': round(float(max_evac_time), 1),
        'min_time': round(float(min_evac_time), 1),
        'std_deviation': round(float(std_evac_time), 1)
    }
    
    # Width compliance check
    narrow_corridors = []
    for edge in edges:
        if edge.get('width', 1.0) < corridor_width_min:
            narrow_corridors.append({
                'edge': f"{edge['from']}-{edge['to']}",
                'width': edge['width'],
                'required': corridor_width_min
            })
    
    # Generate recommendations
    recommendations = []
    
    if max_evac_time > max_time_required:
        recommendations.append(
            f"Waktu evakuasi maksimum ({max_evac_time:.0f}s) melebihi standar SNI ({max_time_required}s = 5 menit)."
        )
        recommendations.append("Pertimbangkan:")
        recommendations.append("- Tambah jumlah pintu keluar (exit)")
        recommendations.append("- Lebarkan koridor atau tangga yang sempit")
        recommendations.append("- Tambah tangga darurat eksternal")
    
    if len(bottlenecks) > 0:
        high_severity = [b for b in bottlenecks if b['severity'] == 'High']
        recommendations.append(
            f"Teridentifikasi {len(bottlenecks)} bottleneck ({len(high_severity)} high severity). "
            "Perlu perlebaran koridor atau tambah exit."
        )
    
    if len(critical_nodes) > 0:
        recommendations.append(
            f"{len(critical_nodes)} lokasi memerlukan waktu evakuasi > {critical_threshold:.0f}s. "
            "Pertimbangkan penambahan signage dan emergency lighting."
        )
    
    if len(narrow_corridors) > 0:
        recommendations.append(
            f"{len(narrow_corridors)} koridor tidak memenuhi lebar minimum ({corridor_width_min}m)."
        )
    
    if not recommendations:
        recommendations.append("Sistem evakuasi memenuhi standar SNI 03-1736-2012.")
    
    # Node details tanpa path (untuk mengurangi size response)
    node_details_summary = {}
    for node_id, data in node_evacuation.items():
        node_details_summary[node_id] = {
            'nearest_exit': data['nearest_exit'],
            'evacuation_time': data['evacuation_time'],
            'travel_time': data['travel_time'],
            'path_length': data['path_length']
        }
    
    result = {
        'total_nodes': len(nodes),
        'total_edges': len(edges),
        'total_exits': len(exits),
        'population': num_people,
        'walking_speed': walking_speed,
        'average_evacuation_time': round(float(avg_evac_time), 1),
        'maximum_evacuation_time': round(float(max_evac_time), 1),
        'minimum_evacuation_time': round(float(min_evac_time), 1),
        'compliance': compliance,
        'critical_nodes_count': len(critical_nodes),
        'bottlenecks': sorted(bottlenecks, key=lambda x: x['flow'], reverse=True)[:5],
        'narrow_corridors': narrow_corridors,
        'node_summary': node_details_summary,
        'recommendations': recommendations,
        'sni_reference': 'SNI 03-1736-2012'
    }
    
    return result


# Test function
if __name__ == '__main__':
    SNI_STANDARDS = {
        'EVACUATION': {
            'MAX_TIME_SECONDS': 300,
            'WALKING_SPEED': 1.2,
            'CORRIDOR_WIDTH_MIN': 1.5
        }
    }
    
    test_params = {
        'nodes': [
            {'id': 'room1', 'x': 0, 'y': 0, 'type': 'room'},
            {'id': 'room2', 'x': 10, 'y': 0, 'type': 'room'},
            {'id': 'corridor1', 'x': 5, 'y': 5, 'type': 'corridor'},
            {'id': 'stairs', 'x': 5, 'y': 10, 'type': 'stairs'},
        ],
        'edges': [
            {'from': 'room1', 'to': 'corridor1', 'length': 5, 'width': 1.2},
            {'from': 'room2', 'to': 'corridor1', 'length': 5, 'width': 1.2},
            {'from': 'corridor1', 'to': 'stairs', 'length': 5, 'width': 1.5},
        ],
        'exits': ['stairs'],
        'numPeople': 50,
        'walkingSpeed': 1.2,
        'reactionTime': 60
    }
    
    result = simulate_evacuation(test_params)
    print(json.dumps(result, indent=2))
