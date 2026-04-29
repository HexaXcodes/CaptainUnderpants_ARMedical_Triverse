// controllers/workflowController.js
const path = require('path');
const fs = require('fs');
const asyncHandler = require('../middleware/asyncHandler');
const { cache } = require('../services/cache');

const workflowsPath = path.join(__dirname, '..', 'data', 'workflows.json');
const workflows = JSON.parse(fs.readFileSync(workflowsPath, 'utf-8'));

// GET /api/workflow
exports.listWorkflows = asyncHandler(async (req, res) => {
  const cacheKey = 'workflow:list';
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  const list = Object.values(workflows).map((w) => ({
    id: w.id,
    name: w.name,
    description: w.description,
    severities: Object.keys(w.severityLevels)
  }));
  cache.set(cacheKey, list, 86400); // 24h — workflows rarely change
  res.json(list);
});

// GET /api/workflow/:id/:severity
exports.getWorkflow = asyncHandler(async (req, res) => {
  const { id, severity } = req.params;
  const cacheKey = `workflow:${id}:${severity}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  const wf = workflows[id];
  if (!wf) return res.status(404).json({ error: 'Workflow not found' });

  const sev = wf.severityLevels[severity];
  if (!sev)
    return res
      .status(404)
      .json({ error: `Severity '${severity}' not available for this workflow` });

  const payload = {
    workflowId: wf.id,
    workflowName: wf.name,
    ...sev
  };
  cache.set(cacheKey, payload, 86400);
  res.json(payload);
});

// POST /api/workflow/detect
exports.detectSeverity = asyncHandler(async (req, res) => {
  const { workflowId, markerHint } = req.body;
  const wf = workflows[workflowId || 'wound_care'];
  if (!wf) return res.status(404).json({ error: 'Workflow not found' });

  let severity = markerHint;
  if (!severity || !wf.severityLevels[severity]) {
    const options = Object.keys(wf.severityLevels);
    severity = options[Math.floor(Math.random() * options.length)];
  }

  const sev = wf.severityLevels[severity];
  res.json({
    detected: true,
    workflowId: wf.id,
    workflowName: wf.name,
    severity,
    confidence: 0.87,
    ...sev
  });
});
