// routes/workflowRoutes.js
const express = require('express');
const router = express.Router();
const {
  listWorkflows,
  getWorkflow,
  detectSeverity
} = require('../controllers/workflowController');

router.get('/', listWorkflows);
router.post('/detect', detectSeverity);
router.get('/:id/:severity', getWorkflow);

module.exports = router;
