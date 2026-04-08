const express = require('express');
const router = express.Router();
const mapController = require('../controllers/mapController');

router.get('/', mapController.getMaps);
router.post('/', mapController.saveMap);
router.put('/:id', mapController.updateMap);
router.get('/:id', mapController.getMap);
router.delete('/:id', mapController.deleteMap);

module.exports = router;
