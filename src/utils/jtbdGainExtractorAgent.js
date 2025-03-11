import OpenAI from 'openai';
import { extractIntervieweeResponses, validatePreprocessing } from './transcriptPreprocessor';

// Helper function to introduce a small delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to update progress with delay
const updateProgress = async (progress, progressCallback) => {
  console.log('Setting Gain Extractor progress to:', progress);
  progressCallback(progress);
  await delay(100);
};

export const processWithGainExtractor = async (chunkingResults, progressCallback) => {
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
    console.log('Starting Gain Extraction analysis on preprocessed transcript');

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-16k",
      messages: [
        {
          role: "system",
          content: `You are an expert JTBD Gain Extractor specializing in identifying and analyzing customer gains. Your task is to analyze the provided transcript (which contains only the interviewee's responses) and output ONLY a valid JSON object containing the analysis results.

Analysis Instructions:
1. Analyze the provided responses to identify customer gains
2. Each gain must be supported by direct quotes from the transcript
3. Output a SINGLE JSON object matching this exact structure:

{
  "identifiedGains": [
    {
      "gainId": "string",
      "gainStatement": "string",
      "category": "functional|emotional|social",
      "importance": "essential|expected|nice_to_have",
      "evidence": [
        {
          "quote": "string",
          "context": "string",
          "situation": "string"
        }
      ],
      "frequency": number,
      "relatedGains": ["gainId"],
      "confidence": number
    }
  ],
  "gainMetadata": {
    "totalGainsIdentified": number,
    "evidencePoints": number,
    "gainDistribution": {
      "functional": number,
      "emotional": number,
      "social": number
    },
    "processingNotes": ["string"]
  },
  "qualityMetrics": {
    "evidenceCoverage": number,
    "gainClarityScore": number,
    "contextualRelevance": number
  },
  "gainPatterns": [
    {
      "patternName": "string",
      "description": "string",
      "relatedGains": ["gainId"],
      "significance": "high|medium|low"
    }
  ]
}

Remember: Output ONLY the JSON object - no other text or formatting.`
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
    await updateProgress(85, progressCallback);

    const rawResponse = response.choices[0].message.content.trim();
    
    // Enhanced debugging logs
    console.log('Raw GPT response type:', typeof rawResponse);
    console.log('Raw GPT response first char:', rawResponse[0]);
    console.log('Raw GPT response last char:', rawResponse[rawResponse.length - 1]);
    console.log('Raw GPT response:', rawResponse);

    // Validate that the response starts with { and ends with }
    if (!rawResponse.startsWith('{') || !rawResponse.endsWith('}')) {
      console.error('Response validation failed:');
      console.error('Starts with {:', rawResponse.startsWith('{'));
      console.error('Ends with }:', rawResponse.endsWith('}'));
      console.error('First 50 chars:', rawResponse.substring(0, 50));
      console.error('Last 50 chars:', rawResponse.substring(rawResponse.length - 50));
      throw new Error('Invalid JSON response from GPT. Response must be a JSON object.');
    }

    // Try to parse the response
    let gainAnalysis;
    try {
      gainAnalysis = JSON.parse(rawResponse);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw Response:', rawResponse);
      throw new Error('Failed to parse Gain Extraction results. The response was not valid JSON.');
    }

    // Validate the parsed object has the required structure
    if (!gainAnalysis.identifiedGains || !Array.isArray(gainAnalysis.identifiedGains)) {
      throw new Error('Invalid Gain Extraction structure. Missing or invalid identifiedGains array.');
    }

    // Complete the progress
    await updateProgress(100, progressCallback);

    return {
      gainAnalysis,
      metadata: {
        sourceLength: completeTranscript.length,
        processingTimestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('Error in Gain Extraction:', error);
    throw error; // Throw the actual error for better debugging
  }
};
