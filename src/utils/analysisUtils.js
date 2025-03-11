import OpenAI from 'openai';

export const runAnalysis = async (agentId, transcript) => {
  const apiKey = localStorage.getItem('llmApiKey');
  if (!apiKey) {
    throw new Error('API key is missing. Please set your OpenAI API key in the settings.');
  }

  console.log('API Key retrieved:', apiKey.substring(0, 5) + '...');  // Log first 5 characters of API key

  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true
  });

  const prompt = `Analyze the following transcript for ${agentId}:\n\n${transcript}`;

  try {
    console.log('Sending request to OpenAI API...');
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are an expert transcript analyst." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    console.log('Received response from OpenAI API');
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error analyzing transcript:', error);
    if (error.response) {
      console.error('OpenAI API responded with:', error.response.status, error.response.data);
    } else {
      console.error('Error details:', error.message);
    }
    throw error;
  }
};