// src/services/workflowService.js
import { apiFetch, apiUpload } from './api';

export const workflowService = {
  list: () => apiFetch('/workflow', { withAuth: false }),

  detect: (workflowId, markerHint) =>
    apiFetch('/workflow/detect', {
      method: 'POST',
      body: { workflowId, markerHint },
      withAuth: false
    }),

  get: (id, severity) =>
    apiFetch(`/workflow/${id}/${severity}`, { withAuth: false }),

  // Reports (used on the Upload page)
  uploadReport: (file) => {
    const fd = new FormData();
    fd.append('report', file);
    return apiUpload('/upload/report', fd);
  },
  listReports: () => apiFetch('/upload/reports')
};
