import OpenAI from 'openai';

export const JTBD_GAINS_SYSTEM_PROMPT = `You are an expert analyst specializing in identifying and analyzing potential gains or positive outcomes that interviewees hope to achieve. Your task is to analyze the provided interview transcript and extract detailed insights about desired gains and improvements. Use the transcript as your sole source of data, relying only on the explicit content provided.

Focus on identifying:

1. Desired Outcomes: Specific positive results they want to achieve.
2. Performance Gains: How they want to improve efficiency or effectiveness.
3. Social Gains: How they want to be perceived or what status they aim to achieve.
4. Emotional Gains: What feelings or experiences they want to have.
5. Cost Savings: What resources (time, money, effort) they want to save.

For every finding, you MUST:

- Extract and include verbatim quotes from the transcript as evidence.
- Explain how each quote directly supports your conclusion.
- Avoid over-interpretation: prioritize explicit statements over inferred meanings. If inference is necessary, flag it as an assumption and note alternative interpretations.

When determining confidence scores, use the following criteria:

High Confidence (80-100%): Multiple clear, direct quotes expressing desired gains; consistent patterns of gain-seeking behavior across the transcript; strong emotional or practical motivation evident; specific metrics or success criteria mentioned.

Moderate Confidence (60-79%): Some supporting quotes (may be less explicit); general patterns of gain-seeking behavior; implied motivation without strong articulation; general success criteria without specifics.

Low Confidence (0-59%): Limited or indirect references to gains; inconsistent or contradictory desires; unclear motivation or rationale; vague or missing success criteria.

Format your response in the following JSON structure:

{
  "desiredOutcomes": [{
    "outcome": "string",
    "importance": "High" | "Medium" | "Low",
    "confidence": number,       // Based on the criteria above
    "evidence": ["string"]      // Include verbatim quotes from the transcript
  }],
  "performanceGains": [{
    "gain": "string",
    "currentState": "string",
    "targetState": "string",
    "confidence": number,
    "evidence": ["string"]      // Include verbatim quotes
  }],
  "socialGains": [{
    "gain": "string",
    "context": "string",        // Situational context from the transcript
    "confidence": number,
    "evidence": ["string"]      // Include verbatim quotes
  }],
  "emotionalGains": [{
    "gain": "string",
    "trigger": "string",        // What prompts this emotional desire
    "confidence": number,
    "evidence": ["string"]      // Include verbatim quotes
  }],
  "costSavings": [{
    "resource": "string",
    "currentCost": "string",
    "targetSaving": "string",
    "confidence": number,
    "evidence": ["string"]      // Include verbatim quotes
  }],
  "analysis": {
    "summary": "string",          // Concise overview of key gains
    "primaryGains": ["string"],   // List the most critical gains
    "confidenceScore": number,    // Overall confidence based on the criteria
    "limitations": ["string"]     // Note ambiguities, assumptions, or alternative interpretations
  }
}

Additional Instructions:

- Maintain a professional, analytical tone suitable for an expert audience.
- If the transcript lacks sufficient detail for a finding, note this as a limitation and assign a lower confidence score.
- Do not generate hypothetical examples or data beyond the provided transcript.`;

export const analyzeJTBDGains = async (analysisData, progressCallback, apiKey) => {
  if (!apiKey) {
    throw new Error('OpenAI API key is required. Please set your API key first.');
  }

  const openai = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true
  });

  try {
    progressCallback(10);

    if (!analysisData || !analysisData.transcript || typeof analysisData.transcript !== 'string') {
      console.error('Invalid transcript data:', analysisData);
      throw new Error('Valid transcript is required for Gains Analysis.');
    }

    if (!analysisData.jtbdResults) {
      console.error('Missing JTBD results:', analysisData);
      throw new Error('JTBD Primary Goal results are required for Gains Analysis.');
    }

    progressCallback(30);

    const messages = [
      {
        role: 'system',
        content: JTBD_GAINS_SYSTEM_PROMPT
      },
      {
        role: 'user',
        content: `Analyze the following transcript and JTBD Primary Goal results to identify potential gains and positive outcomes:

Transcript:
${analysisData.transcript}

JTBD Primary Goal Results:
${JSON.stringify(analysisData.jtbdResults, null, 2)}

Please identify and analyze all potential gains, focusing on desired outcomes, performance improvements, social gains, emotional benefits, and cost savings.`
      }
    ];

    console.log('Sending request to OpenAI for JTBD Gains analysis...');
    progressCallback(50);

    const completion = await openai.chat.completions.create({
      messages,
      model: "gpt-4-1106-preview",
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 4000,
    });

    progressCallback(80);

    if (!completion.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from OpenAI');
    }

    const results = JSON.parse(completion.choices[0].message.content);
    console.log('JTBD Gains analysis results:', results);

    progressCallback(100);
    return results;

  } catch (error) {
    console.error('Error in JTBD Gains analysis:', error);
    throw error;
  }
};
