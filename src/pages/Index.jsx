import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Link } from 'react-router-dom';

const Index = () => {
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    const storedApiKey = localStorage.getItem('llmApiKey');
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
  }, []);

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Welcome</h1>
      
      {!apiKey && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Set Up Your API Key</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              To get started with the application, you'll need to set up your OpenAI API key. 
              Please visit the <Link to="/settings" className="text-blue-600 hover:underline">Settings page</Link> to configure your API key.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Index;