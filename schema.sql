CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- (existing tables...)
CREATE TABLE IF NOT EXISTS asset_categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    display_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS asset_definitions (
    id VARCHAR(50) PRIMARY KEY,
    category_id VARCHAR(50) REFERENCES asset_categories(id),
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(100),
    color VARCHAR(20),
    default_width DECIMAL(10, 2),
    default_length DECIMAL(10, 2)
);

CREATE TABLE IF NOT EXISTS zone_types (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(20),
    fill_opacity DECIMAL(4, 2),
    layout_type VARCHAR(50) DEFAULT 'free',
    capacity_label VARCHAR(100),
    capacity_unit VARCHAR(50),
    allowed_asset_types JSONB,
    sub_types JSONB
);

CREATE TABLE IF NOT EXISTS crowd_density_options (
    id SERIAL PRIMARY KEY,
    label VARCHAR(100) UNIQUE NOT NULL,
    value DECIMAL(4, 2) NOT NULL,
    description TEXT
);

-- Seed Data
INSERT INTO asset_categories (id, name, display_order) VALUES
('Performance', 'Performance', 1),
('Traders & Hospitality', 'Traders & Hospitality', 2),
('Power & Utilities', 'Power & Utilities', 3),
('Welfare & Safety', 'Welfare & Safety', 4),
('Access & Security', 'Access & Security', 5),
('Branding & Wayfinding', 'Branding & Wayfinding', 6),
('Logistics', 'Logistics', 7),
('Food', 'Food', 8),
('Facilities', 'Facilities', 9),
('Entertainment', 'Entertainment', 10)
ON CONFLICT (id) DO NOTHING;

INSERT INTO asset_definitions (id, category_id, name, icon, color, default_width, default_length) VALUES
-- Performance
('stage', 'Performance', 'Stage', '🎪', '#8b5cf6', 12, 10),
('marquee', 'Performance', 'Marquee', '⛺', '#6366f1', 20, 15),
('gazebo', 'Performance', 'Gazebo', '🏕️', '#a78bfa', 5, 5),
('led_screen', 'Performance', 'LED Screen', '🖥️', '#7c3aed', 8, 1.5),
('foh_tower', 'Performance', 'FOH Tower', '🗼', '#6d28d9', 4, 4),
('camera_platform', 'Performance', 'Camera Platform', '🎥', '#8b5cf6', 3, 3),
-- Traders & Hospitality
('trader_stall', 'Traders & Hospitality', 'Trader Stall', '🛖', '#f59e0b', 3, 3),
('food_truck', 'Traders & Hospitality', 'Food Truck', '🚚', '#f97316', 6, 2.8),
('seating_block', 'Traders & Hospitality', 'Seating Block', '🪑', '#fb923c', 4, 4),
('vip_lounge', 'Traders & Hospitality', 'VIP Lounge', '🍸', '#d946ef', 8, 6),
-- Power & Utilities
('generator', 'Power & Utilities', 'Generator', '⚡', '#eab308', 3, 2),
('lighting_tower', 'Power & Utilities', 'Lighting Tower', '💡', '#fde68a', 1, 1),
('water_point', 'Power & Utilities', 'Water Point', '💧', '#38bdf8', 1, 1),
('db_box', 'Power & Utilities', 'Distribution Box', '🔌', '#facc15', 1.5, 1.5),
('fuel_storage', 'Power & Utilities', 'Fuel Storage', '🛢️', '#f59e0b', 2.5, 2.5),
('control_room', 'Power & Utilities', 'Control Room', '🏠', '#06b6d4', 4, 3),
-- Welfare & Safety
('toilet_block', 'Welfare & Safety', 'Toilet Block', '🚻', '#34d399', 6, 3),
('first_aid', 'Welfare & Safety', 'First Aid Post', '🏥', '#f87171', 4, 4),
('fire_point', 'Welfare & Safety', 'Fire Point', '🧯', '#ef4444', 1, 1),
('waste_station', 'Welfare & Safety', 'Waste Station', '🗑️', '#6b7280', 2, 1),
('ambulance_bay', 'Welfare & Safety', 'Ambulance Bay', '🚑', '#dc2626', 7, 3),
('police_post', 'Welfare & Safety', 'Police Post', '🚓', '#3b82f6', 4, 3),
('rest_area', 'Welfare & Safety', 'Rest Area', '🛋️', '#10b981', 5, 5),
-- Access & Security
('gate', 'Access & Security', 'Gate', '🚧', '#fb923c', 4, 1),
('steward_point', 'Access & Security', 'Steward Point', '👷', '#22d3ee', 1, 1),
('vehicle_checkpoint', 'Access & Security', 'Vehicle Checkpoint', '🛑', '#f43f5e', 5, 2),
('barrier_line', 'Access & Security', 'Barrier Line', '▢', '#94a3b8', 10, 1),
('turnstile', 'Access & Security', 'Turnstile', '🚪', '#0ea5e9', 2, 1),
('bag_check', 'Access & Security', 'Bag Check', '🎒', '#f43f5e', 3, 2),
('cctv_pole', 'Access & Security', 'CCTV Pole', '📹', '#64748b', 1, 1),
-- Branding & Wayfinding
('feather_banner', 'Branding & Wayfinding', 'Feather Banner', '🚩', '#e879f9', 0.6, 3),
('barrier_sleeve', 'Branding & Wayfinding', 'Barrier Jacket Sleeve', '📛', '#c084fc', 2, 1),
('wayfinding_board', 'Branding & Wayfinding', 'Wayfinding Board', '🧭', '#a855f7', 1.5, 1),
('entry_arch', 'Branding & Wayfinding', 'Entry Arch', '🏁', '#ec4899', 5, 1.5),
('sponsor_wall', 'Branding & Wayfinding', 'Sponsor Wall', '🧱', '#d946ef', 6, 0.8),
-- Logistics
('parking_slot', 'Logistics', 'Parking Slot', '🅿️', '#64748b', 2.5, 5),
('bus_bay', 'Logistics', 'Bus Bay', '🚌', '#334155', 3.5, 12),
('loading_dock', 'Logistics', 'Loading Dock', '📦', '#0f766e', 6, 3),
('forklift_zone', 'Logistics', 'Forklift Zone', '🚜', '#14b8a6', 4, 4),
-- Food (Iconify)
('catering_point', 'Food', 'Catering Point', 'mdi:food', '#f97316', 4, 4),
('coffee_bar', 'Food', 'Coffee Bar', 'mdi:coffee', '#b45309', 3, 2.5),
('ticket_kiosk', 'Food', 'Ticket Kiosk', 'mdi:ticket', '#ec4899', 2.5, 2),
-- Facilities (Iconify)
('accessible_seating', 'Facilities', 'Accessible Seating', 'mdi:chair-rolling', '#2563eb', 3, 3),
('waypoint_marker', 'Facilities', 'Waypoint Marker', 'mdi:map-marker', '#ef4444', 1, 1),
('restroom_hub', 'Facilities', 'Restroom Hub', 'mdi:toilet', '#14b8a6', 5, 3),
('parking_hub', 'Facilities', 'Parking Hub', 'mdi:car', '#64748b', 4, 6),
-- Entertainment (Iconify)
('music_zone', 'Entertainment', 'Music Zone', 'mdi:music', '#8b5cf6', 6, 6),
('speaker_stack', 'Entertainment', 'Speaker Stack', 'mdi:speaker-wireless', '#7c3aed', 2.5, 2.5),
('merch_counter', 'Entertainment', 'Merch Counter', 'mdi:shopping', '#0ea5e9', 4, 2.5)
ON CONFLICT (id) DO NOTHING;

INSERT INTO zone_types (id, name, color, fill_opacity, layout_type, capacity_label, capacity_unit, allowed_asset_types, sub_types) VALUES
('arena', 'Arena', '#3d8ef8', 0.2, 'free', 'SEATED CAPACITY', 'seats', '[]', '[{"id": "seated", "label": "Standard Seating", "unitArea": 0.75}, {"id": "vip_seated", "label": "VIP Seating (spaced)", "unitArea": 1.5}, {"id": "standing", "label": "Standing / Pit", "unitArea": 0.5}]'),
('public', 'Public Area', '#34d399', 0.15, 'rows', 'CROWD CAPACITY', 'people', '[]', '[{"id": "standing", "label": "Standing (dense)", "unitArea": 1}, {"id": "seated", "label": "Seated", "unitArea": 0.75}, {"id": "relaxed", "label": "Relaxed / Festival", "unitArea": 4}]'),
('backstage', 'Backstage', '#8b5cf6', 0.25, 'free', 'PERSON CAPACITY', 'persons', '[]', '[{"id": "crew", "label": "Crew Area", "unitArea": 4}, {"id": "artist_lounge", "label": "Artist Lounge", "unitArea": 8}, {"id": "equipment", "label": "Equipment Storage", "unitArea": 10}]'),
('food_court', 'Food Court', '#f97316', 0.2, 'grid', 'FOOD COURT CAPACITY', 'units', '["trader_stall", "food_truck", "seating_block"]', '[{"id": "stall", "label": "Food Stalls", "unitArea": 9}, {"id": "food_truck", "label": "Food Trucks", "unitArea": 18}, {"id": "seating", "label": "Seated Diners (chairs)", "unitArea": 1.5}]'),
('trader_village', 'Trader Village', '#f59e0b', 0.2, 'grid', 'STALL CAPACITY', 'units', '["trader_stall"]', '[{"id": "stall", "label": "Market Stalls", "unitArea": 9}, {"id": "table", "label": "Display Tables", "unitArea": 4}, {"id": "food_truck", "label": "Food Trucks", "unitArea": 18}]'),
('vip', 'VIP Hospitality', '#e879f9', 0.2, 'rows', 'SEATED CAPACITY', 'guests', '[]', '[{"id": "lounge", "label": "Lounge Seating", "unitArea": 3}, {"id": "dining", "label": "Dining (table + chairs)", "unitArea": 2.5}, {"id": "standing", "label": "Standing Cocktail", "unitArea": 1.5}]'),
('emergency_route', 'Emergency Route', '#ef4444', 0.15, 'free', 'ROUTE INFO', 'persons/min throughput', '[]', '[{"id": "walkway", "label": "Pedestrian Walkway", "unitArea": 1.2}, {"id": "vehicle_lane", "label": "Vehicle Lane", "unitArea": 8}]'),
('car_park', 'Car Park', '#6b7280', 0.2, 'grid', 'PARKING CAPACITY', 'vehicles', '[]', '[{"id": "car", "label": "Cars", "unitArea": 30}, {"id": "bike", "label": "Bikes / Motorcycles", "unitArea": 4}, {"id": "bus", "label": "Buses / Coaches", "unitArea": 60}]'),
('camping', 'Camping', '#22d3ee', 0.15, 'grid', 'CAMPING CAPACITY', 'tents', '[]', '[{"id": "tent_small", "label": "Small Tent (2-person)", "unitArea": 12}, {"id": "tent_large", "label": "Large Tent (4-person)", "unitArea": 25}, {"id": "campervan", "label": "Campervan / RV", "unitArea": 35}]'),
('sterile', 'Sterile Area', '#fbbf24', 0.15, 'free', 'PERSON CAPACITY', 'persons', '[]', '[{"id": "security", "label": "Security Checkpoint", "unitArea": 4}, {"id": "screening", "label": "Screening Lane", "unitArea": 6}]'),
('production', 'Production Compound', '#a78bfa', 0.2, 'grid', 'PRODUCTION CAPACITY', 'units', '[]', '[{"id": "container", "label": "Containers / Portacabin", "unitArea": 15}, {"id": "generator", "label": "Generator Bay", "unitArea": 20}, {"id": "crew_space", "label": "Crew Workspace", "unitArea": 6}]')
ON CONFLICT (id) DO NOTHING;

INSERT INTO crowd_density_options (label, value, description) VALUES
('Standing (dense)', 1.0, '1 person / m²'),
('Normal crowd', 0.5, '0.5 person / m²'),
('Relaxed / festival', 0.25, '0.25 person / m²'),
('Seated / spaced', 0.1, '0.1 person / m²')
ON CONFLICT (label) DO NOTHING;

-- (rest of schema...)
CREATE TABLE IF NOT EXISTS maps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) DEFAULT 'festival',
    image_url TEXT,
    center_lat DECIMAL(10, 8) NOT NULL,
    center_lng DECIMAL(11, 8) NOT NULL,
    zoom INTEGER NOT NULL,
    measurement_unit VARCHAR(20) DEFAULT 'meters',
    grid_enabled BOOLEAN DEFAULT FALSE,
    grid_size DECIMAL(10, 2) DEFAULT 10,
    layers JSONB,
    settings JSONB,
    map_data JSONB, -- Consolidated map data (zones, assets, lines, annotations)
    event_date DATE,
    event_location VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS zones (
    id VARCHAR(50) PRIMARY KEY,
    map_id UUID REFERENCES maps(id) ON DELETE CASCADE,
    name VARCHAR(255),
    type VARCHAR(50) REFERENCES zone_types(id),
    color VARCHAR(20),
    fill_opacity DECIMAL(4, 2),
    path JSONB,
    status VARCHAR(50),
    visible BOOLEAN DEFAULT TRUE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS map_assets (
    id VARCHAR(50) PRIMARY KEY,
    map_id UUID REFERENCES maps(id) ON DELETE CASCADE,
    zone_id VARCHAR(50) REFERENCES zones(id) ON DELETE SET NULL,
    asset_def_id VARCHAR(50) REFERENCES asset_definitions(id),
    name VARCHAR(255),
    lat DECIMAL(11, 8),
    lng DECIMAL(11, 8),
    x DECIMAL(10, 2),
    y DECIMAL(10, 2),
    rotation DECIMAL(10, 2) DEFAULT 0,
    width DECIMAL(10, 2),
    length DECIMAL(10, 2),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS map_lines (
    id VARCHAR(50) PRIMARY KEY,
    map_id UUID REFERENCES maps(id) ON DELETE CASCADE,
    parentId VARCHAR(50),
    name VARCHAR(255),
    path JSONB,
    color VARCHAR(20),
    weight INTEGER,
    pattern VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS map_annotations (
    id VARCHAR(50) PRIMARY KEY,
    map_id UUID REFERENCES maps(id) ON DELETE CASCADE,
    parentId VARCHAR(50),
    text TEXT,
    lat DECIMAL(11, 8),
    lng DECIMAL(11, 8),
    style JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure event_type column exists if table was already created
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='maps' AND column_name='event_type') THEN
        ALTER TABLE maps ADD COLUMN event_type VARCHAR(100) DEFAULT 'festival';
    END IF;
    
    -- Sync existing map_assets if lat/lng are missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='map_assets' AND column_name='lat') THEN
        ALTER TABLE map_assets ADD COLUMN lat DECIMAL(11, 8);
        ALTER TABLE map_assets ADD COLUMN lng DECIMAL(11, 8);
        ALTER TABLE map_assets ADD COLUMN metadata JSONB;
    END IF;

    -- Sync maps table for layers/settings
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='maps' AND column_name='layers') THEN
        ALTER TABLE maps ADD COLUMN layers JSONB;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='maps' AND column_name='settings') THEN
        ALTER TABLE maps ADD COLUMN settings JSONB;
    END IF;

    -- Sync maps table for uploaded image url
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='maps' AND column_name='image_url') THEN
        ALTER TABLE maps ADD COLUMN image_url TEXT;
    END IF;

    -- Sync maps table for consolidated map payload and event metadata
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='maps' AND column_name='map_data') THEN
        ALTER TABLE maps ADD COLUMN map_data JSONB;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='maps' AND column_name='event_date') THEN
        ALTER TABLE maps ADD COLUMN event_date DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='maps' AND column_name='event_location') THEN
        ALTER TABLE maps ADD COLUMN event_location VARCHAR(255);
    END IF;
    
    -- Sync zones table for metadata
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='zones' AND column_name='metadata') THEN
        ALTER TABLE zones ADD COLUMN metadata JSONB;
    END IF;
END $$;
