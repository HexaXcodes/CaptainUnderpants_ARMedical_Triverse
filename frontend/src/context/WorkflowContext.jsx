// src/context/WorkflowContext.jsx
// Shared state for the current scenario. The AR view will read from here.
// Lightweight by design — keeps merge surface small for the AR engineer.

import { createContext, useContext, useState, useCallback } from 'react';
import { workflowService } from '../services/workflowService';

const WorkflowContext = createContext(null);

export const WorkflowProvider = ({ children }) => {
  const [selectedWorkflow, setSelectedWorkflow] = useState(null); // { id, name, ... }
  const [selectedSeverity, setSelectedSeverity] = useState(null); // 'mild' | 'moderate' | 'severe'
  const [activeScenario, setActiveScenario] = useState(null);     // hydrated GET /workflow/:id/:sev result
  const [currentStep, setCurrentStep] = useState(0);

  // Quick start path — accept a marker hint and let the backend "detect"
  const detect = useCallback(async (workflowId, markerHint) => {
    const res = await workflowService.detect(workflowId, markerHint);
    setSelectedWorkflow({ id: res.workflowId, name: res.workflowName });
    setSelectedSeverity(res.severity);
    setActiveScenario(res);
    setCurrentStep(0);
    return res;
  }, []);

  // Manual selection (when user picks from WorkflowSelect page)
  const loadScenario = useCallback(async (id, severity) => {
    const res = await workflowService.get(id, severity);
    setSelectedWorkflow({ id: res.workflowId, name: res.workflowName });
    setSelectedSeverity(severity);
    setActiveScenario(res);
    setCurrentStep(0);
    return res;
  }, []);

  const reset = useCallback(() => {
    setSelectedWorkflow(null);
    setSelectedSeverity(null);
    setActiveScenario(null);
    setCurrentStep(0);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((s) => {
      const max = (activeScenario?.steps?.length || 1) - 1;
      return Math.min(s + 1, max);
    });
  }, [activeScenario]);

  const prevStep = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 0));
  }, []);

  return (
    <WorkflowContext.Provider
      value={{
        selectedWorkflow,
        selectedSeverity,
        activeScenario,
        currentStep,
        setCurrentStep,
        nextStep,
        prevStep,
        detect,
        loadScenario,
        reset
      }}
    >
      {children}
    </WorkflowContext.Provider>
  );
};

export const useWorkflow = () => {
  const ctx = useContext(WorkflowContext);
  if (!ctx) throw new Error('useWorkflow must be used inside <WorkflowProvider>');
  return ctx;
};
