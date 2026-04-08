const db = require('../db');

exports.getAssets = async (req, res) => {
    try {
        const categoriesRes = await db.query('SELECT * FROM asset_categories ORDER BY display_order');
        const assetsRes = await db.query('SELECT * FROM asset_definitions');
        const zonesRes = await db.query('SELECT * FROM zone_types');
        const densityRes = await db.query('SELECT * FROM crowd_density_options');

        const categories = {};
        for (const cat of categoriesRes.rows) {
            categories[cat.name] = assetsRes.rows
                .filter(a => a.category_id === cat.id)
                .map(a => ({
                    id: a.id,
                    name: a.name,
                    icon: a.icon,
                    color: a.color,
                    defaultWidth: parseFloat(a.default_width),
                    defaultLength: parseFloat(a.default_length)
                }));
        }

        res.json({
            categories,
            zoneTypes: zonesRes.rows.map(z => ({
                id: z.id,
                name: z.name,
                color: z.color,
                fillOpacity: parseFloat(z.fill_opacity),
                layoutType: z.layout_type,
                capacityLabel: z.capacity_label,
                capacityUnit: z.capacity_unit,
                allowedAssetTypes: z.allowed_asset_types || [],
                subTypes: z.sub_types || []
            })),
            crowdDensityOptions: densityRes.rows.map(d => ({
                label: d.label,
                value: parseFloat(d.value),
                description: d.description
            }))
        });
    } catch (error) {
        console.error('Error fetching assets from DB:', error);
        res.status(500).json({ error: 'Failed to fetch assets' });
    }
};

