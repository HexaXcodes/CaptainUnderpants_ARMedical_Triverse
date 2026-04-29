// src/hooks/useStepExplanation.js
import { useEffect, useState } from 'react';
import { aiService } from '../services/aiService';

export const useStepExplanation = ({ workflowName, severity, step }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!workflowName || !severity || !step) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    aiService
      .explainStep({ workflowName, severity, step })
      .then((res) => { if (!cancelled) setData(res); })
      .catch((err) => { if (!cancelled) setError(err); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [workflowName, severity, step?.id]);

  return { data, loading, error };
};
