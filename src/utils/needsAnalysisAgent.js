import OpenAI from 'openai';

/**
 * System prompt for the needs analysis agent.
 * 
 * CHANGES (2025-02-03):
 * - Simplified the prompt structure for more consistent output
 * - Added clear guidelines for evidence and context
 * - Updated JSON structure to match UI expectations
 * - Added confidence scoring for latent needs
 */
export const NEEDS_ANALYSIS_SYSTEM_PROMPT = `You are an expert needs analysis agent. Your task is to analyze interview transcripts to identify both immediate and latent needs.

Focus on identifying:
1. Immediate needs - current, pressing needs that the customer is actively aware of
2. Latent needs - underlying or future needs that the customer may not be fully aware of yet

For each need identified, provide:
- Clear description of the need
- Supporting evidence from the transcript
- For immediate needs: urgency level (Critical, High, Medium, Low)
- For latent needs: confidence score (0-100) and rationale

Format your response in the following JSON structure:

{
  "immediateNeeds": [
    {
      "need": "string",
      "urgency": "Critical" | "High" | "Medium" | "Low",
      "context": "string",
      "evidence": "string"
    }
  ],
  "latentNeeds": [
    {
      "need": "string",
      "confidence": number,
      "rationale": "string",
      "evidence": "string"
    }
  ],
  "insights": "string (optional additional insights or patterns noticed)"
}

Guidelines for analysis:
1. Be specific and actionable in need descriptions
2. Use direct quotes or specific examples as evidence
3. Consider both explicit statements and implicit indicators
4. Look for patterns and recurring themes
5. Consider both functional and emotional needs`;

/**
 * Analyzes the given analysis results to identify immediate and latent needs.
 * 
 * CHANGES (2025-02-03):
 * - Now accepts full analysisResults object instead of just chunking results
 * - Added proper validation of input structure
 * - Improved error handling and logging
 * - Returns clean needs analysis results without wrapping
 * 
 * @param {Object} analysisResults - The complete analysis results object
 * @param {Function} progressCallback - Callback for progress updates
 * @param {String} apiKey - OpenAI API key
 * @returns {Object} Clean needs analysis results
 */
export const analyzeNeeds = async (analysisResults, progressCallback, apiKey) => {
  // Log initial state for debugging
  console.log('Starting Needs Analysis with:', {
    hasAnalysisResults: !!analysisResults,
    resultKeys: Object.keys(analysisResults || {}),
    hasProgressCallback: !!progressCallback,
    hasApiKey: !!apiKey
  });

  if (!apiKey) {
    throw new Error('OpenAI API key is required. Please set your API key first.');
  }

  // Validate input structure
  if (!analysisResults?.longContextChunking?.finalSummary) {
    console.error('Invalid analysis results:', analysisResults);
    throw new Error('Invalid analysis results. Expected longContextChunking.finalSummary to be present.');
  }

  const openai = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true
  });

  try {
    progressCallback(10);

    const analysisContent = analysisResults.longContextChunking.finalSummary;
    console.log('Starting needs analysis with content length:', analysisContent.length);

    progressCallback(30);

    // Prepare messages for GPT-4
    const messages = [
      {
        role: 'system',
        content: NEEDS_ANALYSIS_SYSTEM_PROMPT
      },
      {
        role: 'user',
        content: `Please analyze this interview transcript to identify immediate and latent needs:\n\n${analysisContent}`
      }
    ];

    progressCallback(50);

    // Make API call
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      temperature: 0.7,
      max_tokens: 2500
    });

    progressCallback(80);

    if (!response.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from OpenAI');
    }

    // Parse and validate the response
    const needsAnalysis = JSON.parse(response.choices[0].message.content);
    
    // Validate required fields
    if (!needsAnalysis.immediateNeeds || !needsAnalysis.latentNeeds) {
      console.error('Invalid needs analysis structure:', needsAnalysis);
      throw new Error('Invalid needs analysis structure. Missing required fields.');
    }

    progressCallback(100);
    console.log('Needs Analysis complete:', needsAnalysis);

    // Return clean needs analysis results
    return needsAnalysis;

  } catch (error) {
    console.error('Error in Needs Analysis:', error);
    throw error;
  }
};
