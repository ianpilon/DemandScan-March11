export const AGENT_SEQUENCE = ['jtbd', 'curse', 'problemFit', 'priming', 'recommendations'];
export const MAX_RETRIES = 2;
export const ANALYSIS_DELAY = 1000;

/**
 * @typedef {Object} AgentState
 * @property {boolean} isAnalyzing
 * @property {number} progress
 * @property {any} results
 * @property {boolean} showResults
 * @property {number} retryCount
 */

/**
 * @typedef {Object} AnalysisResult
 * @property {number} score
 * @property {string[]} strengths
 * @property {string[]} weaknesses
 * @property {string[]} missedOpportunities
 * @property {string} [summary]
 */

/**
 * @typedef {Object} PrimingAnalysisResult
 * @property {number} score
 * @property {string[]} instances
 * @property {string} impact
 * @property {string[]} recommendations
 */
