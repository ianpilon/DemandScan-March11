import OpenAI from 'openai';
import { extractIntervieweeResponses, validatePreprocessing } from './transcriptPreprocessor';

// Helper function to introduce a small delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to update progress with delay
const updateProgress = async (progress, progressCallback) => {
  console.log('Setting Pain Extractor progress to:', progress);
  progressCallback(progress);
  await delay(100);
};

const SYSTEM_PROMPT = `You are an expert JTBD Pain Point and Friction Analyzer specializing in identifying customer pain points, struggles, and friction points preventing progress. Your task is to analyze the provided interview transcript and output ONLY a valid JSON object containing the analysis results, based solely on the explicit content of the transcript.

Analysis Instructions:

1. Identify customer pain points supported by direct, verbatim quotes from the transcript.
2. For each pain point, explain how the quote evidences the pain and its impact.
3. Analyze how these pain points create friction that prevents progress toward goals, using quotes to justify the link.
4. Perform a CURSE analysis (Crucial, Ubiquitous, Recurring, Specific, Extreme) on the most significant problems, tying each criterion to transcript evidence.
5. Output a JSON object with this structure:

{
  "identifiedPains": [
    {
      "painStatement": "Clear description of the pain point",
      "category": "Technical/Process/General/etc",
      "severity": "High/Medium/Low",
      "evidence": "Direct verbatim quote from transcript supporting this pain point",
      "impact": "Description of how this pain point affects the interviewee"
    }
  ],
  "frictionAnalysis": [
    {
      "frictionPoint": "Description of how this creates friction",
      "severity": "High/Medium/Low",
      "analysis": "Detailed explanation of how this friction prevents progress, supported by transcript evidence",
      "relatedGoal": "The specific goal this friction blocks",
      "recommendation": "Optional suggestion for addressing this friction, grounded in the transcript",
      "progressImpact": "Specific explanation of how this friction impedes progress, tied to evidence"
    }
  ],
  "metrics": {
    "coverage": 0.0 to 1.0,  // Proportion of transcript pain points addressed (e.g., 0.8 = 80%)
    "confidence": 0.0 to 1.0,  // Overall confidence based on quote clarity and consistency (e.g., 0.9 = 90%)
    "severityScore": 0.0 to 1.0  // Normalized average of pain/friction severity (e.g., High=1, Medium=0.5, Low=0.25)
  },
  "curseAnalysis": {
    "summary": "Concise overview of the CURSE analysis findings",
    "problems": [
      {
        "title": "Clear title of the problem",
        "severity": "1-10 score",  // Based on combined CURSE factors
        "crucial": "Explanation of why it's critical, with supporting quote",
        "ubiquitous": "Explanation of how widespread it is, with evidence",
        "recurring": "Explanation of how frequently it occurs, with evidence",
        "specific": "Explanation of how well-defined it is, with evidence",
        "extreme": "Explanation of the severity of impact, with evidence",
        "evidence": "Direct verbatim quote from transcript"
      }
    ]
  }
}

Additional Instructions:

- For every pain point, friction point, and CURSE problem, include a verbatim quote from the transcript and explain its relevance in the respective field (e.g., impact, analysis, crucial).
- Prioritize explicit statements over inferred meanings. If inference is needed, note it as a limitation in curseAnalysis.summary.
- Focus on friction points that significantly block progress, supported by transcript evidence. If none are found, return an empty frictionAnalysis array.
- Do not invent or assume data—base all findings strictly on the transcript.
- Calculate metrics as follows:
  - coverage: Proportion of identifiable pain points addressed (e.g., 8/10 = 0.8).
  - confidence: Average confidence based on quote clarity and consistency (e.g., multiple clear quotes = 0.9).
  - severityScore: Normalized average of severity ratings (High=1, Medium=0.5, Low=0.25).
- For CURSE analysis, select problems meeting at least three criteria, scoring severity (1-10) based on the strength of all five factors combined.
- Maintain an analytical tone, avoiding vague or speculative language.
- Output ONLY the JSON object—no additional text, explanations, or formatting.`;

const FRICTION_ANALYSIS_PROMPT = `You are an AI assistant specialized in analyzing friction points that prevent progress towards goals.

Your task is to review the previously identified pain points and determine the specific friction points that are considered painful or blockers preventing progress towards JTBD goals.

Based on the provided pain points and context, please:
1. Identify and analyze friction points preventing progress towards goals
2. Focus on the pains and goals mentioned
3. Determine which friction points are significant blockers
4. Provide a detailed analysis of how and why there is friction
5. Explain how findings relate to impeding customer progress
6. Only include friction points with clear evidence
7. If no blockers or friction exist, explicitly state this

Output your analysis in this JSON structure:
{
  "frictionPoints": [
    {
      "blocker": "Description of the blocking friction point",
      "severity": "Critical/High/Medium/Low",
      "evidence": "Supporting evidence from the pain points",
      "progressImpact": "How this specifically blocks progress",
      "affectedGoals": ["List of affected goals"],
      "recommendations": ["Potential solutions or mitigations"]
    }
  ],
  "analysis": {
    "overallImpact": "Summary of total impact on progress",
    "criticalBlockers": number,
    "totalFrictionPoints": number,
    "confidenceScore": 0.0 to 1.0
  }
}`;

export const NEEDS_ANALYSIS_SYSTEM_PROMPT = `You are an expert Needs Analyst with extensive experience in analyzing discovery call transcripts. Your role is to meticulously examine transcripts to identify both immediate and latent needs of potential clients. You have a keen eye for detail and a deep understanding of business challenges across various industries.

When analyzing a transcript, focus on the following:

Immediate Need Indicators:
- Present tense statements indicating current struggles
- Urgent language and time-sensitive expressions
- Specific metrics related to losses or inefficiencies
- References to active problem-solving attempts
- Mentions of available budget or approvals
- Stakeholder requirements or expectations
- Clear deadlines or time frames

Latent Need Indicators:
- Conditional or aspirational language
- Resigned statements about persistent issues
- Casual comments about desired improvements
- Indirect costs or inefficiencies mentioned in passing
- Hints about team morale or turnover issues
- Obstacles to growth or scaling
- Concerns about competitive positioning
- Potential future risks or worries
- Topics the client avoids or redirects from

Pay special attention to:
- Unprompted stories or anecdotes
- Specific examples shared by the client
- Additional details volunteered without prompting
- Areas where the client provides extensive explanations
- Topics the client revisits multiple times

Your output should be formatted in JSON with the following structure:

{
  "immediateNeeds": [
    {
      "need": "string",
      "urgency": "Critical" | "High" | "Medium" | "Low",
      "evidence": "string",
      "impact": "string",
      "stakeholders": ["string"],
      "metrics": ["string"]
    }
  ],
  "latentNeeds": [
    {
      "need": "string",
      "probability": "High" | "Medium" | "Low",
      "triggers": ["string"],
      "potentialImpact": "string",
      "timeframe": "string"
    }
  ],
  "keyInsights": {
    "unpromptedTopics": ["string"],
    "repeatedThemes": ["string"],
    "avoidedTopics": ["string"],
    "redFlags": ["string"]
  },
  "recommendations": {
    "immediateActions": ["string"],
    "explorationAreas": ["string"],
    "riskMitigations": ["string"]
  }
}

Ensure all responses are in valid JSON format and include specific evidence from the transcript to support each identified need and insight.`;

export const analyzePainPoints = async (input, progressCallback, apiKey) => {
  if (!apiKey && !localStorage.getItem('llmApiKey')) {
    throw new Error('OpenAI API key is required. Please set your API key first.');
  }

  const openai = new OpenAI({
    apiKey: apiKey || localStorage.getItem('llmApiKey'),
    dangerouslyAllowBrowser: true
  });

  // Start with initial progress
  await updateProgress(2, progressCallback);

  try {
    // Extract the transcript and gains analysis from input
    if (!input || !input.transcript) {
      console.error('Invalid input:', input);
      throw new Error('Invalid input. Transcript is required.');
    }
    
    if (!input.gainsAnalysis) {
      console.error('Missing gains analysis in input:', input);
      throw new Error('Gains analysis results are required.');
    }

    // Get the complete transcript
    const completeTranscript = input.transcript;
    
    if (!completeTranscript) {
      throw new Error('No transcript content found in input.');
    }
    
    console.log('Received transcript and gains analysis for pain point extraction');
    console.log('Transcript length:', completeTranscript.length);
    console.log('Gains analysis available:', !!input.gainsAnalysis);

    // Preprocess the transcript to extract only interviewee responses
    console.log('Preprocessing transcript to extract interviewee responses...');
    const preprocessed = extractIntervieweeResponses(completeTranscript);
    
    if (!validatePreprocessing(preprocessed)) {
      throw new Error('Failed to properly preprocess the transcript. Please check the transcript format.');
    }

    console.log('Preprocessing metadata:', preprocessed.metadata);
    console.log('Starting Pain Point and Friction analysis on preprocessed transcript');

    // Include gains analysis results for enhanced pain point detection
    console.log('Including gains analysis in the pain points extraction');
    
    const gainResults = input.gainsAnalysis;
    console.log('Gains analysis structure:', Object.keys(gainResults));
    
    // Prepare the user content with both transcript and gains
    // Handle the case where gainsAnalysis might be a string
    let parsedGains = gainResults;
    if (typeof gainResults === 'string') {
      try {
        parsedGains = JSON.parse(gainResults);
        console.log('Successfully parsed string gains results');
      } catch (e) {
        console.warn('Could not parse gains results as JSON, using as-is', e);
      }
    }
    
    const userContent = JSON.stringify({
      transcript: preprocessed.processedTranscript,
      gainsAnalysis: parsedGains
    });
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-16k",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT + '\n\nImportant: Use the gains analysis results to inform your understanding of pain points. Look for areas where expected gains are not being met or where friction exists in achieving desired outcomes.'
        },
        {
          role: "user",
          content: userContent
        }
      ],
      temperature: 0.5,
      max_tokens: 2000
    });

    // Update progress after main analysis
    await updateProgress(60, progressCallback);

    const rawResponse = response.choices[0].message.content.trim();
    
    // Parse initial analysis
    let analysisResults = JSON.parse(rawResponse);

    // Perform additional friction analysis
    console.log('Starting detailed friction analysis...');
    const frictionResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-16k",
      messages: [
        {
          role: "system",
          content: FRICTION_ANALYSIS_PROMPT
        },
        {
          role: "user",
          content: JSON.stringify({
            painPoints: analysisResults.identifiedPains,
            context: preprocessed.processedTranscript
          })
        }
      ],
      temperature: 0.5,
      max_tokens: 2000
    });

    // Update progress after friction analysis
    await updateProgress(85, progressCallback);

    const frictionResults = JSON.parse(frictionResponse.choices[0].message.content.trim());
    
    // Merge the friction analysis into the main results
    analysisResults.detailedFrictionAnalysis = frictionResults;

    // Complete the progress
    await updateProgress(100, progressCallback);

    return analysisResults;

  } catch (error) {
    console.error('Error in pain point and friction analysis:', error);
    throw error; // Throw the actual error for better debugging
  }
};

export async function analyzeNeeds(chunks, onProgress = () => {}) {
  try {
    const messages = [
      {
        role: 'system',
        content: NEEDS_ANALYSIS_SYSTEM_PROMPT
      }
    ];

    // Add transcript chunks as user messages
    chunks.forEach((chunk, index) => {
      messages.push({
        role: 'user',
        content: `Transcript Part ${index + 1}:\n${chunk}`
      });
      onProgress(Math.round((index / chunks.length) * 50));
    });

    // Request analysis
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    });

    onProgress(75);

    // Parse and validate the response
    const analysisResult = JSON.parse(response.choices[0].message.content);

    // Ensure all required fields are present
    if (!analysisResult.immediateNeeds || !analysisResult.latentNeeds || !analysisResult.keyInsights || !analysisResult.recommendations) {
      throw new Error('Invalid analysis result structure');
    }

    onProgress(100);
    return analysisResult;
  } catch (error) {
    console.error('Error in needs analysis:', error);
    throw error;
  }
}
