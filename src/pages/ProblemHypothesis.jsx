import React, { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import OpenAI from 'openai';

const ProblemHypothesis = () => {
  const [assumptions, setAssumptions] = useState({
    targetCustomers: '',
    problem: '',
    goal: '',
    rootCause: '',
    potentialImpact: '',
  });
  const [generatedHypothesis, setGeneratedHypothesis] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAssumptions(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const generateAIHypothesis = async () => {
    setIsLoading(true);
    setProgress(0);
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 500);

    const openai = new OpenAI({
      apiKey: localStorage.getItem('llmApiKey'),
      dangerouslyAllowBrowser: true
    });

    const prompt = `
As an expert Hypothesis Statement Generator, your task is to transform the following set of structured assumptions into a coherent and professional hypothesis statement. This statement will serve as the foundation for a series of discovery interviews in a research project involving five participants. The goal is to maintain consistency across all interviews by focusing on this specific hypothesis.

Instructions:
- Craft a clear and concise hypothesis statement.
- Ensure the statement is directly derived from the provided assumptions.
- Use professional and formal language suitable for a research setting.

Structured Assumptions:
- Target customers: ${assumptions.targetCustomers}
- Problem: ${assumptions.problem}
- Goal: ${assumptions.goal}
- Root cause: ${assumptions.rootCause}
- Potential impact: ${assumptions.potentialImpact}

Please generate a hypothesis statement based on these assumptions.
    `;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert Hypothesis Statement Generator for research projects."
          },
          {
            role: "user",
            content: prompt
          }
        ],
      });

      setGeneratedHypothesis(response.choices[0].message.content.trim());
    } catch (error) {
      console.error('Error generating AI hypothesis:', error);
      setError('Failed to generate AI hypothesis. Please check your API key and try again.');
    } finally {
      clearInterval(progressInterval);
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 500);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (Object.values(assumptions).some(value => value.trim() === '')) {
      setError('Please fill out all fields before generating a hypothesis.');
      return;
    }
    generateAIHypothesis();
  };

  const RequiredLabel = ({ htmlFor, children }) => (
    <Label htmlFor={htmlFor} className="flex items-center mb-2">
      {children}
      <span className="text-red-500 ml-1">*</span>
    </Label>
  );

  // Clear state function for reset button
  const clearAllState = useCallback(() => {
    setAssumptions({
      targetCustomers: '',
      problem: '',
      goal: '',
      rootCause: '',
      potentialImpact: '',
    });
    setGeneratedHypothesis('');
    setError('');
  }, []);

  // Handle clearing data with toast notification
  const handleClearData = useCallback(() => {
    clearAllState();
    toast.success("Hypothesis data has been reset.");
  }, [clearAllState]);

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="w-full bg-[#FAFAFA] p-4 border-b">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Problem Hypothesis Statement</h1>
          <Button 
              onClick={handleClearData} 
              variant="outline" 
              className="bg-white text-red-600 hover:bg-red-50 border-red-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Reset Hypothesis
            </Button>
        </div>
      </div>
      
      <div className="container mx-auto p-4 max-w-4xl flex-grow">

      <Card>
        <CardHeader>
          <CardTitle>Explicitly State Your Assumptions</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <RequiredLabel htmlFor="targetCustomers">Who is the target role for our discovery research?</RequiredLabel>
              <Input
                id="targetCustomers"
                name="targetCustomers"
                value={assumptions.targetCustomers}
                onChange={handleInputChange}
                placeholder="e.g., Product Managers"
                required
              />
            </div>
            <div>
              <RequiredLabel htmlFor="problem">What problem do we assume they are experiencing?</RequiredLabel>
              <Input
                id="problem"
                name="problem"
                value={assumptions.problem}
                onChange={handleInputChange}
                placeholder="e.g., difficulty finding real time market intelligence"
                required
              />
            </div>
            <div>
              <RequiredLabel htmlFor="goal">What do we assume they are trying to achieve?</RequiredLabel>
              <Input
                id="goal"
                name="goal"
                value={assumptions.goal}
                onChange={handleInputChange}
                placeholder="e.g., grow their business"
                required
              />
            </div>
            <div>
              <RequiredLabel htmlFor="rootCause">What do we assume is the root cause of their problem?</RequiredLabel>
              <Input
                id="rootCause"
                name="rootCause"
                value={assumptions.rootCause}
                onChange={handleInputChange}
                placeholder="e.g., lack of real time market data for emerging markets"
                required
              />
            </div>
            <div>
              <RequiredLabel htmlFor="potentialImpact">What do we assume would be the potential impact of solving their problem?</RequiredLabel>
              <Input
                id="potentialImpact"
                name="potentialImpact"
                value={assumptions.potentialImpact}
                onChange={handleInputChange}
                placeholder="e.g., increase their business units' profitability"
                required
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Generating...' : 'Generate Hypothesis'}
            </Button>
            {isLoading && (
              <Progress value={progress} className="w-full mt-4" />
            )}
          </form>
          {generatedHypothesis && (
            <div className="mt-6">
              <Label htmlFor="generatedHypothesis" className="mb-2 block">Generated Problem Hypothesis Statement:</Label>
              <Textarea
                id="generatedHypothesis"
                value={generatedHypothesis}
                readOnly
                className="mt-2"
                rows={6}
              />
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default ProblemHypothesis;