// controllers/aiController.js
const { explainStep, getScenarioSummary } = require('../services/llmService');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');

// POST /api/ai/explain
exports.explainStep = asyncHandler(async (req, res) => {
  const { workflowName, severity, step } = req.body;
  if (!workflowName || !severity || !step)
    return res
      .status(400)
      .json({ error: 'workflowName, severity, step required' });

  // Validate step shape
  if (!step.id || !step.title)
    return res.status(400).json({ error: 'step must have id and title' });

  let userMedicalInfo = null;
  if (req.user) userMedicalInfo = req.user.medicalInfo;
  else if (req.body.userId) {
    const u = await User.findById(req.body.userId);
    if (u) userMedicalInfo = u.medicalInfo;
  }

  const result = await explainStep({
    workflowName,
    severity,
    step,
    userMedicalInfo
  });
  res.json(result);
});

// POST /api/ai/summary
exports.scenarioSummary = asyncHandler(async (req, res) => {
  const { workflowName, severity } = req.body;
  if (!workflowName || !severity)
    return res.status(400).json({ error: 'workflowName, severity required' });

  let userMedicalInfo = null;
  if (req.user) userMedicalInfo = req.user.medicalInfo;

  const result = await getScenarioSummary({
    workflowName,
    severity,
    userMedicalInfo
  });
  res.json(result);
});
