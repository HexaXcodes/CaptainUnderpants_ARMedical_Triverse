// services/llmService.js (v1.1 — retry, timeout, persistent cache)
const OpenAI = require('openai');
const crypto = require('crypto');
const { cache } = require('./cache');

const hasKey =
  process.env.OPENAI_API_KEY &&
  process.env.OPENAI_API_KEY.startsWith('sk-') &&
  process.env.OPENAI_API_KEY.length > 20;

const openai = hasKey
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 15 * 1000, // 15s — don't make the AR UI wait forever
      maxRetries: 0       // we'll handle retries ourselves
    })
  : null;

// Stable hash key (handles object key reordering, long inputs)
const cacheKey = (obj) =>
  'llm:' + crypto.createHash('sha1').update(JSON.stringify(obj)).digest('hex');

// Sleep helper for backoff
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Call with retry + exponential backoff
async function callWithRetry(prompt, maxAttempts = 2) {
  let lastErr;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const resp = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 300,
        response_format: { type: 'json_object' }
      });
      return JSON.parse(resp.choices[0].message.content);
    } catch (err) {
      lastErr = err;
      // Don't retry on auth/billing errors (saves time)
      if (err.status === 401 || err.status === 403) throw err;
      if (i < maxAttempts - 1) {
        const wait = 500 * Math.pow(2, i); // 500ms, 1s, 2s...
        console.warn(`[LLM] Attempt ${i + 1} failed (${err.message}). Retrying in ${wait}ms`);
        await sleep(wait);
      }
    }
  }
  throw lastErr;
}

/**
 * Explain a single medical step in context of the patient's profile
 */
async function explainStep({ workflowName, severity, step, userMedicalInfo }) {
  const key = cacheKey({ kind: 'step', workflowName, severity, stepId: step.id, userMedicalInfo });
  const cached = cache.get(key);
  if (cached) return { ...cached, cached: true };

  if (!openai) {
    const fallback = buildFallback({ workflowName, severity, step, userMedicalInfo });
    cache.set(key, fallback);
    return { ...fallback, fallback: true };
  }

  const userContext = userMedicalInfo
    ? `Patient profile:
- Age: ${userMedicalInfo.age || 'unknown'}
- Conditions: ${(userMedicalInfo.conditions || []).join(', ') || 'none'}
- Medications: ${(userMedicalInfo.medications || []).join(', ') || 'none'}
- Allergies: ${(userMedicalInfo.allergies || []).join(', ') || 'none'}`
    : 'No patient profile provided.';

  const prompt = `You are a calm, clear medical first-aid assistant guiding a non-medical user via an AR app.

Scenario: ${workflowName} (severity: ${severity})
Current step: "${step.title}" — ${step.instruction}

${userContext}

Respond in JSON ONLY (no markdown, no code fences) with this exact shape:
{
  "why": "1-2 sentence explanation of WHY this step matters medically",
  "warnings": ["specific risk 1", "specific risk 2"],
  "personalizedNote": "advice tailored to the patient profile, or empty string if no profile"
}`;

  try {
    const parsed = await callWithRetry(prompt);
    cache.set(key, parsed);
    return parsed;
  } catch (err) {
    console.error('[LLM] All retries failed, using fallback:', err.message);
    const fallback = buildFallback({ workflowName, severity, step, userMedicalInfo });
    cache.set(key, fallback, 300); // shorter TTL for fallback (5min) so we retry LLM later
    return { ...fallback, fallback: true, error: err.message };
  }
}

/**
 * Get a personalized risk summary for an entire scenario
 */
async function getScenarioSummary({ workflowName, severity, userMedicalInfo }) {
  const key = cacheKey({ kind: 'summary', workflowName, severity, userMedicalInfo });
  const cached = cache.get(key);
  if (cached) return { ...cached, cached: true };

  if (!openai) {
    const fallback = {
      summary: `${workflowName} at ${severity} severity. Follow the steps in order.${
        severity === 'severe' ? ' EMERGENCY services should be contacted.' : ''
      }`,
      personalRisks:
        userMedicalInfo && userMedicalInfo.conditions?.length
          ? [`Patient has ${userMedicalInfo.conditions.join(', ')} — monitor closely.`]
          : []
    };
    cache.set(key, fallback);
    return { ...fallback, fallback: true };
  }

  const prompt = `Medical scenario: ${workflowName}, severity: ${severity}.
Patient profile: ${JSON.stringify(userMedicalInfo || {})}

Return JSON ONLY:
{
  "summary": "2-3 sentence overview of what's happening and what the user should focus on",
  "personalRisks": ["risk 1 based on patient profile", "risk 2"]
}`;

  try {
    const parsed = await callWithRetry(prompt);
    cache.set(key, parsed);
    return parsed;
  } catch (err) {
    console.error('[LLM] Summary failed:', err.message);
    return {
      summary: `${workflowName} (${severity}). Follow steps carefully.`,
      personalRisks: [],
      fallback: true
    };
  }
}

// ===== Fallback explanations (no API key needed) =====
function buildFallback({ workflowName, severity, step, userMedicalInfo }) {
  const reasons = {
    'Wash your hands': 'Hand hygiene prevents bacteria on your skin from infecting the wound.',
    'Stop the bleeding': 'Direct pressure compresses blood vessels and triggers natural clotting.',
    'Clean the wound': 'Removing dirt and debris drastically reduces infection risk.',
    'Apply antiseptic': 'Antiseptics kill remaining surface bacteria before sealing the wound.',
    'Cover the wound': 'A clean barrier blocks bacteria and keeps the wound moist for healing.',
    'Cool the burn': 'Cool water stops the burn from progressing deeper into the skin.',
    'CALL EMERGENCY NOW': 'Severe injuries require professional intervention within minutes for the best outcome.',
    'Start chest compressions': 'Compressions manually circulate oxygenated blood to the brain until the heart restarts.'
  };

  const why =
    reasons[step.title] ||
    `This step is critical in ${workflowName.toLowerCase()} to ensure proper care and reduce complications.`;

  const warnings = [];
  if (severity === 'severe') warnings.push('This is a life-threatening situation — every second matters.');
  if (step.title.includes('NOT') || step.overlay === 'warning')
    warnings.push('Skipping or doing this incorrectly can cause serious harm.');

  let personalizedNote = '';
  if (userMedicalInfo?.conditions?.length) {
    if (userMedicalInfo.conditions.includes('diabetes'))
      personalizedNote = 'Patient has diabetes — wounds heal slower and infection risk is higher. Monitor closely.';
    else if (userMedicalInfo.conditions.includes('hypertension'))
      personalizedNote = 'Patient has hypertension — bleeding may be heavier than normal. Apply firmer pressure.';
    else
      personalizedNote = `Patient has ${userMedicalInfo.conditions.join(', ')} — adjust care accordingly.`;
  }
  if (userMedicalInfo?.allergies?.length && step.title.toLowerCase().includes('antiseptic')) {
    personalizedNote += ` Check antiseptic against allergies: ${userMedicalInfo.allergies.join(', ')}.`;
  }

  return { why, warnings, personalizedNote };
}

module.exports = { explainStep, getScenarioSummary };
