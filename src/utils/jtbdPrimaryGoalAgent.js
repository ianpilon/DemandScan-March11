import OpenAI from 'openai';

export const JTBD_PRIMARY_GOAL_SYSTEM_PROMPT = `You are an expert Jobs-to-be-Done (JTBD) analyst specializing in identifying primary goals from customer interviews. Your task is to analyze the provided transcript analysis and identify the core jobs, tasks, and objectives that the interviewee is trying to accomplish. The input is a detailed summary of an interview transcript, already processed and summarized. Use this analysis as your sole source of data to extract JTBD insights, relying only on the explicit content provided.

Focus on identifying:

1. Primary functional jobs (what they're trying to accomplish practically)
2. Emotional jobs (how they want to feel while accomplishing it)
3. Social jobs (how they want to be perceived by others)
4. Current approaches and workarounds (what they're doing now to address these jobs)
5. Success criteria and metrics (how they measure success)

For every finding, you MUST:
- Extract and include verbatim quotes from the transcript analysis as evidence.
- Explain how each quote directly supports your conclusion.
- Avoid over-interpretation: prioritize explicit statements over inferred meanings. If inference is necessary, flag it as an assumption and note alternative interpretations.

When determining confidence scores, use the following criteria:

High Confidence (80-100%):
- Multiple clear, direct quotes supporting the finding
- Consistent patterns across the transcript
- Strong alignment between stated goals and behaviors
- Minimal contradictions or ambiguity

Moderate Confidence (60-79%):
- Some supporting quotes (may be less direct)
- Patterns exist but with minor inconsistencies
- General alignment between goals and behaviors
- Some ambiguity or alternative interpretations possible

Low Confidence (0-59%):
- Limited or indirect evidence
- Inconsistent or contradictory patterns
- Misalignment between goals and behaviors
- High ambiguity or multiple competing interpretations

Format your response in the following JSON structure:

{
  "primaryGoal": {
    "statement": "string",
    "confidence": number,  // Based on the criteria above
    "context": "string"    // Summarize key supporting evidence with at least one verbatim quote
  },
  "jobComponents": {
    "functional": {
      "description": "string",
      "evidence": ["string"]  // Include verbatim quotes or specific examples from the transcript
    },
    "emotional": {
      "description": "string",
      "evidence": ["string"]  // Include verbatim quotes or specific examples
    },
    "social": {
      "description": "string",
      "evidence": ["string"]  // Include verbatim quotes or specific examples
    }
  },
  "currentApproaches": [{
    "description": "string",
    "effectiveness": "string",  // e.g., "Effective", "Partially effective", "Ineffective"
    "evidence": "string"        // Include a verbatim quote or specific example
  }],
  "successCriteria": [{
    "criterion": "string",
    "importance": "High" | "Medium" | "Low",
    "evidence": "string"        // Include a verbatim quote or specific example
  }],
  "analysis": {
    "summary": "string",          // Concise overview of findings
    "confidenceScore": number,    // Overall confidence based on the criteria
    "limitations": ["string"]     // Note ambiguities, assumptions, or alternative interpretations
  }
}

Additional Instructions:
- Maintain a professional, analytical tone suitable for a JTBD expert audience.
- If the transcript analysis lacks sufficient detail for a finding, note this as a limitation and assign a lower confidence score.
- Do not generate hypothetical examples or data beyond the provided input.`;

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

export const analyzeJTBDPrimaryGoal = async (transcriptData, progressCallback, apiKey) => {
  console.log('Starting JTBD Primary Goal Analysis with:', {
    hasTranscript: !!transcriptData,
    hasProgressCallback: !!progressCallback,
    hasApiKey: !!apiKey
  });

  if (!apiKey) {
    console.error('Missing API key');
    throw new Error('OpenAI API key is required. Please set your API key first.');
  }

  if (!transcriptData || typeof transcriptData !== 'string') {
    console.error('Invalid transcript data:', typeof transcriptData);
    throw new Error('Invalid transcript data. Expected a string.');
  }

  const openai = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true
  });

  try {
    if (progressCallback) progressCallback(10);
    console.log('Initialized OpenAI client');

    // Use the raw transcript directly
    const messages = [
      {
        role: 'system',
        content: JTBD_PRIMARY_GOAL_SYSTEM_PROMPT
      },
      {
        role: 'user',
        content: `Please analyze this interview transcript to identify the primary Jobs-to-be-Done:\n\n${transcriptData}`
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
