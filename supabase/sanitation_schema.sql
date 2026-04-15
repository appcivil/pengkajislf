-- ============================================================
-- SUPABASE SQL SCHEMA FOR SANITATION INSPECTION
-- Pemeriksaan Sistem Pembuangan Kotoran dan Sampah
-- PP 16/2021, SNI 03-3981-1995, SNI 2398:2017, Permen PU No. 4/PRT/M/2017
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. SEPTIC TANKS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS sanitation_septic_tanks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES proyek(id) ON DELETE CASCADE,
    
    -- Basic Information
    name VARCHAR(255) NOT NULL DEFAULT 'Septic Tank 1',
    description TEXT,
    
    -- Population and Usage
    population INTEGER DEFAULT 5,
    water_usage INTEGER DEFAULT 100, -- L/person/day
    desludging_interval INTEGER DEFAULT 3, -- years
    
    -- Volume
    volume DECIMAL(10,2) DEFAULT 1.8, -- m³
    compartment1_volume DECIMAL(10,2),
    compartment2_volume DECIMAL(10,2),
    compartment_ratio VARCHAR(10) DEFAULT '2:1',
    
    -- Dimensions
    length DECIMAL(10,2) DEFAULT 2.5, -- m
    width DECIMAL(10,2) DEFAULT 1.2, -- m
    depth DECIMAL(10,2) DEFAULT 2.0, -- m
    wall_thickness DECIMAL(10,2) DEFAULT 0.15, -- m
    
    -- Safety Distances
    distance_to_well DECIMAL(10,2),
    distance_to_building DECIMAL(10,2),
    distance_to_water_source DECIMAL(10,2),
    
    -- Construction
    construction_type VARCHAR(50) DEFAULT 'concrete', -- concrete, fiberglass, plastic
    water_tightness_status VARCHAR(20), -- passed, failed, not_tested
    water_tightness_rate DECIMAL(10,4), -- L/m²/day
    
    -- Schedule
    construction_date DATE,
    last_desludging DATE,
    next_desludging DATE,
    
    -- Coordinates
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, maintenance
    condition VARCHAR(20) DEFAULT 'good', -- good, fair, poor, critical
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    sync_status VARCHAR(20) DEFAULT 'synced',
    local_id VARCHAR(255)
);

-- Indexes
CREATE INDEX idx_septic_tanks_project ON sanitation_septic_tanks(project_id);
CREATE INDEX idx_septic_tanks_status ON sanitation_septic_tanks(status);

-- RLS Policies
ALTER TABLE sanitation_septic_tanks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select for project members" ON sanitation_septic_tanks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM proyek WHERE proyek.id = project_id
        )
    );

CREATE POLICY "Allow insert for authenticated users" ON sanitation_septic_tanks
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for project members" ON sanitation_septic_tanks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM proyek WHERE proyek.id = project_id
        )
    );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_sanitation_septic_tanks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_septic_tanks_updated_at
    BEFORE UPDATE ON sanitation_septic_tanks
    FOR EACH ROW
    EXECUTE FUNCTION update_sanitation_septic_tanks_updated_at();

-- ============================================================
-- 2. IPAL (INSTALASI PENGOLAHAN AIR LIMBAH) TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS sanitation_ipal_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES proyek(id) ON DELETE CASCADE,
    
    -- Basic Information
    name VARCHAR(255) NOT NULL DEFAULT 'IPAL Biofilter 1',
    type VARCHAR(50) DEFAULT 'biofilter', -- biofilter, anaerob, aerob, hybrid
    description TEXT,
    
    -- Volume Distribution
    total_volume DECIMAL(10,2) DEFAULT 5.0, -- m³
    anaerob_volume DECIMAL(10,2),
    anaerob_percentage INTEGER DEFAULT 30,
    aerob_volume DECIMAL(10,2),
    aerob_percentage INTEGER DEFAULT 50,
    settling_volume DECIMAL(10,2),
    settling_percentage INTEGER DEFAULT 20,
    
    -- Dimensions
    length DECIMAL(10,2),
    width DECIMAL(10,2),
    depth DECIMAL(10,2),
    
    -- Flow
    design_flow DECIMAL(10,2), -- m³/day
    actual_flow DECIMAL(10,2), -- m³/day
    
    -- Media
    media_type VARCHAR(50), -- biofilter: gravel, sand, etc.
    media_volume DECIMAL(10,2), -- m³
    
    -- Coordinates
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    
    -- Status
    status VARCHAR(20) DEFAULT 'active',
    condition VARCHAR(20) DEFAULT 'good',
    operational_since DATE,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    sync_status VARCHAR(20) DEFAULT 'synced',
    local_id VARCHAR(255)
);

CREATE INDEX idx_ipal_project ON sanitation_ipal_units(project_id);
CREATE INDEX idx_ipal_status ON sanitation_ipal_units(status);

ALTER TABLE sanitation_ipal_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select for project members" ON sanitation_ipal_units
    FOR SELECT USING (EXISTS (SELECT 1 FROM proyek WHERE proyek.id = project_id));

CREATE POLICY "Allow insert for authenticated" ON sanitation_ipal_units
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for project members" ON sanitation_ipal_units
    FOR UPDATE USING (EXISTS (SELECT 1 FROM proyek WHERE proyek.id = project_id));

-- ============================================================
-- 3. CHUTES / INLET TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS sanitation_chutes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES proyek(id) ON DELETE CASCADE,
    
    -- Basic Information
    name VARCHAR(255) NOT NULL DEFAULT 'Chute 1',
    location VARCHAR(255),
    description TEXT,
    
    -- Dimensions
    width DECIMAL(10,2) DEFAULT 0.6, -- m
    height DECIMAL(10,2) DEFAULT 0.6, -- m
    length DECIMAL(10,2), -- m (for vertical, this is building height)
    
    -- Building Info
    building_height DECIMAL(10,2),
    building_type VARCHAR(50) DEFAULT 'residential', -- residential, commercial, hospital, industrial
    waste_generation DECIMAL(10,2), -- kg/day
    serving_floors INTEGER[], -- array of floor numbers
    
    -- Slope
    slope DECIMAL(5,2) DEFAULT 2.0, -- %
    
    -- Components
    has_bar_screen BOOLEAN DEFAULT true,
    has_flush_system BOOLEAN DEFAULT false,
    
    -- Coordinates
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    
    -- Status
    status VARCHAR(20) DEFAULT 'active',
    condition VARCHAR(20) DEFAULT 'good',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    sync_status VARCHAR(20) DEFAULT 'synced',
    local_id VARCHAR(255)
);

CREATE INDEX idx_chutes_project ON sanitation_chutes(project_id);

ALTER TABLE sanitation_chutes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select for project members" ON sanitation_chutes
    FOR SELECT USING (EXISTS (SELECT 1 FROM proyek WHERE proyek.id = project_id));

CREATE POLICY "Allow insert for authenticated" ON sanitation_chutes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for project members" ON sanitation_chutes
    FOR UPDATE USING (EXISTS (SELECT 1 FROM proyek WHERE proyek.id = project_id));

-- ============================================================
-- 4. PIPES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS sanitation_pipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES proyek(id) ON DELETE CASCADE,
    
    -- Basic Information
    name VARCHAR(255) NOT NULL DEFAULT 'Pipa 1',
    type VARCHAR(50) DEFAULT 'gravity', -- gravity, pressure
    description TEXT,
    
    -- Dimensions
    diameter INTEGER DEFAULT 100, -- mm
    length DECIMAL(10,2), -- m
    material VARCHAR(50) DEFAULT 'pvc', -- pvc, concrete, clay, hdpe
    
    -- Flow
    slope DECIMAL(5,2) DEFAULT 2.0, -- %
    flow_rate DECIMAL(10,2), -- L/day
    velocity DECIMAL(5,2), -- m/s
    
    -- Connections
    from_component_type VARCHAR(50), -- chute, septic, ipal, manhole
    from_component_id UUID,
    to_component_type VARCHAR(50),
    to_component_id UUID,
    
    -- Elevations
    start_elevation DECIMAL(10,2), -- m
    end_elevation DECIMAL(10,2), -- m
    
    -- Coordinates (LineString could be used for complex routes)
    start_latitude DECIMAL(10,8),
    start_longitude DECIMAL(11,8),
    end_latitude DECIMAL(10,8),
    end_longitude DECIMAL(11,8),
    
    -- Status
    status VARCHAR(20) DEFAULT 'active',
    condition VARCHAR(20) DEFAULT 'good',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    sync_status VARCHAR(20) DEFAULT 'synced',
    local_id VARCHAR(255)
);

CREATE INDEX idx_pipes_project ON sanitation_pipes(project_id);

ALTER TABLE sanitation_pipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select for project members" ON sanitation_pipes
    FOR SELECT USING (EXISTS (SELECT 1 FROM proyek WHERE proyek.id = project_id));

CREATE POLICY "Allow insert for authenticated" ON sanitation_pipes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- 5. INSPECTION POINTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS sanitation_inspection_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES proyek(id) ON DELETE CASCADE,
    
    -- Point Information
    name VARCHAR(255),
    type VARCHAR(50) NOT NULL, -- inlet, chute, manhole, cleanout, outlet
    description TEXT,
    
    -- Measurements
    dimensions JSONB, -- {width, height, depth}
    measurements JSONB, -- {flow_rate, depth, velocity, etc}
    
    -- Condition
    condition VARCHAR(20) DEFAULT 'good', -- good, fair, poor, critical
    issues TEXT[], -- array of issue descriptions
    
    -- Coordinates
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    elevation DECIMAL(10,2),
    
    -- Photo reference
    photo_urls TEXT[],
    
    -- Timestamp
    inspected_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    sync_status VARCHAR(20) DEFAULT 'synced',
    local_id VARCHAR(255)
);

CREATE INDEX idx_inspection_points_project ON sanitation_inspection_points(project_id);
CREATE INDEX idx_inspection_points_type ON sanitation_inspection_points(type);

ALTER TABLE sanitation_inspection_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select for project members" ON sanitation_inspection_points
    FOR SELECT USING (EXISTS (SELECT 1 FROM proyek WHERE proyek.id = project_id));

CREATE POLICY "Allow insert for authenticated" ON sanitation_inspection_points
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- 6. EFFLUENT TESTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS sanitation_effluent_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES proyek(id) ON DELETE CASCADE,
    ipal_id UUID REFERENCES sanitation_ipal_units(id) ON DELETE SET NULL,
    
    -- Test Information
    test_date DATE NOT NULL DEFAULT CURRENT_DATE,
    laboratory VARCHAR(255),
    test_method VARCHAR(100),
    
    -- Inlet Parameters
    inlet_bod DECIMAL(10,2), -- mg/L
    inlet_tss DECIMAL(10,2), -- mg/L
    inlet_cod DECIMAL(10,2), -- mg/L
    inlet_ph DECIMAL(4,2),
    inlet_coliform INTEGER, -- MPN/100mL
    inlet_temperature DECIMAL(5,2), -- °C
    
    -- Outlet Parameters (Effluent Quality)
    outlet_bod DECIMAL(10,2), -- mg/L
    outlet_tss DECIMAL(10,2), -- mg/L
    outlet_cod DECIMAL(10,2), -- mg/L
    outlet_ph DECIMAL(4,2),
    outlet_coliform INTEGER, -- MPN/100mL
    outlet_temperature DECIMAL(5,2), -- °C
    outlet_do DECIMAL(5,2), -- Dissolved Oxygen mg/L
    
    -- Calculated Removal Efficiency
    bod_removal DECIMAL(5,2), -- %
    tss_removal DECIMAL(5,2), -- %
    cod_removal DECIMAL(5,2), -- %
    
    -- Compliance Status
    compliance_status VARCHAR(20), -- compliant, non_compliant
    
    -- Notes
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    sync_status VARCHAR(20) DEFAULT 'synced',
    local_id VARCHAR(255)
);

CREATE INDEX idx_effluent_tests_project ON sanitation_effluent_tests(project_id);
CREATE INDEX idx_effluent_tests_ipal ON sanitation_effluent_tests(ipal_id);
CREATE INDEX idx_effluent_tests_date ON sanitation_effluent_tests(test_date);

ALTER TABLE sanitation_effluent_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select for project members" ON sanitation_effluent_tests
    FOR SELECT USING (EXISTS (SELECT 1 FROM proyek WHERE proyek.id = project_id));

CREATE POLICY "Allow insert for authenticated" ON sanitation_effluent_tests
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- 7. SLUDGE RECORDS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS sanitation_sludge_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES proyek(id) ON DELETE CASCADE,
    tank_id UUID REFERENCES sanitation_septic_tanks(id) ON DELETE SET NULL,
    
    -- Record Information
    record_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Sludge Level
    level DECIMAL(5,2) NOT NULL, -- percentage 0-100
    volume DECIMAL(10,2), -- m³ calculated
    depth DECIMAL(10,2), -- m measured
    
    -- Predictions
    next_desludging DATE,
    days_until_full INTEGER,
    urgency_level VARCHAR(20) DEFAULT 'NORMAL', -- NORMAL, MEDIUM, HIGH, CRITICAL
    
    -- Photo evidence
    photo_urls TEXT[],
    
    -- Notes
    notes TEXT,
    inspected_by VARCHAR(255),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    sync_status VARCHAR(20) DEFAULT 'synced',
    local_id VARCHAR(255)
);

CREATE INDEX idx_sludge_records_project ON sanitation_sludge_records(project_id);
CREATE INDEX idx_sludge_records_tank ON sanitation_sludge_records(tank_id);
CREATE INDEX idx_sludge_records_date ON sanitation_sludge_records(record_date);

ALTER TABLE sanitation_sludge_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select for project members" ON sanitation_sludge_records
    FOR SELECT USING (EXISTS (SELECT 1 FROM proyek WHERE proyek.id = project_id));

CREATE POLICY "Allow insert for authenticated" ON sanitation_sludge_records
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- 8. PHOTOS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS sanitation_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES proyek(id) ON DELETE CASCADE,
    
    -- Photo reference
    component_type VARCHAR(50), -- septic, ipal, chute, pipe, point
    component_id UUID,
    
    -- Photo metadata
    photo_type VARCHAR(50) DEFAULT 'general', -- general, damage, condition, evidence
    damage_type VARCHAR(50), -- retak, bocor, sumbat, korosi, etc
    description TEXT,
    caption TEXT,
    
    -- Storage
    file_name VARCHAR(255),
    file_path VARCHAR(500),
    url TEXT,
    thumbnail_url TEXT,
    
    -- Annotations (JSON for marker positions)
    annotations JSONB, -- [{type, x, y, description}]
    
    -- Coordinates
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    
    -- Timestamps
    taken_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    sync_status VARCHAR(20) DEFAULT 'synced',
    local_id VARCHAR(255)
);

CREATE INDEX idx_photos_project ON sanitation_photos(project_id);
CREATE INDEX idx_photos_component ON sanitation_photos(component_type, component_id);

ALTER TABLE sanitation_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select for project members" ON sanitation_photos
    FOR SELECT USING (EXISTS (SELECT 1 FROM proyek WHERE proyek.id = project_id));

CREATE POLICY "Allow insert for authenticated" ON sanitation_photos
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- 9. COMPLIANCE CHECKS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS sanitation_compliance_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES proyek(id) ON DELETE CASCADE,
    
    -- Check Information
    check_date DATE NOT NULL DEFAULT CURRENT_DATE,
    standard VARCHAR(50) DEFAULT 'PP_16_2021', -- PP_16_2021, SNI_03_3981_1995, SNI_2398_2017
    pasal VARCHAR(50), -- Pasal 224 Ayat 8
    
    -- Check Items (JSON array)
    check_items JSONB, -- [{description, standard, measured, status}]
    
    -- Results
    overall_status VARCHAR(20), -- C, NC
    compliant_items INTEGER DEFAULT 0,
    non_compliant_items INTEGER DEFAULT 0,
    
    -- Citations
    legal_citations JSONB, -- [{pasal, quote, recommendation}]
    
    -- Recommendations
    recommendations TEXT[],
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    sync_status VARCHAR(20) DEFAULT 'synced',
    local_id VARCHAR(255)
);

CREATE INDEX idx_compliance_project ON sanitation_compliance_checks(project_id);
CREATE INDEX idx_compliance_date ON sanitation_compliance_checks(check_date);

ALTER TABLE sanitation_compliance_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select for project members" ON sanitation_compliance_checks
    FOR SELECT USING (EXISTS (SELECT 1 FROM proyek WHERE proyek.id = project_id));

CREATE POLICY "Allow insert for authenticated" ON sanitation_compliance_checks
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- 10. MEASUREMENTS TABLE (Data Logger Import)
-- ============================================================
CREATE TABLE IF NOT EXISTS sanitation_measurements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES proyek(id) ON DELETE CASCADE,
    point_id UUID REFERENCES sanitation_inspection_points(id) ON DELETE SET NULL,
    
    -- Measurement Data
    measurement_type VARCHAR(50) NOT NULL, -- flow, depth, velocity, pressure, temperature
    value DECIMAL(15,4) NOT NULL,
    unit VARCHAR(20),
    
    -- Device Info
    device_id VARCHAR(255),
    device_name VARCHAR(255),
    
    -- Timestamp
    measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Location
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    
    -- Notes
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    sync_status VARCHAR(20) DEFAULT 'synced',
    local_id VARCHAR(255)
);

CREATE INDEX idx_measurements_project ON sanitation_measurements(project_id);
CREATE INDEX idx_measurements_point ON sanitation_measurements(point_id);
CREATE INDEX idx_measurements_type ON sanitation_measurements(measurement_type);
CREATE INDEX idx_measurements_time ON sanitation_measurements(measured_at);

ALTER TABLE sanitation_measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select for project members" ON sanitation_measurements
    FOR SELECT USING (EXISTS (SELECT 1 FROM proyek WHERE proyek.id = project_id));

CREATE POLICY "Allow insert for authenticated" ON sanitation_measurements
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- VIEWS FOR REPORTING
-- ============================================================

-- View: Sanitation Summary by Project
CREATE OR REPLACE VIEW view_sanitation_summary AS
SELECT 
    p.id as project_id,
    p.nama_bangunan as project_name,
    COUNT(DISTINCT st.id) as septic_tank_count,
    COUNT(DISTINCT ipal.id) as ipal_count,
    COUNT(DISTINCT ch.id) as chute_count,
    COUNT(DISTINCT et.id) as effluent_test_count,
    COUNT(DISTINCT sr.id) as sludge_record_count,
    MAX(et.test_date) as latest_effluent_test,
    MAX(sr.record_date) as latest_sludge_record
FROM proyek p
LEFT JOIN sanitation_septic_tanks st ON st.project_id = p.id
LEFT JOIN sanitation_ipal_units ipal ON ipal.project_id = p.id
LEFT JOIN sanitation_chutes ch ON ch.project_id = p.id
LEFT JOIN sanitation_effluent_tests et ON et.project_id = p.id
LEFT JOIN sanitation_sludge_records sr ON sr.project_id = p.id
GROUP BY p.id, p.nama_bangunan;

-- View: Compliance Summary
CREATE OR REPLACE VIEW view_sanitation_compliance AS
SELECT 
    project_id,
    COUNT(*) as total_checks,
    SUM(CASE WHEN overall_status = 'C' THEN 1 ELSE 0 END) as compliant_checks,
    SUM(CASE WHEN overall_status = 'NC' THEN 1 ELSE 0 END) as non_compliant_checks,
    MAX(check_date) as latest_check_date
FROM sanitation_compliance_checks
GROUP BY project_id;

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Function: Calculate Sludge Production
CREATE OR REPLACE FUNCTION calculate_sludge_production(
    population INTEGER,
    days INTEGER DEFAULT 365
)
RETURNS DECIMAL AS $$
DECLARE
    daily_production DECIMAL; -- L/day
    total_production DECIMAL; -- m³
BEGIN
    daily_production := population * 0.5; -- 0.5 L/person/day
    total_production := (daily_production * days) / 1000;
    RETURN total_production;
END;
$$ LANGUAGE plpgsql;

-- Function: Get Next Desludging Date
CREATE OR REPLACE FUNCTION get_next_desludging_date(
    tank_id UUID,
    interval_years INTEGER DEFAULT 3
)
RETURNS DATE AS $$
BEGIN
    RETURN CURRENT_DATE + (interval_years * 365);
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- GRANT PERMISSIONS
-- ============================================================

GRANT ALL ON sanitation_septic_tanks TO authenticated;
GRANT ALL ON sanitation_ipal_units TO authenticated;
GRANT ALL ON sanitation_chutes TO authenticated;
GRANT ALL ON sanitation_pipes TO authenticated;
GRANT ALL ON sanitation_inspection_points TO authenticated;
GRANT ALL ON sanitation_effluent_tests TO authenticated;
GRANT ALL ON sanitation_sludge_records TO authenticated;
GRANT ALL ON sanitation_photos TO authenticated;
GRANT ALL ON sanitation_compliance_checks TO authenticated;
GRANT ALL ON sanitation_measurements TO authenticated;

GRANT SELECT ON view_sanitation_summary TO authenticated;
GRANT SELECT ON view_sanitation_compliance TO authenticated;
