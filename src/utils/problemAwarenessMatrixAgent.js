import OpenAI from 'openai';
import { extractIntervieweeResponses, validatePreprocessing } from './transcriptPreprocessor';

// Helper function to introduce a small delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to update progress with delay
const updateProgress = async (progress, progressCallback) => {
  console.log('Setting Problem Awareness Matrix progress to:', progress);
  progressCallback(progress);
  await delay(100);
};

const PROBLEM_AWARENESS_MATRIX_SYSTEM_PROMPT = `You are an expert Problem Awareness Matrix Analyst with extensive experience in analyzing customer interviews. Your role is to assess the interviewee's level of understanding and awareness regarding their problems, challenges, and potential solutions, based solely on the provided interview transcript.

Focus on identifying:

1. Depth of understanding about their problems.
2. Awareness of implications and consequences.
3. Knowledge of potential solutions.
4. Gaps or inconsistencies in their understanding.

For every assessment, you MUST:

- Extract and include verbatim quotes from the transcript as evidence.
- Explain how each quote supports your score and analysis.
- Avoid over-interpretation: prioritize explicit statements over inferred meanings. If inference is necessary, flag it as an assumption and note it in limitations.

Your output must be formatted in valid JSON with the following structure:

{
  "matrix": [
    {
      "dimension": "string",       // e.g., "Problem Recognition", "Impact Awareness", "Solution Knowledge"
      "score": number,             // 0-100, based on criteria below
      "analysis": "string",        // Detailed explanation of the score, tied to evidence
      "evidence": ["string"]       // Verbatim quotes from the transcript
    }
  ],
  "dimensions": {
    "problemRecognition": {
      "score": number,             // 0-100
      "strengths": ["string"],     // Specific areas of clear understanding
      "weaknesses": ["string"]     // Specific gaps or misunderstandings
    },
    "impactAwareness": {
      "score": number,             // 0-100
      "strengths": ["string"],
      "weaknesses": ["string"]
    },
    "solutionKnowledge": {
      "score": number,             // 0-100
      "strengths": ["string"],
      "weaknesses": ["string"]
    }
  },
  "analysis": {
    "summary": "string",           // Concise overview of awareness levels
    "overallScore": number,        // 0-100, average of dimension scores
    "limitations": ["string"]      // Note ambiguities, assumptions, or data gaps
  }
}

Scoring Criteria:

- 80-100 (Deep Understanding): Multiple clear, direct quotes showing detailed articulation; consistent awareness across the transcript; no significant gaps.
- 60-79 (Basic Understanding): Some supporting quotes, but less detailed or consistent; general awareness with minor gaps or inconsistencies.
- 0-59 (Limited Understanding): Limited or indirect evidence; inconsistent or vague articulation; significant gaps or misunderstandings.

Additional Instructions:

- Base all scores and assessments strictly on the transcript, using verbatim quotes to justify each dimension's score.
- In analysis fields, explain how the evidence supports the assigned score (e.g., clarity, specificity, consistency).
- Identify strengths and weaknesses from explicit transcript content, not assumptions.
- Calculate overallScore as the average of the three dimensions scores.
- Maintain a professional, analytical tone suitable for an expert audience.
- If the transcript lacks sufficient data for an assessment, note this in limitations and adjust scores accordingly.
- Output only valid JSON, with no additional text or formatting.`;

const AWARENESS_SYNTHESIS_PROMPT = `You are an expert in synthesizing problem awareness analysis results. Review the awareness matrix analysis and provide strategic insights and recommendations.

Based on the provided analysis, please:
1. Identify patterns across awareness dimensions
2. Highlight critical gaps that need immediate attention
3. Suggest strategies for improving awareness
4. Recommend specific actions based on their current awareness level

Output your synthesis in this JSON structure:
{
  "patterns": {
    "strengths": ["Areas where awareness is strong"],
    "weaknesses": ["Areas where awareness needs improvement"],
    "inconsistencies": ["Contradictions or misalignments in understanding"]
  },
  "strategicRecommendations": [
    {
      "focus": "What to focus on",
      "why": "Why this is important",
      "how": "How to address it",
      "impact": "Expected impact of addressing this"
    }
  ],
  "roadmap": {
    "immediate": ["Actions to take now"],
    "shortTerm": ["Actions for next phase"],
    "longTerm": ["Future considerations"]
  },
  "risks": {
    "awarenessGaps": ["Risks from lack of awareness"],
    "mitigationStrategies": ["How to address these risks"]
  }
}`;

export const analyzeProblemAwareness = async (input, progressCallback, apiKey) => {
  if (!apiKey) {
    throw new Error('OpenAI API key is required. Please set your API key first.');
  }

  const openai = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true
  });

  // Start with initial progress
  await updateProgress(2, progressCallback);

  try {
    // Extract the transcript and pain analysis from input
    if (!input || (!input.transcript && !input.painAnalysis)) {
      console.error('Invalid input:', input);
      throw new Error('Invalid input. Transcript or pain analysis is required.');
    }
    
    // Get the pain analysis results - handle both object and string formats
    let painResults = input.painAnalysis;
    let analysisContent = '';
    
    if (typeof painResults === 'string') {
      try {
        painResults = JSON.parse(painResults);
        console.log('Successfully parsed string pain results');
      } catch (e) {
        console.warn('Could not parse pain results as JSON, using as-is', e);
      }
    }
    
    // If we have a finalSummary property (for backward compatibility)
    if (input.finalSummary) {
      analysisContent = input.finalSummary;
    } else if (painResults) {
      // Use pain analysis as the primary content
      analysisContent = JSON.stringify(painResults);
    } else {
      throw new Error('No valid analysis content found in input.');
    }
    
    console.log('Starting problem awareness matrix analysis with content length:', analysisContent.length);

    // Initial awareness matrix analysis
    const matrixResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-16k",
      messages: [
        {
          role: "system",
          content: PROBLEM_AWARENESS_MATRIX_SYSTEM_PROMPT
        },
        {
          role: "user",
          content: analysisContent
        }
      ],
      temperature: 0.5,
      max_tokens: 2000
    });

    // Update progress after main analysis
    await updateProgress(60, progressCallback);

    const matrixResults = JSON.parse(matrixResponse.choices[0].message.content.trim());

    // Perform additional synthesis analysis
    console.log('Starting awareness synthesis analysis...');
    const synthesisResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-16k",
      messages: [
        {
          role: "system",
          content: AWARENESS_SYNTHESIS_PROMPT
        },
        {
          role: "user",
          content: JSON.stringify(matrixResults)
        }
      ],
      temperature: 0.5,
      max_tokens: 2000
    });

    // Update progress after synthesis
    await updateProgress(85, progressCallback);

    const synthesisResults = JSON.parse(synthesisResponse.choices[0].message.content.trim());
    
    // Merge the matrix analysis and synthesis results
    const finalResults = {
      ...matrixResults,
      synthesis: synthesisResults
    };

    // Complete the progress
    await updateProgress(100, progressCallback);

    return finalResults;

  } catch (error) {
    console.error('Error in problem awareness matrix analysis:', error);
    throw error;
  }
};
