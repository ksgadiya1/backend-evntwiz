const db = require('../db');

exports.saveMap = async (req, res) => {
    const {
        name,
        eventType,
        center_lat,
        center_lng,
        zoom,
        measurementUnit,
        grid_enabled,
        grid_size,
        layers,
        settings,
        zones,
        assets,
        lines,
        annotations,
        floorPlans   // ✅ ADDED
    } = req.body;

    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        // ✅ include floorPlans
        const mapData = {
            zones,
            assets,
            lines,
            annotations,
            floorPlans
        };

        const mapRes = await client.query(
            `INSERT INTO maps 
            (
                name,
                event_type,
                center_lat,
                center_lng,
                zoom,
                measurement_unit,
                grid_enabled,
                grid_size,
                layers,
                settings,
                map_data
            )
            VALUES 
            ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
            RETURNING id`,
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

        res.status(201).json({
            success: true,
            id: mapId,
            message: 'Map saved successfully'
        });

    } catch (error) {

        await client.query('ROLLBACK');

        console.error('Error saving map:', error);

        res.status(500).json({
            error: 'Failed to save map'
        });

    } finally {

        client.release();

    }
};

exports.updateMap = async (req, res) => {

    const { id } = req.params;

    const {
        name,
        eventType,
        center_lat,
        center_lng,
        zoom,
        measurementUnit,
        grid_enabled,
        grid_size,
        layers,
        settings,
        zones,
        assets,
        lines,
        annotations,
        floorPlans   // ✅ ADDED
    } = req.body;

    const client = await db.pool.connect();

    try {

        await client.query('BEGIN');

        // ✅ include floorPlans
        const mapData = {
            zones,
            assets,
            lines,
            annotations,
            floorPlans
        };

        const updateRes = await client.query(
            `UPDATE maps SET 
                name = $1,
                event_type = $2,
                center_lat = $3,
                center_lng = $4,
                zoom = $5,
                measurement_unit = $6,
                grid_enabled = $7,
                grid_size = $8,
                layers = $9,
                settings = $10,
                map_data = $11,
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

        res.json({
            success: true,
            message: 'Map updated successfully'
        });

    } catch (error) {

        await client.query('ROLLBACK');

        console.error('Error updating map:', error);

        res.status(500).json({
            success: false,
            error: 'Failed to update map'
        });

    } finally {

        client.release();

    }
};

exports.getMap = async (req, res) => {

    const { id } = req.params;

    try {

        const mapRes = await db.query(
            'SELECT * FROM maps WHERE id = $1',
            [id]
        );

        if (mapRes.rows.length === 0) {

            return res.status(404).json({
                error: 'Map not found'
            });

        }

        const map = mapRes.rows[0];

        if (map.map_data) {

            const mapData =
                typeof map.map_data === 'string'
                    ? JSON.parse(map.map_data)
                    : map.map_data;

            return res.json({
                success: true,

                ...map,

                eventType: map.event_type,

                center: {
                    lat: parseFloat(map.center_lat),
                    lng: parseFloat(map.center_lng)
                },

                layers: map.layers || {},
                settings: map.settings || {},

                zones: mapData.zones || [],
                assets: mapData.assets || [],
                lines: mapData.lines || [],
                annotations: mapData.annotations || [],

                // ✅ IMPORTANT
                floorPlans: mapData.floorPlans || []
            });
        }

        res.json({
            success: true,
            ...map
        });

    } catch (error) {

        console.error('Error fetching map:', error);

        res.status(500).json({
            success: false,
            error: 'Failed to fetch map'
        });

    }
};

exports.getMaps = async (req, res) => {

    try {

        const mapsRes = await db.query(
            'SELECT id, name, event_type, created_at FROM maps ORDER BY created_at DESC'
        );

        res.json(mapsRes.rows);

    } catch (error) {

        console.error('Error listing maps:', error);

        res.status(500).json({
            error: 'Failed to list maps'
        });

    }
};

exports.deleteMap = async (req, res) => {

    const { id } = req.params;

    try {

        const result = await db.query(
            'DELETE FROM maps WHERE id = $1',
            [id]
        );

        if (result.rowCount === 0) {

            return res.status(404).json({
                error: 'Map not found'
            });

        }

        res.json({
            success: true,
            message: 'Map deleted successfully'
        });

    } catch (error) {

        console.error('Error deleting map:', error);

        res.status(500).json({
            error: 'Failed to delete map'
        });

    }
};