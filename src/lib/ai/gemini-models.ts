/**
 * Current Gemini models, tried in order. Google retires older model IDs
 * (e.g. gemini-2.0-flash, gemini-1.5-*), so never hard-code those.
 */
export const DEFAULT_GEMINI_MODELS = ["gemini-3.8-flash", "gemini-flash-latest"];

/** Model IDs Google has shut down. Configured values matching these are skipped. */
const RETIRED_GEMINI_MODEL_PATTERN = /^(models\/)?gemini-(1\.0|1\.5|2\.0)(-|$)|^(models\/)?gemini-pro(-vision)?$/i;

export function isRetiredGeminiModel(model: string) {
  return RETIRED_GEMINI_MODEL_PATTERN.test(model.trim());
}

/**
 * Builds the list of Gemini models to try: any configured models first
 * (skipping retired ones), then the current defaults as fallbacks so a stale
 * environment variable can't break AI features.
 */
export function resolveGeminiModels(...configured: Array<string | undefined>) {
  const models: string[] = [];
  for (const value of [...configured, ...DEFAULT_GEMINI_MODELS]) {
    const model = value?.trim().replace(/^models\//, "");
    if (!model || isRetiredGeminiModel(model) || models.includes(model)) continue;
    models.push(model);
  }
  return models;
}
