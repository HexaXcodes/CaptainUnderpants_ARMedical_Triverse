// src/services/aiService.js
import { apiFetch } from './api';

export const aiService = {
  // step is the full step object: { id, title, instruction, overlay, duration }
  explainStep: ({ workflowName, severity, step }) =>
    apiFetch('/ai/explain', { method: 'POST', body: { workflowName, severity, step } }),

  scenarioSummary: ({ workflowName, severity }) =>
    apiFetch('/ai/summary', { method: 'POST', body: { workflowName, severity } })
};
