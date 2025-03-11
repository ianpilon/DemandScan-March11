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

const PROBLEM_AWARENESS_MATRIX_SYSTEM_PROMPT = `You are an expert Problem Awareness Matrix Analyst with extensive experience in analyzing customer interviews. Your role is to assess the interviewee's level of understanding and awareness regarding their problems, challenges, and potential solutions.

Focus on identifying:
1. The interviewee's depth of understanding about their problems
2. Their awareness of implications and consequences
3. Their knowledge of potential solutions
4. Any gaps or inconsistencies in their understanding

Your output should be formatted in JSON with the following structure:

{
  "matrix": [
    {
      "dimension": "string",
      "score": number,  // 0-100
      "analysis": "string",
      "evidence": ["string"]
    }
  ],
  "dimensions": {
    "problemRecognition": {
      "score": number,  // 0-100
      "strengths": ["string"],
      "weaknesses": ["string"]
    },
    "impactAwareness": {
      "score": number,  // 0-100
      "strengths": ["string"],
      "weaknesses": ["string"]
    },
    "solutionKnowledge": {
      "score": number,  // 0-100
      "strengths": ["string"],
      "weaknesses": ["string"]
    }
  },
  "analysis": {
    "summary": "string",
    "overallScore": number,  // 0-100
    "limitations": ["string"]
  }
}

For each dimension, provide clear evidence from the transcript to support your assessment. Scores should reflect:
- 80-100: Deep understanding with clear articulation
- 60-79: Basic understanding with some gaps
- 0-59: Limited understanding with significant gaps

Ensure all responses are in valid JSON format and include specific evidence from the transcript to support each assessment.`;

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

export const analyzeProblemAwareness = async (chunkingResults, progressCallback, apiKey) => {
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
    // Extract the complete transcript from chunking results
    if (!chunkingResults || !chunkingResults.finalSummary) {
      console.error('Invalid chunking results:', chunkingResults);
      throw new Error('Invalid chunking results. Expected finalSummary to be present.');
    }

    // Get the complete analysis from the chunks
    const analysisContent = chunkingResults.finalSummary;
    
    if (!analysisContent) {
      throw new Error('No analysis content found in chunking results.');
    }

    console.log('Starting problem awareness matrix analysis with content:', analysisContent);

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
