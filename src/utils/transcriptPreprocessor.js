/**
 * Utility functions for preprocessing interview transcripts
 */

/**
 * Extracts only the interviewee's responses from a transcript
 * @param {string} transcript - The full interview transcript
 * @returns {Object} - Object containing processed transcript and metadata
 */
export const extractIntervieweeResponses = (transcript) => {
  if (!transcript) {
    throw new Error('No transcript provided for preprocessing');
  }

  // Split transcript into lines
  const lines = transcript.split('\n');
  
  let intervieweeResponses = [];
  let currentSpeaker = null;
  let currentResponse = [];
  let metadata = {
    interviewerPattern: null,
    intervieweePattern: null,
    totalLines: lines.length,
    processedLines: 0
  };

  // First pass: identify speaker patterns
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Look for common interview patterns like "Interviewer:", "I:", "Me:", etc.
    const speakerMatch = trimmedLine.match(/^([^:]+):/);
    if (speakerMatch) {
      const speaker = speakerMatch[1].toLowerCase();
      if (
        speaker.includes('interviewer') ||
        speaker === 'i' ||
        speaker === 'me' ||
        speaker.includes('question')
      ) {
        metadata.interviewerPattern = speakerMatch[1];
      } else if (
        speaker.includes('interviewee') ||
        speaker.includes('participant') ||
        speaker.includes('respondent') ||
        speaker === 'r' ||
        speaker === 'p'
      ) {
        metadata.intervieweePattern = speakerMatch[1];
      }
    }
  }

  // If no patterns found, treat each chunk as an interviewee response
  if (!metadata.interviewerPattern && !metadata.intervieweePattern) {
    console.log('No speaker patterns found, treating chunks as responses');
    return {
      processedTranscript: transcript,
      metadata: {
        ...metadata,
        responsesExtracted: lines.length,
        originalLength: transcript.length,
        processedLength: transcript.length,
        processedLines: lines.length,
        chunkedFormat: true
      }
    };
  }

  // Second pass: extract responses
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      // Empty line could indicate speaker change
      if (currentResponse.length > 0 && currentSpeaker === 'interviewee') {
        intervieweeResponses.push(currentResponse.join(' '));
        currentResponse = [];
      }
      continue;
    }

    const speakerMatch = trimmedLine.match(/^([^:]+):/);
    if (speakerMatch) {
      // New speaker detected
      if (currentResponse.length > 0 && currentSpeaker === 'interviewee') {
        intervieweeResponses.push(currentResponse.join(' '));
        currentResponse = [];
      }

      const speaker = speakerMatch[1];
      if (speaker === metadata.interviewerPattern) {
        currentSpeaker = 'interviewer';
      } else if (speaker === metadata.intervieweePattern) {
        currentSpeaker = 'interviewee';
      } else if (!metadata.intervieweePattern && currentSpeaker !== 'interviewer') {
        // If we haven't identified the interviewee pattern, assume non-interviewer is interviewee
        currentSpeaker = 'interviewee';
        metadata.intervieweePattern = speaker;
      }
      
      // Remove speaker prefix from the line
      const content = trimmedLine.substring(speakerMatch[0].length).trim();
      if (content && currentSpeaker === 'interviewee') {
        currentResponse.push(content);
      }
    } else if (currentSpeaker === 'interviewee') {
      // Continuation of previous speaker
      currentResponse.push(trimmedLine);
    }

    metadata.processedLines++;
  }

  // Add final response if exists
  if (currentResponse.length > 0 && currentSpeaker === 'interviewee') {
    intervieweeResponses.push(currentResponse.join(' '));
  }

  // Create processed transcript
  const processedTranscript = intervieweeResponses.join('\n\n');

  return {
    processedTranscript,
    metadata: {
      ...metadata,
      responsesExtracted: intervieweeResponses.length,
      originalLength: transcript.length,
      processedLength: processedTranscript.length
    }
  };
};

/**
 * Validates if a transcript has been properly preprocessed
 * @param {Object} preprocessedData - The result from extractIntervieweeResponses
 * @returns {boolean} - True if the preprocessing appears valid
 */
export const validatePreprocessing = (preprocessedData) => {
  if (!preprocessedData || typeof preprocessedData !== 'object') {
    return false;
  }

  const { processedTranscript, metadata } = preprocessedData;

  // Special case for chunked format
  if (metadata?.chunkedFormat) {
    return !!(
      processedTranscript &&
      metadata &&
      metadata.processedLines > 0 &&
      metadata.processedLength > 0
    );
  }

  // Regular case for speaker-based format
  return !!(
    processedTranscript &&
    metadata &&
    metadata.processedLines > 0 &&
    metadata.responsesExtracted > 0 &&
    metadata.processedLength > 0
  );
};
