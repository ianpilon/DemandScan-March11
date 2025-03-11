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

const SYSTEM_PROMPT = `You are an expert JTBD Pain Point and Friction Analyzer specializing in identifying customer pain points, struggles, and friction points preventing progress. Your task is to analyze the provided transcript and output ONLY a valid JSON object containing the analysis results.

Analysis Instructions:
1. Analyze the provided responses to identify customer pain points
2. Each pain point must be supported by direct quotes from the transcript
3. Analyze how these pain points create friction that prevents progress towards goals
4. Perform a CURSE analysis of the most significant problems
5. Output a JSON object with this structure:
   {
     "identifiedPains": [
       {
         "painStatement": "Clear description of the pain point",
         "category": "Technical/Process/General/etc",
         "severity": "High/Medium/Low",
         "evidence": "Direct quote from transcript supporting this pain point",
         "impact": "Description of the impact this pain point has"
       }
     ],
     "frictionAnalysis": [
       {
         "frictionPoint": "Description of how this creates friction",
         "severity": "High/Medium/Low",
         "analysis": "Detailed analysis of how this friction prevents progress",
         "relatedGoal": "The goal this friction is blocking",
         "recommendation": "Optional suggestion for addressing this friction",
         "progressImpact": "Specific explanation of how this friction impedes progress"
       }
     ],
     "metrics": {
       "coverage": 0.0 to 1.0,
       "confidence": 0.0 to 1.0,
       "severityScore": 0.0 to 1.0
     },
     "curseAnalysis": {
       "summary": "Overview of the CURSE analysis findings",
       "problems": [
         {
           "title": "Clear title of the problem",
           "severity": "1-10 score",
           "crucial": "Explanation of why it's crucial",
           "ubiquitous": "Explanation of how widespread it is",
           "recurring": "Explanation of how frequently it occurs",
           "specific": "Explanation of how well-defined it is",
           "extreme": "Explanation of the severity of impact",
           "evidence": "Supporting evidence from the transcript"
         }
       ]
     }
   }

Additional Instructions:
- Focus on how pain points actively prevent progress towards goals
- Only include friction points that are significant blockers
- Provide clear analysis of why each friction point impedes progress
- If no significant friction points are found, return an empty array for frictionAnalysis
- Never invent or assume points - only report what is clearly supported by the evidence
- For the CURSE analysis, focus on the most significant problems that meet multiple CURSE criteria
- Score severity on a scale of 1-10 based on the combined CURSE factors

Remember: Output ONLY the JSON object - no other text or formatting.`;

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

export const analyzePainPoints = async (chunkingResults, progressCallback) => {
  if (!localStorage.getItem('llmApiKey')) {
    throw new Error('OpenAI API key is required. Please set your API key first.');
  }

  const openai = new OpenAI({
    apiKey: localStorage.getItem('llmApiKey'),
    dangerouslyAllowBrowser: true
  });

  // Start with initial progress
  await updateProgress(2, progressCallback);

  try {
    // Extract the complete transcript from chunking results
    if (!chunkingResults || !Array.isArray(chunkingResults.chunks)) {
      console.error('Invalid chunking results:', chunkingResults);
      throw new Error('Invalid chunking results. Expected chunks array to be present.');
    }

    // Get the complete transcript from the chunks
    const completeTranscript = chunkingResults.chunks.join('\n\n');
    
    if (!completeTranscript) {
      throw new Error('No transcript content found in chunking results.');
    }

    // Preprocess the transcript to extract only interviewee responses
    console.log('Preprocessing transcript to extract interviewee responses...');
    const preprocessed = extractIntervieweeResponses(completeTranscript);
    
    if (!validatePreprocessing(preprocessed)) {
      throw new Error('Failed to properly preprocess the transcript. Please check the transcript format.');
    }

    console.log('Preprocessing metadata:', preprocessed.metadata);
    console.log('Starting Pain Point and Friction analysis on preprocessed transcript');

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-16k",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        {
          role: "user",
          content: preprocessed.processedTranscript
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
