/**
 * EGRESS MAPPER
 * Mentransformasi data antar lapisan (Infra <-> Domain)
 */

import {
  EgressRoute,
  ExitComponent,
  EmergencyLighting,
  SmokeZone,
  OccupantLoad,
  EgressAnalysis,
  EvacuationDrill
} from '../../domain/entities/EgressSystem.js';

/**
 * EGRESS ROUTE MAPPER
 */
export class EgressRouteMapper {
  static toDomain(raw) {
    if (!raw) return null;
    return new EgressRoute({
      id: raw.id,
      projectId: raw.project_id,
      floorLevel: raw.floor_level,
      roomOrigin: raw.room_origin,
      exitDestination: raw.exit_destination,
      pathGeometry: raw.path_geometry || [],
      travelDistance: raw.travel_distance,
      isDeadEnd: raw.is_dead_end,
      widthClear: raw.width_clear,
      capacityPersons: raw.capacity_persons,
      occupantLoad: raw.occupant_load,
      complianceStatus: raw.compliance_status,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at
    });
  }

  static toPersistence(domain) {
    return {
      id: domain.id,
      project_id: domain.projectId,
      floor_level: domain.floorLevel,
      room_origin: domain.roomOrigin,
      exit_destination: domain.exitDestination,
      path_geometry: domain.pathGeometry,
      travel_distance: domain.travelDistance,
      is_dead_end: domain.isDeadEnd,
      width_clear: domain.widthClear,
      capacity_persons: domain.capacityPersons,
      occupant_load: domain.occupantLoad,
      compliance_status: domain.complianceStatus,
      updated_at: domain.updatedAt || new Date().toISOString()
    };
  }
}

/**
 * EXIT COMPONENT MAPPER
 */
export class ExitComponentMapper {
  static toDomain(raw) {
    if (!raw) return null;
    return new ExitComponent({
      id: raw.id,
      routeId: raw.route_id,
      componentType: raw.component_type,
      widthMeasured: raw.width_measured,
      swingDirection: raw.swing_direction,
      hardwareType: raw.hardware_type,
      fireRating: raw.fire_rating,
      pressureTest: raw.pressure_test,
      photos: raw.photos || [],
      headroomClearance: raw.headroom_clearance,
      riserHeight: raw.riser_height,
      treadDepth: raw.tread_depth,
      handrailProvision: raw.handrail_provision,
      status: raw.status,
      notes: raw.notes,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at
    });
  }

  static toPersistence(domain) {
    return {
      id: domain.id,
      route_id: domain.routeId,
      component_type: domain.componentType,
      width_measured: domain.widthMeasured,
      swing_direction: domain.swingDirection,
      hardware_type: domain.hardwareType,
      fire_rating: domain.fireRating,
      pressure_test: domain.pressureTest,
      photos: domain.photos,
      headroom_clearance: domain.headroomClearance,
      riser_height: domain.riserHeight,
      tread_depth: domain.treadDepth,
      handrail_provision: domain.handrailProvision,
      status: domain.status,
      notes: domain.notes,
      updated_at: domain.updatedAt || new Date().toISOString()
    };
  }
}

/**
 * EMERGENCY LIGHTING MAPPER
 */
export class EmergencyLightingMapper {
  static toDomain(raw) {
    if (!raw) return null;
    return new EmergencyLighting({
      id: raw.id,
      projectId: raw.project_id,
      location: raw.location,
      luxLevel: raw.lux_level,
      batteryBackup: raw.battery_backup,
      lampType: raw.lamp_type,
      lastTested: raw.last_tested,
      exitSignVisible: raw.exit_sign_visible,
      visibilityDistance: raw.visibility_distance,
      signHeight: raw.sign_height,
      photoluminescent: raw.photoluminescent,
      photoluminescentLuminance: raw.photoluminescent_luminance,
      status: raw.status,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at
    });
  }

  static toPersistence(domain) {
    return {
      id: domain.id,
      project_id: domain.projectId,
      location: domain.location,
      lux_level: domain.luxLevel,
      battery_backup: domain.batteryBackup,
      lamp_type: domain.lampType,
      last_tested: domain.lastTested,
      exit_sign_visible: domain.exitSignVisible,
      visibility_distance: domain.visibilityDistance,
      sign_height: domain.signHeight,
      photoluminescent: domain.photoluminescent,
      photoluminescent_luminance: domain.photoluminescentLuminance,
      status: domain.status,
      updated_at: domain.updatedAt || new Date().toISOString()
    };
  }
}

/**
 * SMOKE ZONE MAPPER
 */
export class SmokeZoneMapper {
  static toDomain(raw) {
    if (!raw) return null;
    return new SmokeZone({
      id: raw.id,
      projectId: raw.project_id,
      floorLevel: raw.floor_level,
      zoneName: raw.zone_name,
      area: raw.area,
      smokeStopDoors: raw.smoke_stop_doors,
      smokeLayerHeight: raw.smoke_layer_height,
      pressurized: raw.pressurized,
      pressureDifferential: raw.pressure_differential,
      escapeAirVelocity: raw.escape_air_velocity,
      exhaustCapacity: raw.exhaust_capacity,
      boundaryGeometry: raw.boundary_geometry || [],
      complianceStatus: raw.compliance_status,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at
    });
  }

  static toPersistence(domain) {
    return {
      id: domain.id,
      project_id: domain.projectId,
      floor_level: domain.floorLevel,
      zone_name: domain.zoneName,
      area: domain.area,
      smoke_stop_doors: domain.smokeStopDoors,
      smoke_layer_height: domain.smokeLayerHeight,
      pressurized: domain.pressurized,
      pressure_differential: domain.pressureDifferential,
      escape_air_velocity: domain.escapeAirVelocity,
      exhaust_capacity: domain.exhaustCapacity,
      boundary_geometry: domain.boundaryGeometry,
      compliance_status: domain.complianceStatus,
      updated_at: domain.updatedAt || new Date().toISOString()
    };
  }
}

/**
 * OCCUPANT LOAD MAPPER
 */
export class OccupantLoadMapper {
  static toDomain(raw) {
    if (!raw) return null;
    return new OccupantLoad({
      id: raw.id,
      projectId: raw.project_id,
      floorLevel: raw.floor_level,
      roomName: raw.room_name,
      roomFunction: raw.room_function,
      roomArea: raw.room_area,
      occupantFactor: raw.occupant_factor,
      calculatedLoad: raw.calculated_load,
      actualLoad: raw.actual_load,
      notes: raw.notes,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at
    });
  }

  static toPersistence(domain) {
    return {
      id: domain.id,
      project_id: domain.projectId,
      floor_level: domain.floorLevel,
      room_name: domain.roomName,
      room_function: domain.roomFunction,
      room_area: domain.roomArea,
      occupant_factor: domain.occupantFactor,
      calculated_load: domain.calculatedLoad,
      actual_load: domain.actualLoad,
      notes: domain.notes,
      updated_at: domain.updatedAt || new Date().toISOString()
    };
  }
}

/**
 * EGRESS ANALYSIS MAPPER
 */
export class EgressAnalysisMapper {
  static toDomain(raw) {
    if (!raw) return null;
    return new EgressAnalysis({
      id: raw.id,
      projectId: raw.project_id,
      floorLevel: raw.floor_level,
      totalOccupantLoad: raw.total_occupant_load,
      availableExitCapacity: raw.available_exit_capacity,
      requiredExitWidth: raw.required_exit_width,
      providedExitWidth: raw.provided_exit_width,
      maxTravelDistance: raw.max_travel_distance,
      allowedTravelDistance: raw.allowed_travel_distance,
      commonPathDistance: raw.common_path_distance,
      allowedCommonPathDistance: raw.allowed_common_path_distance,
      numberOfExits: raw.number_of_exits,
      requiredNumberOfExits: raw.required_number_of_exits,
      hasSprinkler: raw.has_sprinkler,
      buildingClass: raw.building_class,
      complianceScore: raw.compliance_score,
      recommendations: raw.recommendations || [],
      status: raw.status,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at
    });
  }

  static toPersistence(domain) {
    return {
      id: domain.id,
      project_id: domain.projectId,
      floor_level: domain.floorLevel,
      total_occupant_load: domain.totalOccupantLoad,
      available_exit_capacity: domain.availableExitCapacity,
      required_exit_width: domain.requiredExitWidth,
      provided_exit_width: domain.providedExitWidth,
      max_travel_distance: domain.maxTravelDistance,
      allowed_travel_distance: domain.allowedTravelDistance,
      common_path_distance: domain.commonPathDistance,
      allowed_common_path_distance: domain.allowedCommonPathDistance,
      number_of_exits: domain.numberOfExits,
      required_number_of_exits: domain.requiredNumberOfExits,
      has_sprinkler: domain.hasSprinkler,
      building_class: domain.buildingClass,
      compliance_score: domain.complianceScore,
      recommendations: domain.recommendations,
      status: domain.status,
      updated_at: domain.updatedAt || new Date().toISOString()
    };
  }
}

/**
 * EVACUATION DRILL MAPPER
 */
export class EvacuationDrillMapper {
  static toDomain(raw) {
    if (!raw) return null;
    return new EvacuationDrill({
      id: raw.id,
      projectId: raw.project_id,
      drillDate: raw.drill_date,
      totalEvacuationTime: raw.total_evacuation_time,
      totalOccupants: raw.total_occupants,
      issues: raw.issues || [],
      recommendations: raw.recommendations || [],
      attendanceList: raw.attendance_list || [],
      photos: raw.photos || [],
      status: raw.status,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at
    });
  }

  static toPersistence(domain) {
    return {
      id: domain.id,
      project_id: domain.projectId,
      drill_date: domain.drillDate,
      total_evacuation_time: domain.totalEvacuationTime,
      total_occupants: domain.totalOccupants,
      issues: domain.issues,
      recommendations: domain.recommendations,
      attendance_list: domain.attendanceList,
      photos: domain.photos,
      status: domain.status,
      updated_at: domain.updatedAt || new Date().toISOString()
    };
  }
}

/**
 * EGRESS SUMMARY DTO
 * Untuk response summary
 */
export class EgressSummaryDTO {
  constructor(data) {
    this.hasData = data.hasData;
    this.complianceScore = data.complianceScore;
    this.status = data.status;
    this.totalRoutes = data.totalRoutes;
    this.totalComponents = data.totalComponents;
    this.totalLighting = data.totalLighting;
    this.totalSmokeZones = data.totalSmokeZones;
    this.nonCompliantItems = data.nonCompliantItems;
    this.lastUpdated = data.lastUpdated;
  }

  getStatusColor() {
    const colors = {
      'COMPLIANT': 'var(--success-400)',
      'PASS': 'var(--success-400)',
      'NON_COMPLIANT': 'var(--danger-400)',
      'FAIL': 'var(--danger-400)',
      'IN_PROGRESS': 'var(--brand-400)',
      'NOT_STARTED': 'var(--text-tertiary)'
    };
    return colors[this.status] || 'var(--text-tertiary)';
  }

  getStatusLabel() {
    const labels = {
      'COMPLIANT': 'Laik',
      'PASS': 'Laik',
      'NON_COMPLIANT': 'Tidak Laik',
      'FAIL': 'Tidak Laik',
      'IN_PROGRESS': 'Dalam Pengkajian',
      'NOT_STARTED': 'Belum Dimulai'
    };
    return labels[this.status] || this.status;
  }
}
