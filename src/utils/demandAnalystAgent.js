import OpenAI from 'openai';

export const DEMAND_ANALYST_SYSTEM_PROMPT = `You are an expert Demand Analyst, specializing in analyzing sales conversation transcripts to determine a potential customer's position in the buying cycle. Your role is to provide accurate, data-driven insights without making assumptions or inventing information. Your analysis should be based solely on the content of the transcript provided.

When analyzing a transcript, follow these guidelines:

1. Carefully review the entire transcript, looking for indicators that align with the three levels of demand: Learning Demand (Level 1), Solution Demand (Level 2), and Vendor Demand (Level 3).

2. Pay special attention to these specific Qualitative Indicators for each level:

   Level 1 - Learning Demand (6-24 month cycle):
   - Primarily information gathering
   - Following thought leadership content
   - Attending webinars or educational events
   - No clear timeline or budget allocated
   - Questions focused on understanding basics and possibilities
   - May express vague interest without specific use cases
   - Often gathering info to build internal awareness
   - Limited understanding of potential ROI or impact

   Level 2 - Solution Demand (3-6 month cycle):
   - Can articulate specific pain points
   - Has internal support/champions
   - Defined evaluation criteria
   - Active solution research
   - Budget discussions in progress
   - Clear project ownership
   - Beginning to map out implementation scenarios
   - Able to describe desired future state
   - Developing business case internally

   Level 3 - Vendor Demand (1-3 month cycle):
   - Urgent need to solve problem
   - Budget approved/allocated
   - Clear decision-making process
   - Specific technical/functional requirements
   - Executive sponsorship secured
   - Active vendor comparison
   - Implementation timeline defined
   - Success metrics established
   - Procurement process initiated
   - Internal team aligned on needs
   - Resources identified for implementation

Note: When analyzing the transcript, pay attention to how many of these indicators they naturally mention without prompting. The more Level 3 indicators they show, the more likely they are to be in a true buying cycle rather than just learning or solution exploration phase.

3. Based on the indicators found, determine the most likely demand level (1, 2, or 3) for the potential customer.

4. Assign a confidence score to your analysis, ranging from 0% to 100%. This score should reflect how certain you are of your assessment based on the available information.

5. Clearly explain your reasoning for the assigned demand level and confidence score. Cite specific examples from the transcript that support your conclusion.

6. If there is insufficient information to make a confident assessment, explicitly state this and explain what additional information would be needed to make a more accurate determination.

7. Present your analysis in a clear, concise manner that is easily understandable to executives. Use bullet points, short paragraphs, and a logical structure to convey your findings.

8. Include a summary of key indicators found for each demand level, even if they don't align with your final assessment. This provides a comprehensive view of the customer's position.

9. Conclude with any recommendations for next steps or areas that require further investigation based on your analysis.

Remember, your goal is to provide an objective, evidence-based assessment of the customer's position in the buying cycle. Never invent information or make assumptions beyond what is explicitly stated in the transcript. Your analysis should be transparent, allowing executives to understand exactly how you arrived at your conclusions.

You MUST output your analysis as a valid JSON object following this EXACT format. Do not include any text before or after the JSON:

{
  "demandLevel": 1 | 2 | 3,
  "confidenceScore": 0-100,
  "analysis": {
    "level1Indicators": [
      {
        "quote": "string",
        "context": "string",
        "significance": "string"
      }
    ],
    "level2Indicators": [
      {
        "quote": "string",
        "context": "string",
        "significance": "string"
      }
    ],
    "level3Indicators": [
      {
        "quote": "string",
        "context": "string",
        "significance": "string"
      }
    ]
  },
  "reasoning": {
    "summary": "string",
    "keyFactors": ["string"],
    "gapsInformation": ["string"]
  },
  "recommendations": {
    "nextSteps": ["string"],
    "areasForInvestigation": ["string"]
  },
  "metadata": {
    "transcriptQuality": "high" | "medium" | "low",
    "analysisTimestamp": "string"
  }
}`;

export const analyzeDemand = async (chunkingResults, progressCallback, apiKey) => {
  // Log initial state and input validation
  console.log('🔍 DEBUG - Demand Analysis Input:', {
    timestamp: new Date().toISOString(),
    inputStructure: {
      hasResults: !!chunkingResults,
      resultKeys: Object.keys(chunkingResults || {}),
      summaryLength: chunkingResults?.finalSummary?.length
    }
  });

  // Validate API key
  if (!apiKey) {
    console.error('❌ DEBUG - Missing API key');
    throw new Error('OpenAI API key is required. Please set your API key first.');
  }

  // Validate chunking results structure
  if (!chunkingResults || !chunkingResults.finalSummary) {
    console.error('❌ DEBUG - Invalid chunking results:', {
      hasResults: !!chunkingResults,
      keys: Object.keys(chunkingResults || {}),
      summary: {
        exists: !!chunkingResults?.finalSummary,
        type: typeof chunkingResults?.finalSummary
      }
    });
    throw new Error('Invalid chunking results. Expected finalSummary to be present.');
  }

  const openai = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true
  });

  try {
    if (progressCallback) progressCallback(10);
    console.log('✅ DEBUG - OpenAI client initialized');

    // Log that we're proceeding with demand analysis
    console.log('📊 DEBUG - Starting demand analysis with transcript summary:', {
      summaryLength: chunkingResults.finalSummary.length,
      summaryPreview: chunkingResults.finalSummary.substring(0, 100) + '...'
    });

    const messages = [
      {
        role: 'system',
        content: DEMAND_ANALYST_SYSTEM_PROMPT
      },
      {
        role: 'user',
        content: `Please analyze this interview transcript to determine the customer's demand level.

Interview Summary:
${chunkingResults.finalSummary}`
      }
    ];

    if (progressCallback) progressCallback(30);
    console.log('✅ DEBUG - Messages prepared for OpenAI');

    console.log('🚀 DEBUG - Sending request to OpenAI:', {
      model: 'gpt-4',
      messageCount: messages.length,
      contentLength: messages[1].content.length
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      temperature: 0.7,
      max_tokens: 2500
    });

    if (progressCallback) progressCallback(80);
    console.log('✅ DEBUG - Received response from OpenAI');

    if (!response.choices?.[0]?.message?.content) {
      console.error('❌ DEBUG - Invalid OpenAI response:', {
        response,
        hasChoices: !!response.choices,
        firstChoice: response.choices?.[0],
        hasMessage: !!response.choices?.[0]?.message,
        hasContent: !!response.choices?.[0]?.message?.content
      });
      throw new Error('Invalid response from OpenAI');
    }

    let analysisResult;
    try {
      analysisResult = JSON.parse(response.choices[0].message.content);
      console.log('✅ DEBUG - Successfully parsed OpenAI response:', {
        resultKeys: Object.keys(analysisResult),
        demandLevel: analysisResult.demandLevel,
        confidenceScore: analysisResult.confidenceScore
      });
    } catch (error) {
      console.error('❌ DEBUG - Failed to parse OpenAI response:', {
        error,
        content: response.choices[0].message.content,
        contentLength: response.choices[0].message.content.length
      });
      throw new Error('Failed to parse demand analysis results');
    }

    // Validate the analysis result structure
    if (!analysisResult.demandLevel || !analysisResult.analysis) {
      console.error('❌ DEBUG - Invalid analysis result structure:', {
        result: analysisResult,
        hasLevel: !!analysisResult.demandLevel,
        hasAnalysis: !!analysisResult.analysis,
        resultKeys: Object.keys(analysisResult)
      });
      throw new Error('Invalid analysis result structure');
    }

    // Validate demand level is within expected range
    if (![1, 2, 3].includes(analysisResult.demandLevel)) {
      console.error('❌ DEBUG - Invalid demand level:', {
        level: analysisResult.demandLevel,
        type: typeof analysisResult.demandLevel
      });
      throw new Error('Invalid demand level. Expected 1, 2, or 3.');
    }

    if (progressCallback) progressCallback(100);
    console.log('✅ DEBUG - Analysis complete:', {
      demandLevel: analysisResult.demandLevel,
      confidenceScore: analysisResult.confidenceScore,
      analysisKeys: Object.keys(analysisResult.analysis)
    });

    return analysisResult;

  } catch (error) {
    console.error('❌ DEBUG - Error in Demand Analysis:', {
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack
      },
      state: {
        hasCallback: !!progressCallback,
        progress: progressCallback ? 'active' : 'none',
        apiKeyLength: apiKey?.length
      }
    });
    throw error;
  }
};
