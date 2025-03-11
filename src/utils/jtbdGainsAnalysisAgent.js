import OpenAI from 'openai';

export const JTBD_GAINS_SYSTEM_PROMPT = `You are an expert Jobs-to-be-Done (JTBD) analyst specializing in identifying and analyzing potential gains or positive outcomes that interviewees hope to achieve. Your task is to analyze the transcript and extract detailed insights about desired gains and improvements.

Focus on identifying:
1. Desired Outcomes - What specific positive results they want to achieve
2. Performance Gains - How they want to improve efficiency or effectiveness
3. Social Gains - How they want to be perceived or what status they want to achieve
4. Emotional Gains - What feelings or experiences they want to have
5. Cost Savings - What resources (time, money, effort) they want to save

When determining confidence scores, use the following criteria:

High Confidence (80-100%):
- Multiple clear, direct quotes expressing desired gains
- Consistent patterns of gain-seeking behavior across transcript
- Strong emotional or practical motivation evident
- Specific metrics or success criteria mentioned

Moderate Confidence (60-79%):
- Some supporting quotes but less explicit
- General patterns of gain-seeking behavior
- Implied motivation without strong articulation
- General success criteria without specifics

Low Confidence (0-59%):
- Limited or indirect references to gains
- Inconsistent or contradictory desires
- Unclear motivation or rationale
- Vague or missing success criteria

Format your response in the following JSON structure:

{
  "desiredOutcomes": [{
    "outcome": "string",
    "importance": "High" | "Medium" | "Low",
    "confidence": number,
    "evidence": ["string"]
  }],
  "performanceGains": [{
    "gain": "string",
    "currentState": "string",
    "targetState": "string",
    "confidence": number,
    "evidence": ["string"]
  }],
  "socialGains": [{
    "gain": "string",
    "context": "string",
    "confidence": number,
    "evidence": ["string"]
  }],
  "emotionalGains": [{
    "gain": "string",
    "trigger": "string",
    "confidence": number,
    "evidence": ["string"]
  }],
  "costSavings": [{
    "resource": "string",
    "currentCost": "string",
    "targetSaving": "string",
    "confidence": number,
    "evidence": ["string"]
  }],
  "analysis": {
    "summary": "string",
    "primaryGains": ["string"],
    "confidenceScore": number,
    "limitations": ["string"]
  }
}`;

export const analyzeJTBDGains = async (chunkingResults, progressCallback, apiKey) => {
  if (!apiKey) {
    throw new Error('OpenAI API key is required. Please set your API key first.');
  }

  const openai = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true
  });

  try {
    progressCallback(10);

    if (!chunkingResults || !chunkingResults.finalSummary) {
      console.error('Invalid chunking results:', chunkingResults);
      throw new Error('Invalid chunking results. Expected finalSummary to be present.');
    }

    if (!chunkingResults.jtbdResults) {
      console.error('Missing JTBD results:', chunkingResults);
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
        content: `Analyze the following transcript summary and JTBD Primary Goal results to identify potential gains and positive outcomes:

Transcript Summary:
${chunkingResults.finalSummary}

JTBD Primary Goal Results:
${JSON.stringify(chunkingResults.jtbdResults, null, 2)}

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
