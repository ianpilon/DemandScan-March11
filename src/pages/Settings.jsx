import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import ApiKeyInput from '@/components/ApiKeyInput';

const Settings = () => {
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    const storedApiKey = localStorage.getItem('llmApiKey');
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
  }, []);

  const handleApiKeySubmit = (newApiKey) => {
    if (newApiKey) {
      localStorage.setItem('llmApiKey', newApiKey);
    } else {
      localStorage.removeItem('llmApiKey');
    }
    setApiKey(newApiKey);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="w-full bg-[#FAFAFA] p-4 border-b">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
      </div>
      
      <div className="container mx-auto p-4 max-w-4xl flex-grow">
      
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Large Language Model API Key</h2>
        <p className="text-gray-600 mb-4">
          Enter your OpenAI API key here. This key will be used for all AI-powered features across the application.
        </p>
        <ApiKeyInput onApiKeySubmit={handleApiKeySubmit} initialValue={apiKey} />
      </Card>
      </div>
    </div>
  );
};

export default Settings;
