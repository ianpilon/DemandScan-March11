import OpenAI from 'openai';

export const JTBD_PRIMARY_GOAL_SYSTEM_PROMPT = `You are an expert Jobs-to-be-Done (JTBD) analyst specializing in identifying primary goals from customer interviews. Your task is to analyze the transcript and identify the core jobs, tasks, and objectives that the interviewee is trying to accomplish.

Focus on identifying:
1. Primary functional jobs (what they're trying to accomplish)
2. Emotional jobs (how they want to feel)
3. Social jobs (how they want to be perceived)
4. Current approaches and workarounds
5. Success criteria and metrics

The input will be a detailed analysis of the interview transcript, which has already been processed and summarized. Use this analysis to extract JTBD insights.

When determining confidence scores, use the following criteria:

High Confidence (80-100%):
- Multiple clear, direct quotes supporting the finding
- Consistent patterns across different parts of the transcript
- Strong alignment between stated goals and observed behaviors
- Minimal contradictions or ambiguity

Moderate Confidence (60-79%):
- Some supporting quotes but may be less direct
- Patterns exist but with some inconsistencies
- General alignment between goals and behaviors
- Some ambiguity or potential alternative interpretations

Low Confidence (0-59%):
- Limited or indirect supporting evidence
- Inconsistent or contradictory patterns
- Misalignment between stated goals and behaviors
- High ambiguity or multiple competing interpretations

Format your response in the following JSON structure:

{
  "primaryGoal": {
    "statement": "string",
    "confidence": number,  // Based on above criteria
    "context": "string"   // Include key supporting evidence
  },
  "jobComponents": {
    "functional": {
      "description": "string",
      "evidence": ["string"]  // Include quotes or specific examples
    },
    "emotional": {
      "description": "string",
      "evidence": ["string"]
    },
    "social": {
      "description": "string",
      "evidence": ["string"]
    }
  },
  "currentApproaches": [{
    "description": "string",
    "effectiveness": "string",
    "evidence": "string"
  }],
  "successCriteria": [{
    "criterion": "string",
    "importance": "High" | "Medium" | "Low",
    "evidence": "string"
  }],
  "analysis": {
    "summary": "string",
    "confidenceScore": number,  // Overall confidence based on above criteria
    "limitations": ["string"]   // Note any factors affecting confidence
  }
}`;

const SYNTHESIS_PROMPT = `You are an expert Jobs-to-be-Done (JTBD) analyst. Your task is to synthesize multiple JTBD analyses into a single cohesive analysis. Review all analyses and create a unified view that captures the most important and consistent findings while resolving any conflicts.

Previous analyses are provided as a JSON array. Create a single analysis that:
1. Identifies the most strongly supported primary goal
2. Combines and deduplicates evidence
3. Resolves any conflicts between analyses
4. Maintains the highest confidence findings
5. Creates a comprehensive view of the customer's jobs to be done

Format your response in the same JSON structure as the input analyses.`;

const analyzeChunk = async (openai, chunk, chunkIndex, totalChunks) => {
  const messages = [
    {
      role: 'system',
      content: JTBD_PRIMARY_GOAL_SYSTEM_PROMPT
    },
    {
      role: 'user',
      content: `Please analyze this interview transcript chunk (${chunkIndex + 1}/${totalChunks}):\n\n${chunk}`
    }
  ];

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages,
    temperature: 0.7,
    max_tokens: 2500
  });

  return JSON.parse(response.choices[0].message.content);
};

const synthesizeAnalyses = async (openai, analyses) => {
  const messages = [
    {
      role: 'system',
      content: SYNTHESIS_PROMPT
    },
    {
      role: 'user',
      content: `Please synthesize these JTBD analyses into a single cohesive analysis:\n\n${JSON.stringify(analyses, null, 2)}`
    }
  ];

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages,
    temperature: 0.7,
    max_tokens: 2500
  });

  return JSON.parse(response.choices[0].message.content);
};

export const analyzeJTBDPrimaryGoal = async (chunkingResults, progressCallback, apiKey) => {
  console.log('Starting JTBD Primary Goal Analysis with:', {
    hasChunkingResults: !!chunkingResults,
    hasProgressCallback: !!progressCallback,
    hasApiKey: !!apiKey
  });

  if (!apiKey) {
    console.error('Missing API key');
    throw new Error('OpenAI API key is required. Please set your API key first.');
  }

  if (!chunkingResults || !chunkingResults.finalSummary) {
    console.error('Invalid chunking results:', chunkingResults);
    throw new Error('Invalid chunking results. Expected finalSummary to be present.');
  }

  const openai = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true
  });

  try {
    if (progressCallback) progressCallback(10);
    console.log('Initialized OpenAI client');

    // Use the final summary from the chunking results
    const messages = [
      {
        role: 'system',
        content: JTBD_PRIMARY_GOAL_SYSTEM_PROMPT
      },
      {
        role: 'user',
        content: `Please analyze this interview transcript summary to identify the primary Jobs-to-be-Done:\n\n${chunkingResults.finalSummary}`
      }
    ];

    if (progressCallback) progressCallback(30);
    console.log('Prepared messages for analysis');

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      temperature: 0.7,
      max_tokens: 2500
    });

    if (progressCallback) progressCallback(80);
    console.log('Received response from OpenAI');

    if (!response.choices?.[0]?.message?.content) {
      console.error('Invalid response from OpenAI:', response);
      throw new Error('Invalid response from OpenAI');
    }

    const analysisResult = JSON.parse(response.choices[0].message.content);

    if (!analysisResult.primaryGoal || !analysisResult.jobComponents) {
      console.error('Invalid analysis result structure:', analysisResult);
      throw new Error('Invalid analysis result structure');
    }

    if (progressCallback) progressCallback(100);
    console.log('Analysis complete');

    return analysisResult;

  } catch (error) {
    console.error('Error in JTBD Primary Goal Analysis:', error);
    // Ensure progress callback is reset on error
    if (progressCallback) progressCallback(0);
    throw error;
  }
};
