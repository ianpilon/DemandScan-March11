import OpenAI from 'openai';
import { extractIntervieweeResponses, validatePreprocessing } from './transcriptPreprocessor';

// Helper function to introduce a small delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to update progress with delay
const updateProgress = async (progress, progressCallback) => {
  console.log('Setting JTBD Analysis progress to:', progress);
  progressCallback(progress);
  await delay(100);
};

const analyzeWithContext = async (openai, chunk, chunkSummary, sectionSummary, finalSummary) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-16k",
      messages: [
        {
          role: "system",
          content: `You are analyzing a conversation transcript to identify Jobs-to-be-Done (JTBD) insights. 
          You have access to different levels of context:
          1. A high-level summary of the entire conversation
          2. A summary of the current section being analyzed
          3. A summary of the specific chunk being analyzed
          4. The detailed chunk content
          
          Use all of these context levels to maintain consistency and extract meaningful insights.`
        },
        {
          role: "user",
          content: `Here's the context for analysis:

          OVERALL CONVERSATION SUMMARY:
          ${finalSummary}

          CURRENT SECTION SUMMARY:
          ${sectionSummary}

          CURRENT CHUNK SUMMARY:
          ${chunkSummary}

          DETAILED CHUNK CONTENT:
          ${chunk}

          Please analyze this content and provide:
          1. Any core jobs-to-be-done identified
          2. Functional aspects of the job
          3. Emotional and social aspects
          4. Current solutions mentioned
          5. Hiring criteria or switching triggers
          
          Format your response as JSON with these keys: coreJobs, functionalAspects, emotionalAspects, socialAspects, currentSolutions, hiringCriteria`
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('Error in chunk analysis:', error);
    throw error;
  }
};

const combineAnalyses = async (openai, analyses, finalSummary) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-16k",
      messages: [
        {
          role: "system",
          content: "You are combining multiple JTBD analyses into a coherent final analysis. Maintain consistency with the overall conversation context."
        },
        {
          role: "user",
          content: `Here's the overall conversation summary for context:
          ${finalSummary}

          Here are the individual analyses to combine:
          ${JSON.stringify(analyses, null, 2)}

          Combine these analyses into a single coherent JTBD analysis. Resolve any conflicts and ensure consistency.
          Format your response as JSON with these keys: coreJobs, functionalAspects, emotionalAspects, socialAspects, currentSolutions, hiringCriteria`
        }
      ],
      temperature: 0.5,
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('Error in combining analyses:', error);
    throw error;
  }
};

export const processWithJTBDAnalysis = async (chunkingResults, progressCallback) => {
  if (!localStorage.getItem('llmApiKey')) {
    throw new Error('OpenAI API key is required. Please set your API key first.');
  }

  const openai = new OpenAI({
    apiKey: localStorage.getItem('llmApiKey'),
    dangerouslyAllowBrowser: true
  });

  await updateProgress(2, progressCallback);

  try {
    if (!chunkingResults || !chunkingResults.chunks) {
      throw new Error('No chunking results provided for analysis.');
    }

    const { 
      chunks, 
      chunkSummaries, 
      sectionSummaries, 
      finalSummary 
    } = chunkingResults;

    // Process each chunk with its associated context
    const chunkAnalyses = [];
    for (let i = 0; i < chunks.length; i++) {
      const progress = Math.floor(((i + 1) / chunks.length) * 80) + 2;
      await updateProgress(progress, progressCallback);
      
      const sectionIndex = Math.floor(i * sectionSummaries.length / chunks.length);
      const analysis = await analyzeWithContext(
        openai,
        chunks[i],
        chunkSummaries[i],
        sectionSummaries[sectionIndex],
        finalSummary
      );
      chunkAnalyses.push(analysis);
    }

    // Combine analyses with context
    await updateProgress(85, progressCallback);
    const combinedAnalysis = await combineAnalyses(openai, chunkAnalyses, finalSummary);

    await updateProgress(95, progressCallback);

    return {
      jtbdAnalysis: combinedAnalysis,
      metadata: {
        sourceLength: chunks.join('\n').length,
        numChunks: chunks.length,
        numSections: sectionSummaries.length,
        processingTimestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('Error in JTBD Analysis:', error);
    throw error;
  }
};
