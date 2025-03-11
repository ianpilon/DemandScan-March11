import OpenAI from 'openai';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB in bytes

let ffmpegInstance = null;

const loadFFmpeg = async () => {
  if (ffmpegInstance) return ffmpegInstance;

  const ffmpeg = new FFmpeg();
  const baseURL = '/ffmpeg/';
  
  try {
    await ffmpeg.load({
      coreURL: baseURL + 'ffmpeg-core.js',
      wasmURL: baseURL + 'ffmpeg-core.wasm'
    });
    ffmpegInstance = ffmpeg;
    return ffmpeg;
  } catch (error) {
    console.error('Error loading FFmpeg:', error);
    throw new Error('Failed to load audio processing library. Please try again.');
  }
};

export const processSpeakerDiarization = async (audioFile, progressCallback) => {
  const openai = new OpenAI({
    apiKey: localStorage.getItem('llmApiKey'),
    dangerouslyAllowBrowser: true
  });

  try {
    progressCallback(10);

    // Check if file needs compression
    if (audioFile.size > MAX_FILE_SIZE) {
      progressCallback(15);
      
      const ffmpeg = await loadFFmpeg();
      progressCallback(25);
      console.log('FFmpeg loaded');

      // Write original file to memory
      const uint8Array = new Uint8Array(await audioFile.arrayBuffer());
      await ffmpeg.writeFile('input.mp3', uint8Array);
      progressCallback(35);
      console.log('File written to memory');

      // Compress audio
      await ffmpeg.exec([
        '-i', 'input.mp3',
        '-c:a', 'libmp3lame',
        '-b:a', '64k',
        'output.mp3'
      ]);
      progressCallback(50);
      console.log('Audio compressed');

      // Read the compressed file
      const data = await ffmpeg.readFile('output.mp3');
      const compressedBlob = new Blob([data], { type: 'audio/mpeg' });
      audioFile = new File([compressedBlob], 'compressed.mp3', { type: 'audio/mpeg' });
      console.log('Compressed file created:', audioFile.size);
    }

    progressCallback(60);
    console.log('Sending to OpenAI Whisper API');

    // Create a FormData object for the file
    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('model', 'whisper-1');

    // Send to OpenAI Whisper API
    const response = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      response_format: "verbose_json",
    });

    progressCallback(80);
    console.log('Received response from OpenAI');

    // Process the response into our expected format
    const processedTranscript = [];
    
    // Split text into sentences and alternate speakers
    const sentences = response.text.match(/[^.!?]+[.!?]+/g) || [response.text];
    sentences.forEach((sentence, index) => {
      processedTranscript.push({
        speaker: `Speaker ${(index % 2) + 1}`,
        text: sentence.trim()
      });
    });

    progressCallback(100);
    console.log('Processing complete');

    // Format transcript for display
    return processedTranscript.map(item => `${item.speaker}: ${item.text}`).join('\n\n');
  } catch (error) {
    console.error('Error in speaker diarization:', error);
    throw error;
  }
};