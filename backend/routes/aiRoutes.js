// routes/aiRoutes.js
const express = require('express');
const router = express.Router();
const { explainStep, scenarioSummary } = require('../controllers/aiController');
const { optionalAuth } = require('../middleware/authMiddleware');

router.post('/explain', optionalAuth, explainStep);
router.post('/summary', optionalAuth, scenarioSummary);

module.exports = router;
