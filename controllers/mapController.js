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

        // Create Map
        const mapRes = await client.query(
            'INSERT INTO maps (name, event_type, center_lat, center_lng, zoom, measurement_unit, grid_enabled, grid_size, layers, settings) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id',
            [name || 'Untitled Map', eventType || 'festival', center_lat || 0, center_lng || 0, zoom || 14, measurementUnit || 'meters', grid_enabled || false, grid_size || 10, layers || null, settings || null]
        );
        const mapId = mapRes.rows[0].id;

        // Create Zones
        if (zones && zones.length > 0) {
            for (const zone of zones) {
                await client.query(
                    'INSERT INTO zones (id, map_id, name, type, color, fill_opacity, path, status, visible, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
                    [zone.id, mapId, zone.name, zone.zoneType?.id || zone.type, zone.color, zone.fillOpacity || 0.2, JSON.stringify(zone.path), zone.status, zone.visible !== false, JSON.stringify(zone.metadata || {})]
                );
            }
        }

        // Create Assets
        if (assets && assets.length > 0) {
            for (const asset of assets) {
                await client.query(
                    'INSERT INTO map_assets (id, map_id, zone_id, asset_def_id, name, lat, lng, x, y, rotation, width, length, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)',
                    [
                        asset.id,
                        mapId,
                        asset.parentId,
                        asset.assetDefId || asset.assetDef?.id || asset.id.split('_')[0],
                        asset.name,
                        asset.lat,
                        asset.lng,
                        asset.x,
                        asset.y,
                        asset.rotationDeg || asset.rotation || 0,
                        asset.widthM || asset.width,
                        asset.lengthM || asset.length,
                        JSON.stringify(asset) // Store the whole object in metadata for safety
                    ]
                );
            }
        }

        // Create Lines
        if (lines && lines.length > 0) {
            for (const line of lines) {
                await client.query(
                    'INSERT INTO map_lines (id, map_id, parentId, name, path, color, weight, pattern) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
                    [line.id, mapId, line.parentId, line.name, JSON.stringify(line.path), line.color, line.weight, line.pattern]
                );
            }
        }

        // Create Annotations
        if (annotations && annotations.length > 0) {
            for (const ann of annotations) {
                await client.query(
                    'INSERT INTO map_annotations (id, map_id, parentId, text, lat, lng, style) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                    [ann.id, mapId, ann.parentId, ann.text, ann.lat, ann.lng, JSON.stringify(ann.style || {})]
                );
            }
        }

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

        // Update Map
        const updateRes = await client.query(
            'UPDATE maps SET name = $1, event_type = $2, center_lat = $3, center_lng = $4, zoom = $5, measurement_unit = $6, grid_enabled = $7, grid_size = $8, layers = $9, settings = $10, updated_at = CURRENT_TIMESTAMP WHERE id = $11',
            [name, eventType || 'festival', center_lat || 0, center_lng || 0, zoom || 14, measurementUnit || 'meters', grid_enabled || false, grid_size || 10, layers || null, settings || null, id]
        );

        if (updateRes.rowCount === 0) {
            console.error(`Map with ID ${id} not found for update!`);
            throw new Error(`Map with ID ${id} not found`);
        }

        // ── Upsert zones ──
        const incomingZoneIds = (zones || []).map(z => z.id).filter(Boolean);
        if (incomingZoneIds.length > 0) {
            // Delete assets whose parent zone is about to be removed (FK constraint)
            await client.query(
                `DELETE FROM map_assets WHERE map_id = $1 AND zone_id IS NOT NULL AND zone_id NOT IN (${incomingZoneIds.map((_, i) => `$${i + 2}`).join(',')})`,
                [id, ...incomingZoneIds]
            );
            // Remove zones no longer in the payload
            await client.query(
                `DELETE FROM zones WHERE map_id = $1 AND id NOT IN (${incomingZoneIds.map((_, i) => `$${i + 2}`).join(',')})`,
                [id, ...incomingZoneIds]
            );
        } else {
            // No zones in payload — remove all
            await client.query('DELETE FROM map_assets WHERE map_id = $1 AND zone_id IS NOT NULL', [id]);
            await client.query('DELETE FROM zones WHERE map_id = $1', [id]);
        }

        if (zones && zones.length > 0) {
            for (const zone of zones) {
                await client.query(
                    `INSERT INTO zones (id, map_id, name, type, color, fill_opacity, path, status, visible, metadata)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                     ON CONFLICT (id) DO UPDATE SET
                       name = EXCLUDED.name, type = EXCLUDED.type, color = EXCLUDED.color,
                       fill_opacity = EXCLUDED.fill_opacity, path = EXCLUDED.path,
                       status = EXCLUDED.status, visible = EXCLUDED.visible,
                       metadata = EXCLUDED.metadata, updated_at = CURRENT_TIMESTAMP`,
                    [zone.id, id, zone.name, zone.zoneType?.id || zone.type, zone.color, zone.fillOpacity || 0.2, JSON.stringify(zone.path), zone.status, zone.visible !== false, JSON.stringify(zone.metadata || {})]
                );
            }
        }

        // ── Upsert assets ──
        const incomingAssetIds = (assets || []).map(a => a.id).filter(Boolean);
        if (incomingAssetIds.length > 0) {
            await client.query(
                `DELETE FROM map_assets WHERE map_id = $1 AND id NOT IN (${incomingAssetIds.map((_, i) => `$${i + 2}`).join(',')})`,
                [id, ...incomingAssetIds]
            );
        } else {
            await client.query('DELETE FROM map_assets WHERE map_id = $1', [id]);
        }

        if (assets && assets.length > 0) {
            for (const asset of assets) {
                await client.query(
                    `INSERT INTO map_assets (id, map_id, zone_id, asset_def_id, name, lat, lng, x, y, rotation, width, length, metadata)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                     ON CONFLICT (id) DO UPDATE SET
                       zone_id = EXCLUDED.zone_id, asset_def_id = EXCLUDED.asset_def_id,
                       name = EXCLUDED.name, lat = EXCLUDED.lat, lng = EXCLUDED.lng,
                       x = EXCLUDED.x, y = EXCLUDED.y, rotation = EXCLUDED.rotation,
                       width = EXCLUDED.width, length = EXCLUDED.length,
                       metadata = EXCLUDED.metadata, updated_at = CURRENT_TIMESTAMP`,
                    [
                        asset.id, id, asset.parentId,
                        asset.assetDefId || asset.assetDef?.id || asset.id.split('_')[0],
                        asset.name, asset.lat, asset.lng, asset.x, asset.y,
                        asset.rotationDeg || asset.rotation || 0,
                        asset.widthM || asset.width, asset.lengthM || asset.length,
                        JSON.stringify(asset)
                    ]
                );
            }
        }

        // ── Upsert lines ──
        const incomingLineIds = (lines || []).map(l => l.id).filter(Boolean);
        if (incomingLineIds.length > 0) {
            await client.query(
                `DELETE FROM map_lines WHERE map_id = $1 AND id NOT IN (${incomingLineIds.map((_, i) => `$${i + 2}`).join(',')})`,
                [id, ...incomingLineIds]
            );
        } else {
            await client.query('DELETE FROM map_lines WHERE map_id = $1', [id]);
        }

        if (lines && lines.length > 0) {
            for (const line of lines) {
                await client.query(
                    `INSERT INTO map_lines (id, map_id, parentId, name, path, color, weight, pattern)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                     ON CONFLICT (id) DO UPDATE SET
                       parentId = EXCLUDED.parentId, name = EXCLUDED.name,
                       path = EXCLUDED.path, color = EXCLUDED.color,
                       weight = EXCLUDED.weight, pattern = EXCLUDED.pattern`,
                    [line.id, id, line.parentId, line.name, JSON.stringify(line.path), line.color, line.weight || 4, line.pattern]
                );
            }
        }

        // ── Upsert annotations ──
        const incomingAnnIds = (annotations || []).map(a => a.id).filter(Boolean);
        if (incomingAnnIds.length > 0) {
            await client.query(
                `DELETE FROM map_annotations WHERE map_id = $1 AND id NOT IN (${incomingAnnIds.map((_, i) => `$${i + 2}`).join(',')})`,
                [id, ...incomingAnnIds]
            );
        } else {
            await client.query('DELETE FROM map_annotations WHERE map_id = $1', [id]);
        }

        if (annotations && annotations.length > 0) {
            for (const ann of annotations) {
                await client.query(
                    `INSERT INTO map_annotations (id, map_id, parentId, text, lat, lng, style)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)
                     ON CONFLICT (id) DO UPDATE SET
                       parentId = EXCLUDED.parentId, text = EXCLUDED.text,
                       lat = EXCLUDED.lat, lng = EXCLUDED.lng, style = EXCLUDED.style`,
                    [ann.id, id, ann.parentId, ann.text, ann.lat, ann.lng, JSON.stringify(ann.style || {})]
                );
            }
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
        const zonesRes = await db.query(`
            SELECT z.*, t.name as type_name, t.color as type_color, t.layout_type, t.capacity_label, t.capacity_unit, t.allowed_asset_types, t.sub_types
            FROM zones z
            LEFT JOIN zone_types t ON z.type = t.id
            WHERE map_id = $1
        `, [id]);

        // Join with asset_definitions to get icons/colors/etc.
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

        // Map assets to frontend format (including assetDef hydration)
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

        // Map lines
        const lines = linesRes.rows.map(l => ({
            ...l,
            type: 'line',
            parentId: l.parentid, // pg might lower case columns if not quoted
            weight: parseInt(l.weight) || 4
        }));

        // Map annotations
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
