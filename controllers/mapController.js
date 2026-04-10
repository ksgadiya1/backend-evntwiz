const db = require('../db');

exports.saveMap = async (req, res) => {
    const {
        name, eventType, center_lat, center_lng, zoom,
        measurementUnit, grid_enabled, grid_size,
        layers, settings, zones, assets, lines, annotations
    } = req.body;
    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        const mapData = { zones, assets, lines, annotations };

        // Create Map with consolidated map_data
        const mapRes = await client.query(
            'INSERT INTO maps (name, event_type, center_lat, center_lng, zoom, measurement_unit, grid_enabled, grid_size, layers, settings, map_data) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id',
            [
                name || 'Untitled Map',
                eventType || 'festival',
                center_lat || 0,
                center_lng || 0,
                Math.round(zoom || 14),
                measurementUnit || 'meters',
                grid_enabled || false,
                grid_size || 10,
                JSON.stringify(layers || {}),
                JSON.stringify(settings || {}),
                JSON.stringify(mapData)
            ]
        );
        const mapId = mapRes.rows[0].id;

        await client.query('COMMIT');
        res.status(201).json({ success: true, id: mapId, message: 'Map saved successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error saving map:', error);
        res.status(500).json({ error: 'Failed to save map' });
    } finally {
        client.release();
    }
};

exports.updateMap = async (req, res) => {
    const { id } = req.params;
    const {
        name, eventType, center_lat, center_lng, zoom,
        measurementUnit, grid_enabled, grid_size,
        layers, settings, zones, assets, lines, annotations
    } = req.body;
    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        const mapData = { zones, assets, lines, annotations };

        // Update Map with consolidated map_data
        const updateRes = await client.query(
            `UPDATE maps SET 
                name = $1, event_type = $2, center_lat = $3, center_lng = $4, zoom = $5, 
                measurement_unit = $6, grid_enabled = $7, grid_size = $8, 
                layers = $9, settings = $10, map_data = $11,
                updated_at = CURRENT_TIMESTAMP 
             WHERE id = $12`,
            [
                name,
                eventType || 'festival',
                center_lat || 0,
                center_lng || 0,
                Math.round(zoom || 14),
                measurementUnit || 'meters',
                grid_enabled || false,
                grid_size || 10,
                JSON.stringify(layers || {}),
                JSON.stringify(settings || {}),
                JSON.stringify(mapData),
                id
            ]
        );

        if (updateRes.rowCount === 0) {
            throw new Error(`Map with ID ${id} not found`);
        }

        await client.query('COMMIT');
        res.json({ success: true, message: 'Map updated successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating map:', error);
        res.status(500).json({ success: false, error: 'Failed to update map' });
    } finally {
        client.release();
    }
};

exports.getMap = async (req, res) => {
    const { id } = req.params;
    try {
        const mapRes = await db.query('SELECT * FROM maps WHERE id = $1', [id]);
        if (mapRes.rows.length === 0) {
            return res.status(404).json({ error: 'Map not found' });
        }

        const map = mapRes.rows[0];

        // If map_data exists, use it as the primary source
        if (map.map_data) {
            const mapData = typeof map.map_data === 'string' ? JSON.parse(map.map_data) : map.map_data;
            return res.json({
                success: true,
                ...map,
                eventType: map.event_type,
                center: { lat: parseFloat(map.center_lat), lng: parseFloat(map.center_lng) },
                layers: map.layers || {},
                settings: map.settings || {},
                zones: mapData.zones || [],
                assets: mapData.assets || [],
                lines: mapData.lines || [],
                annotations: mapData.annotations || []
            });
        }

        // Fallback to old multi-table logic for backward compatibility (in case migration missed something)
        const zonesRes = await db.query(`
            SELECT z.*, t.name as type_name, t.color as type_color, t.layout_type, t.capacity_label, t.capacity_unit, t.allowed_asset_types, t.sub_types
            FROM zones z
            LEFT JOIN zone_types t ON z.type = t.id
            WHERE map_id = $1
        `, [id]);

        const assetsRes = await db.query(`
            SELECT a.*, d.name as def_name, d.icon, d.color, d.default_width, d.default_length
            FROM map_assets a
            LEFT JOIN asset_definitions d ON a.asset_def_id = d.id
            WHERE a.map_id = $1
        `, [id]);

        const linesRes = await db.query('SELECT * FROM map_lines WHERE map_id = $1', [id]);
        const annotationsRes = await db.query('SELECT * FROM map_annotations WHERE map_id = $1', [id]);

        const zones = zonesRes.rows.map(z => ({
            ...z,
            type: 'zone',
            zoneType: z.type ? {
                id: z.type,
                name: z.type_name,
                color: z.type_color,
                layoutType: z.layout_type,
                capacityLabel: z.capacity_label,
                capacityUnit: z.capacity_unit,
                allowedAssetTypes: Array.isArray(z.allowed_asset_types) ? z.allowed_asset_types : [],
                subTypes: Array.isArray(z.sub_types) ? z.sub_types : []
            } : null,
            fillOpacity: parseFloat(z.fill_opacity) || 0.2,
            visible: z.visible !== false,
            metadata: z.metadata || {}
        }));

        const assets = assetsRes.rows.map(a => ({
            ...a,
            type: 'asset',
            parentId: a.zone_id,
            assetDefId: a.asset_def_id,
            lat: parseFloat(a.lat),
            lng: parseFloat(a.lng),
            x: parseFloat(a.x),
            y: parseFloat(a.y),
            rotationDeg: parseFloat(a.rotation) || 0,
            widthM: parseFloat(a.width),
            lengthM: parseFloat(a.length),
            assetDef: a.asset_def_id ? {
                id: a.asset_def_id,
                name: a.def_name,
                icon: a.icon,
                color: a.color,
                defaultWidth: parseFloat(a.default_width),
                defaultLength: parseFloat(a.default_length)
            } : null,
            metadata: a.metadata || {}
        }));

        const lines = linesRes.rows.map(l => ({
            ...l,
            type: 'line',
            parentId: l.parentid,
            weight: parseInt(l.weight) || 4
        }));

        const annotations = annotationsRes.rows.map(ann => ({
            ...ann,
            type: 'annotation',
            parentId: ann.parentid,
            lat: parseFloat(ann.lat),
            lng: parseFloat(ann.lng)
        }));

        res.json({
            success: true,
            ...map,
            eventType: map.event_type,
            center: { lat: parseFloat(map.center_lat), lng: parseFloat(map.center_lng) },
            layers: map.layers || {},
            settings: map.settings || {},
            zones,
            assets,
            lines,
            annotations
        });
    } catch (error) {
        console.error('Error fetching map:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch map' });
    }
};

exports.getMaps = async (req, res) => {
    try {
        const mapsRes = await db.query('SELECT id, name, event_type, created_at FROM maps ORDER BY created_at DESC');
        res.json(mapsRes.rows);
    } catch (error) {
        console.error('Error listing maps:', error);
        res.status(500).json({ error: 'Failed to list maps' });
    }
};

exports.deleteMap = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM maps WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Map not found' });
        }
        res.json({ success: true, message: 'Map deleted successfully' });
    } catch (error) {
        console.error('Error deleting map:', error);
        res.status(500).json({ error: 'Failed to delete map' });
    }
};
