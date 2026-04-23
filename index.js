const express = require('express');
const cors = require('cors');
require('dotenv').config();

const assetRoutes = require('./routes/assetRoutes');
const mapRoutes = require('./routes/mapRoutes');

const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

// 🔴 IMPORTANT FIX — yaha change kiya
app.use(express.json({
    limit: "50mb"
}));

app.use(express.urlencoded({
    limit: "50mb",
    extended: true
}));

// Routes
app.use('/api/assets', assetRoutes);
app.use('/api/maps', mapRoutes);

app.get('/', (req, res) => {
    res.send('EventWiz Backend API is running...');
});

app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    // Initialize database schema on startup
    await db.initDb();
});