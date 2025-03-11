import analyzeInterview from './interviewAnalysis';

/**
 * @param {string} transcript
 * @returns {Promise<import('./analysisTypes').AnalysisResult>}
 */
export const analyzeJTBD = async (transcript) => {
  const fullAnalysis = await analyzeInterview(transcript);
  return {
    ...fullAnalysis.jtbdAnalysis,
    progress: 100
  };
};

/**
 * @param {string} transcript
 * @returns {Promise<import('./analysisTypes').AnalysisResult>}
 */
export const analyzeCURSE = async (transcript) => {
  const fullAnalysis = await analyzeInterview(transcript);
  return {
    ...fullAnalysis.curseAnalysis,
    progress: 100
  };
};

/**
 * @param {string} transcript
 * @param {import('./analysisTypes').AnalysisResult} jtbdResults
 * @param {import('./analysisTypes').AnalysisResult} curseResults
 * @returns {Promise<import('./analysisTypes').AnalysisResult>}
 */
export const analyzeProblemFit = async (transcript, jtbdResults, curseResults) => {
  const fullAnalysis = await analyzeInterview(transcript);
  return {
    ...fullAnalysis.problemFitMatrixAnalysis,
    summary: `Analysis based on JTBD (${jtbdResults.score}/10) and CURSE (${curseResults.score}/10) findings.`,
    progress: 100
  };
};

/**
 * @param {string} transcript
 * @returns {Promise<import('./analysisTypes').PrimingAnalysisResult>}
 */
export const analyzePriming = async (transcript) => {
  const fullAnalysis = await analyzeInterview(transcript);
  return {
    ...fullAnalysis.primingAnalysis,
    progress: 100
  };
};

/**
 * @param {string} transcript
 * @param {Object} allResults
 * @returns {Promise<string[]>}
 */
export const generateRecommendations = async (transcript, allResults) => {
  const fullAnalysis = await analyzeInterview(transcript);
  return fullAnalysis.actionableRecommendations;
};
