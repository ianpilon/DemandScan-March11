import OpenAI from 'openai';
import { encode } from 'gpt-tokenizer';

const OPPORTUNITY_QUALIFICATION_SYSTEM_PROMPT = `You are an expert Opportunity Qualification Analyst. Analyze the provided interview data and previous analyses to evaluate qualification based on Problem Experience, Active Search, and Problem Fit.

You have access to:
1. The complete conversation summary and section summaries
2. Previous analyses of needs and problem awareness

Use all available context to make a comprehensive qualification assessment.

Output your analysis in JSON format:
{
  "overallAssessment": "Fully Qualified" | "Partially Qualified" | "Not Qualified",
  "summary": "string",
  "scores": {
    "problemExperience": {
      "score": number (1-5),
      "confidence": number (0-100),
      "analysis": "string",
      "evidence": ["string"]
    },
    "activeSearch": {
      "score": number (1-5),
      "confidence": number (0-100),
      "analysis": "string",
      "evidence": ["string"]
    },
    "problemFit": {
      "score": number (1-5),
      "confidence": number (0-100),
      "analysis": "string",
      "evidence": ["string"]
    }
  },
  "recommendations": ["string"],
  "redFlags": ["string"]
}`;

// Helper function to count tokens in a message array
const countTokens = (messages) => {
  return messages.reduce((total, message) => {
    const contentTokens = encode(message.content).length;
    // Add 4 tokens for message metadata (role, etc)
    return total + contentTokens + 4;
  }, 0);
};

// Helper function to ensure messages are within token limit
const ensureTokenLimit = (messages, limit = 6000) => {
  const currentTokens = countTokens(messages);
  if (currentTokens > limit) {
    console.warn(`Token limit exceeded: ${currentTokens} tokens.`);
    return false;
  }
  return true;
};

// Helper function to log token usage with structure
const logTokenUsage = (stage, details) => {
  const tokenInfo = {
    stage,
    timestamp: new Date().toISOString(),
    ...details
  };
  console.log('🔍 Token Usage:', JSON.stringify(tokenInfo, null, 2));
};

export const analyzeOpportunityQualification = async (analysisResults, progressCallback) => {
  const apiKey = localStorage.getItem('llmApiKey');
  if (!apiKey) {
    throw new Error('OpenAI API key is required. Please set your API key first.');
  }

  const openai = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true
  });

  try {
    // Start progress
    progressCallback(10);

    // Validate input structure
    if (!analysisResults?.longContextChunking?.finalSummary) {
      console.error('Invalid analysis results:', analysisResults);
      throw new Error('Invalid analysis results. Expected longContextChunking.finalSummary to be present.');
    }

    // Extract required context from previous analyses
    const { longContextChunking, needsAnalysis, problemAwareness } = analysisResults;

    // Log initial analysis context
    logTokenUsage('initialization', {
      finalSummaryTokens: encode(longContextChunking.finalSummary).length,
      sectionSummariesCount: longContextChunking.sectionSummaries?.length || 0,
      hasNeedsAnalysis: !!needsAnalysis,
      hasProblemAwareness: !!problemAwareness
    });

    // Prepare the analysis input using hierarchical context
    const analysisInput = {
      conversationContext: {
        finalSummary: longContextChunking.finalSummary,
        sectionSummaries: longContextChunking.sectionSummaries || [],
      },
      previousAnalyses: {
        needs: needsAnalysis ? {
          immediateNeeds: needsAnalysis.immediateNeeds,
          latentNeeds: needsAnalysis.latentNeeds,
          summary: needsAnalysis.summary
        } : null,
        problemAwareness: problemAwareness ? {
          level: problemAwareness.awarenessLevel,
          analysis: problemAwareness.analysis,
          evidence: problemAwareness.evidence
        } : null
      }
    };

    progressCallback(30);

    // Prepare messages for qualification analysis
    const messages = [
      {
        role: 'system',
        content: OPPORTUNITY_QUALIFICATION_SYSTEM_PROMPT
      },
      {
        role: 'user',
        content: JSON.stringify(analysisInput, null, 2)
      }
    ];

    // Verify token count before making the API call
    const messageTokens = countTokens(messages);
    logTokenUsage('api-request', {
      totalTokens: messageTokens,
      systemPromptTokens: encode(messages[0].content).length,
      userMessageTokens: encode(messages[1].content).length
    });

    if (!ensureTokenLimit(messages)) {
      throw new Error('Token limit exceeded. The analysis context is too large.');
    }

    progressCallback(50);

    // Make the qualification analysis request
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages,
      temperature: 0.7,
      max_tokens: 2000
    });

    // Clean up the response content to handle potential markdown formatting
    let content = response.choices[0].message.content;
    
    // Remove markdown code block markers if present
    content = content.replace(/^```json\s*/g, '').replace(/\s*```$/g, '');
    
    // Remove any leading/trailing whitespace
    content = content.trim();
    
    console.log('Cleaned response content:', content);
    
    try {
      const result = JSON.parse(content);
      return result;
    } catch (parseError) {
      console.error('JSON Parse Error:', {
        originalContent: response.choices[0].message.content,
        cleanedContent: content,
        error: parseError
      });
      throw new Error('Failed to parse agent response: ' + parseError.message);
    }

    logTokenUsage('analysis-complete', {
      inputTokens: encode(JSON.stringify(analysisInput)).length,
      responseTokens: encode(response.choices[0].message.content).length,
      totalTokens: countTokens(messages)
    });

    progressCallback(90);

    // Validate the result
    if (!result.overallAssessment || !result.scores) {
      throw new Error('Invalid analysis result structure');
    }

    progressCallback(100);

  } catch (error) {
    console.error('Error in Opportunity Qualification Analysis:', {
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack
      },
      state: {
        hasAnalysisResults: !!analysisResults,
        hasLongContextChunking: !!analysisResults?.longContextChunking,
        hasNeedsAnalysis: !!analysisResults?.needsAnalysis,
        hasProblemAwareness: !!analysisResults?.problemAwareness
      }
    });
    throw error;
  }
};
