import OpenAI from 'openai';

// Helper function to introduce a small delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to update progress with delay
const updateProgress = async (progress, progressCallback) => {
  if (progressCallback) {
    console.log('Setting Long Context Chunking progress to:', progress);
    progressCallback(progress);
    await delay(100);
  }
};

// Helper function to count tokens (rough estimate)
const estimateTokenCount = (text) => {
  // GPT models typically use ~4 characters per token on average
  return Math.ceil(text.length / 4);
};

// Helper function to split text into conversation-aware chunks with overlap
const splitIntoConversationChunks = (text, maxTokensPerChunk = 8000, overlapTokens = 500) => {
  const chunks = [];
  const lines = text.split('\n');
  let currentChunk = [];
  let currentTokenCount = 0;
  let overlapBuffer = [];
  let speakerContext = new Map(); // Track recent context for each speaker

  for (const line of lines) {
    const lineTokens = estimateTokenCount(line);
    
    // Extract speaker if line starts with a speaker indicator (e.g., "Speaker A:", "John:")
    const speakerMatch = line.match(/^([^:]+):/);
    if (speakerMatch) {
      const speaker = speakerMatch[1];
      speakerContext.set(speaker, line); // Update context for this speaker
    }
    
    // Check if adding this line would exceed the token limit
    if (currentTokenCount + lineTokens > maxTokensPerChunk && currentChunk.length > 0) {
      // Add speaker context to the chunk if available
      const contextLines = Array.from(speakerContext.values());
      const finalChunk = [...contextLines, ...currentChunk].join('\n');
      chunks.push(finalChunk);
      
      // Create overlap buffer for next chunk
      overlapBuffer = currentChunk.slice(-Math.ceil(currentChunk.length * 0.1)); // Keep last 10% for overlap
      currentChunk = [...overlapBuffer]; // Start new chunk with overlap
      currentTokenCount = overlapBuffer.reduce((sum, line) => sum + estimateTokenCount(line), 0);
    }
    
    currentChunk.push(line);
    currentTokenCount += lineTokens;
  }
  
  // Add the last chunk if there's anything remaining
  if (currentChunk.length > 0) {
    const contextLines = Array.from(speakerContext.values());
    const finalChunk = [...contextLines, ...currentChunk].join('\n');
    chunks.push(finalChunk);
  }
  
  return chunks;
};

// Helper function to summarize individual chunks
const summarizeChunk = async (openai, chunk, chunkIndex, totalChunks) => {
  try {
    console.log(`Summarizing chunk ${chunkIndex + 1} of ${totalChunks}`);
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-16k",
      messages: [
        {
          role: "system",
          content: `You are an expert at analyzing conversations and extracting key information. This is chunk ${chunkIndex + 1} of ${totalChunks}. 
                   Focus on maintaining continuity and context while identifying:
                   1. Key discussion points and themes
                   2. Important decisions or conclusions
                   3. Action items or next steps
                   4. Relationships between speakers and their perspectives`
        },
        {
          role: "user",
          content: chunk
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error in summarizeChunk:', error);
    throw new Error(`Failed to summarize chunk ${chunkIndex + 1}: ${error.message}`);
  }
};

// Helper function to combine chunk summaries into section summaries
const summarizeSections = async (openai, chunkSummaries) => {
  try {
    const sections = [];
    const sectionSize = 5; // Number of chunk summaries per section
    
    for (let i = 0; i < chunkSummaries.length; i += sectionSize) {
      console.log(`Processing section ${Math.floor(i/sectionSize) + 1}`);
      const section = chunkSummaries.slice(i, i + sectionSize).join('\n\n');
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-16k",
        messages: [{
          role: "system",
          content: `You are an expert at synthesizing conversation summaries. Create a coherent section summary that:
                   1. Maintains chronological flow and context
                   2. Identifies overarching themes and patterns
                   3. Highlights key decisions and action items
                   4. Preserves important speaker dynamics and perspectives`
        }, {
          role: "user",
          content: section
        }],
        temperature: 0.3,
        max_tokens: 2000
      });
      
      sections.push(response.choices[0].message.content);
    }
    
    return sections;
  } catch (error) {
    console.error('Error in summarizeSections:', error);
    throw new Error(`Failed to create section summaries: ${error.message}`);
  }
};

// Helper function to create final document summary
const summarizeDocument = async (openai, sectionSummaries) => {
  try {
    console.log('Creating final document summary');
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-16k",
      messages: [{
        role: "system",
        content: `You are an expert at creating comprehensive conversation summaries. Create a final summary that:
                 1. Synthesizes the main themes and insights
                 2. Highlights key decisions and action items
                 3. Identifies important patterns and relationships
                 4. Maintains a clear narrative structure`
      }, {
        role: "user",
        content: sectionSummaries.join('\n\n')
      }],
      temperature: 0.3,
      max_tokens: 2000
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error in summarizeDocument:', error);
    throw new Error(`Failed to create final summary: ${error.message}`);
  }
};

// Main processing function
export const processWithLongContextChunking = async (transcript, progressCallback, apiKey) => {
  if (!transcript) {
    throw new Error('No transcript provided');
  }

  // Ensure transcript is a string before attempting to split it
  if (typeof transcript !== 'string') {
    console.error('Invalid transcript type:', typeof transcript);
    throw new Error('Transcript must be a string. Received: ' + typeof transcript);
  }

  if (!apiKey) {
    throw new Error('OpenAI API key is required');
  }

  const openai = new OpenAI({ 
    apiKey,
    dangerouslyAllowBrowser: true
  });

  try {
    // Step 1: Split into conversation-aware chunks with overlap
    console.log('Starting conversation chunking...');
    const chunks = splitIntoConversationChunks(transcript);
    await updateProgress(10, progressCallback);

    // Step 2: First pass - summarize individual chunks
    console.log('Processing individual chunks...');
    const chunkSummaries = [];
    for (let i = 0; i < chunks.length; i++) {
      const summary = await summarizeChunk(openai, chunks[i], i, chunks.length);
      chunkSummaries.push(summary);
      await updateProgress(10 + (i / chunks.length) * 40, progressCallback);
    }

    // Step 3: Second pass - combine chunk summaries into sections
    console.log('Creating section summaries...');
    const sectionSummaries = await summarizeSections(openai, chunkSummaries);
    await updateProgress(80, progressCallback);

    // Step 4: Final pass - create overall document summary
    console.log('Creating final summary...');
    const finalSummary = await summarizeDocument(openai, sectionSummaries);
    await updateProgress(100, progressCallback);

    return {
      chunks,
      chunkSummaries,
      sectionSummaries,
      finalSummary,
      metadata: {
        totalChunks: chunks.length,
        processedAt: new Date().toISOString(),
        modelUsed: "gpt-3.5-turbo-16k"
      }
    };
  } catch (error) {
    console.error('Error in processWithLongContextChunking:', error);
    throw new Error(`Long Context Chunking failed: ${error.message}`);
  }
};