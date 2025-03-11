import OpenAI from 'openai';

const preprocessTranscript = (transcript) => {
  // Split transcript into lines and identify speakers
  const lines = transcript.split('\n');
  const processedLines = lines.map(line => {
    const speakerMatch = line.match(/^(Interviewer|Interviewee):\s*(.*)/i);
    if (speakerMatch) {
      return {
        speaker: speakerMatch[1].toLowerCase(),
        text: speakerMatch[2].trim()
      };
    }
    return {
      speaker: 'unknown',
      text: line.trim()
    };
  }).filter(line => line.text); // Remove empty lines

  return processedLines;
};

const analyzeInterview = async (transcript) => {
  const apiKey = localStorage.getItem('llmApiKey');
  
  // Check if API key exists
  if (!apiKey) {
    throw new Error('OpenAI API key not found. Please set your API key in the settings.');
  }
  
  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true
  });

  const processedTranscript = preprocessTranscript(transcript);
  
  const prompt = `
You are an expert transcript analyst, Interview Grading Agent, and Priming Analyst. Analyze this interview transcript where speakers are clearly marked. Pay special attention to who is speaking when evaluating priming effects and interview techniques.

Transcript with identified speakers:
${processedTranscript.map(line => `${line.speaker}: ${line.text}`).join('\n')}

When analyzing:
1. Only attribute priming effects to the interviewer, not the interviewee's statements
2. Evaluate interview techniques based solely on the interviewer's questions and responses
3. Analyze interviewee responses separately for insights and patterns
4. Consider the conversation flow and turn-taking between speakers

Please provide your analysis in the following JSON format:
{
  "overallScore": 0,
  "jtbdAnalysis": {
    "score": 0,
    "strengths": [],
    "weaknesses": [],
    "missedOpportunities": []
  },
  "curseAnalysis": {
    "score": 0,
    "strengths": [],
    "weaknesses": [],
    "missedOpportunities": []
  },
  "problemFitMatrixAnalysis": {
    "score": 0,
    "strengths": [],
    "weaknesses": [],
    "missedOpportunities": []
  },
  "primingAnalysis": {
    "score": 0,
    "instances": [],
    "impact": "",
    "recommendations": []
  },
  "speakerAnalysis": {
    "interviewer": {
      "questionQuality": 0,
      "techniqueFeedback": [],
      "improvements": []
    },
    "interviewee": {
      "responseQuality": 0,
      "keyInsights": [],
      "patterns": []
    }
  },
  "overallFeedback": "",
  "actionableRecommendations": []
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-16k",
      messages: [
        {
          role: "system",
          content: "You are an expert Interview Grading Agent. Analyze the given transcript and provide a detailed assessment."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('Error analyzing interview:', error);
    throw error;
  }
};

export default analyzeInterview;