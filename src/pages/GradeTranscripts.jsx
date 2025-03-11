import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import FileUpload from '../components/FileUpload';
import { toast } from "sonner";
import { AGENT_SEQUENCE, MAX_RETRIES, ANALYSIS_DELAY } from '../utils/analysisTypes';
import { analyzeJTBD, analyzeCURSE, analyzeProblemFit, analyzePriming, generateRecommendations } from '../utils/analysisModules';
import AnalysisProgress from '../components/AnalysisProgress';
import ErrorBoundary from '../components/ErrorBoundary';

const GradeTranscripts = () => {
  // Define initial agent states
  const initialAgentStates = {
    jtbd: { isAnalyzing: false, progress: 0, results: null, showResults: false, retryCount: 0 },
    curse: { isAnalyzing: false, progress: 0, results: null, showResults: false, retryCount: 0 },
    problemFit: { isAnalyzing: false, progress: 0, results: null, showResults: false, retryCount: 0 },
    priming: { isAnalyzing: false, progress: 0, results: null, showResults: false, retryCount: 0 },
    recommendations: { isAnalyzing: false, progress: 0, results: null, showResults: false, retryCount: 0 }
  };

  // Initialize all state
  const [transcript, setTranscript] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [currentAnalysisIndex, setCurrentAnalysisIndex] = useState(0);
  const [isSequenceRunning, setIsSequenceRunning] = useState(false);
  const [agentStates, setAgentStates] = useState(initialAgentStates);

  // Create refs with proper initial values
  const stateRef = React.useRef({
    transcript: '',
    agentStates: initialAgentStates,
    isSequenceRunning: false,
    currentAnalysisIndex: 0
  });
  
  // Store function references in refs to break circular dependencies
  const runAnalysisRef = React.useRef(null);

  // Keep stateRef updated with latest state values
  useEffect(() => {
    stateRef.current = {
      ...stateRef.current,
      transcript,
      agentStates,
      isSequenceRunning,
      currentAnalysisIndex
    };
  }, [transcript, agentStates, isSequenceRunning, currentAnalysisIndex]);

  // Automatic progression effect
  useEffect(() => {
    if (!isSequenceRunning) return;

    const currentAgent = AGENT_SEQUENCE[currentAnalysisIndex];
    if (!currentAgent) {
      setIsSequenceRunning(false);
      return;
    }

    const currentState = agentStates[currentAgent];
    const nextIndex = currentAnalysisIndex + 1;
    const nextAgent = AGENT_SEQUENCE[nextIndex];

    if (currentState && currentState.progress === 100 && nextAgent) {
      const timeoutId = setTimeout(() => {
        setCurrentAnalysisIndex(nextIndex);
        // Use runAnalysisRef.current to ensure latest function reference
        if (runAnalysisRef.current) {
          runAnalysisRef.current(nextAgent, stateRef.current.transcript);
        }
      }, ANALYSIS_DELAY);
      return () => clearTimeout(timeoutId);
    }
  }, [isSequenceRunning, currentAnalysisIndex, agentStates, transcript, setIsSequenceRunning]);

  // State declarations moved to top of component


  // Moved resetAnalysisState to useCallback above

  const handleContentChange = (content) => {
    setTranscript(content);
  };

  // Moved checkApiKey to useCallback above

  // Memoize the checkApiKey function with improved validation
  const checkApiKey = useCallback(() => {
    const apiKey = localStorage.getItem('llmApiKey');
    
    // Check if API key exists
    if (!apiKey) {
      toast.error('OpenAI API key not found. Please set your API key in the settings.');
      return false;
    }

    // Basic format validation for OpenAI API key (should start with 'sk-')
    if (!apiKey.startsWith('sk-')) {
      toast.error('Invalid API key format. Please check your settings.');
      return false;
    }

    // Minimum length check (OpenAI keys are typically longer than 40 characters)
    if (apiKey.length < 40) {
      toast.error('Invalid API key length. Please check your settings.');
      return false;
    }

    return true;
  }, []);

  // Memoize the resetAnalysisState function
  const resetAnalysisState = useCallback(() => {
    console.log('Resetting analysis state');
    setAgentStates(initialAgentStates);
    setCurrentAnalysisIndex(0);
    setIsSequenceRunning(false);
    setIsAnalyzing(false);
    setShowResult(false);
    setAnalysisResult(null);
  }, [setAgentStates, setCurrentAnalysisIndex, setIsSequenceRunning, setIsAnalyzing, setShowResult, setAnalysisResult]);

  // Debug logging for state updates
  useEffect(() => {
    console.log('State updated:', {
      transcript,
      agentStates,
      isSequenceRunning,
      currentAnalysisIndex
    });
  }, [transcript, agentStates, isSequenceRunning, currentAnalysisIndex]);

  // Using useEffect to update runAnalysisRef whenever dependencies change
  useEffect(() => {
    console.log('Updating runAnalysisRef');
    runAnalysisRef.current = async (agentId, content) => {
      console.log(`Starting analysis for agent: ${agentId}`);
      
      // Validate API key before each analysis step
      if (!checkApiKey()) {
        console.error('API key validation failed');
        resetAnalysisState();
        return;
      }
      if (!checkApiKey()) {
        resetAnalysisState();
        return;
      }
      
      if (stateRef.current.agentStates[agentId]?.retryCount >= MAX_RETRIES) {
        setIsSequenceRunning(false);
        sessionStorage.setItem('isSequenceRunning', 'false');
        toast.error(`Failed to complete ${agentId} analysis after ${MAX_RETRIES} attempts`);
        return;
      }

      setAgentStates(prev => ({
        ...prev,
        [agentId]: {
          ...prev[agentId],
          isAnalyzing: true,
          progress: 0,
          retryCount: prev[agentId].retryCount + 1
        }
      }));

      try {
        let results;
        switch (agentId) {
          case 'jtbd':
            results = await analyzeJTBD(content);
            break;
          case 'curse':
            results = await analyzeCURSE(content);
            break;
          case 'problemFit':
            results = await analyzeProblemFit(
              content,
              stateRef.current.agentStates.jtbd.results,
              stateRef.current.agentStates.curse.results
            );
            break;
          case 'priming':
            results = await analyzePriming(content);
            break;
          case 'recommendations':
            results = await generateRecommendations(content, {
              jtbd: stateRef.current.agentStates.jtbd.results,
              curse: stateRef.current.agentStates.curse.results,
              problemFit: stateRef.current.agentStates.problemFit.results,
              priming: stateRef.current.agentStates.priming.results
            });
            break;
        }

        sessionStorage.setItem(`${agentId}Results`, JSON.stringify(results));
        
        setAgentStates(prev => ({
          ...prev,
          [agentId]: {
            ...prev[agentId],
            results,
            progress: 100,
            isAnalyzing: false
          }
        }));

        // If this is the last agent, compile final results
        if (agentId === AGENT_SEQUENCE[AGENT_SEQUENCE.length - 1]) {
          const finalResults = {
            jtbdAnalysis: stateRef.current.agentStates.jtbd.results,
            curseAnalysis: stateRef.current.agentStates.curse.results,
            problemFitMatrixAnalysis: stateRef.current.agentStates.problemFit.results,
            primingAnalysis: stateRef.current.agentStates.priming.results,
            actionableRecommendations: results
          };
          setAnalysisResult(finalResults);
          setShowResult(true);
          setIsSequenceRunning(false);
          setIsAnalyzing(false);
        }
      } catch (error) {
        console.error(`Error in ${agentId} analysis:`, error);
        
        // Handle specific API key error
        if (error.message && error.message.includes('API key')) {
          toast.error(error.message);
          resetAnalysisState();
          return;
        }
        
        if (stateRef.current.agentStates[agentId]?.retryCount < MAX_RETRIES) {
          setTimeout(() => runAnalysisRef.current(agentId, content), ANALYSIS_DELAY);
        } else {
          toast.error(`Failed to complete ${agentId} analysis. Please try again.`);
          setIsSequenceRunning(false);
          setIsAnalyzing(false);
        }
      }
    };
  }, [checkApiKey, resetAnalysisState, analyzeJTBD, analyzeCURSE, analyzeProblemFit, analyzePriming, generateRecommendations]);
  
  const runAnalysis = async (agentId, content) => {
    if (runAnalysisRef.current) {
      return runAnalysisRef.current(agentId, content);
    }
    
    if (!checkApiKey()) {
      resetAnalysisState();
      return;
    }

    // This is now a passthrough to the ref-based implementation
    // The implementation has been moved to useEffect above to avoid stale closures
  };

  const handleAnalyze = async () => {
    console.log('Starting analysis with:', {
      transcript,
      apiKey: !!localStorage.getItem('llmApiKey')
    });
    if (!transcript) {
      toast.error("Please provide a transcript to analyze.");
      return;
    }

    // Check for API key before starting
    if (!checkApiKey()) {
      return;
    }

    // Reset all states before starting
    resetAnalysisState();
    
    // Start analysis sequence
    setIsAnalyzing(true);
    setIsSequenceRunning(true);
    
    // Start with the first agent - using the ref or direct function
    if (runAnalysisRef.current) {
      runAnalysisRef.current(AGENT_SEQUENCE[0], transcript);
    } else {
      runAnalysis(AGENT_SEQUENCE[0], transcript);
    }
  };

  const handleStopAnalysis = () => {
    console.log('Stopping analysis');
    resetAnalysisState();
    toast.info("Analysis has been stopped.");
  };

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="w-full bg-[#FAFAFA] p-4 border-b">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold">Grade Transcripts</h1>
            <Button 
                onClick={resetAnalysisState} 
                variant="outline" 
                className="bg-white text-red-600 hover:bg-red-50 border-red-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Reset Transcript
              </Button>
          </div>
        </div>
        
        <div className="container mx-auto p-4 max-w-3xl flex-grow">
      <Card className="mb-6">
        <CardContent className="pt-6 space-y-6">
          <FileUpload
            onContentChange={handleContentChange}
            defaultValue={transcript}
            isLoading={isAnalyzing}
          />
          {isSequenceRunning && (
            <div className="space-y-4 mb-4">
              {AGENT_SEQUENCE.map((agentId) => (
                <AnalysisProgress
                  key={agentId}
                  agentId={agentId}
                  agentStates={agentStates}
                />
              ))}
            </div>
          )}
          <div className="flex justify-end space-x-4">
            {isAnalyzing && (
              <Button variant="outline" onClick={handleStopAnalysis}>
                Stop Analysis
              </Button>
            )}
            <Button
              onClick={handleAnalyze}
              disabled={!transcript || isAnalyzing}
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze'}
            </Button>
          </div>
        </CardContent>
      </Card>
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Interview Analysis Results</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            {analysisResult && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Overall Score: {analysisResult.overallScore}/10</h3>
                  <p>{analysisResult.overallFeedback}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">JTBD Analysis</h3>
                  <p>Score: {analysisResult.jtbdAnalysis.score}/10</p>
                  <h4 className="font-semibold">Strengths:</h4>
                  <ul className="list-disc pl-5">
                    {analysisResult.jtbdAnalysis.strengths && Array.isArray(analysisResult.jtbdAnalysis.strengths) ? (
                      analysisResult.jtbdAnalysis.strengths.map((strength, index) => (
                        <li key={index}>{strength}</li>
                      ))
                    ) : (
                      <li>No strengths data available</li>
                    )}
                  </ul>
                  <h4 className="font-semibold">Weaknesses:</h4>
                  <ul className="list-disc pl-5">
                    {analysisResult.jtbdAnalysis.weaknesses && Array.isArray(analysisResult.jtbdAnalysis.weaknesses) ? (
                      analysisResult.jtbdAnalysis.weaknesses.map((weakness, index) => (
                        <li key={index}>{weakness}</li>
                      ))
                    ) : (
                      <li>No weaknesses data available</li>
                    )}
                  </ul>
                  <h4 className="font-semibold">Missed Opportunities:</h4>
                  <ul className="list-disc pl-5">
                    {analysisResult.jtbdAnalysis.missedOpportunities && Array.isArray(analysisResult.jtbdAnalysis.missedOpportunities) ? (
                      analysisResult.jtbdAnalysis.missedOpportunities.map((opportunity, index) => (
                        <li key={index}>{opportunity}</li>
                      ))
                    ) : (
                      <li>No missed opportunities data available</li>
                    )}
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">CURSE Analysis</h3>
                  <p>Score: {analysisResult.curseAnalysis.score}/10</p>
                  <h4 className="font-semibold">Strengths:</h4>
                  <ul className="list-disc pl-5">
                    {analysisResult.curseAnalysis.strengths && Array.isArray(analysisResult.curseAnalysis.strengths) ? (
                      analysisResult.curseAnalysis.strengths.map((strength, index) => (
                        <li key={index}>{strength}</li>
                      ))
                    ) : (
                      <li>No strengths data available</li>
                    )}
                  </ul>
                  <h4 className="font-semibold">Weaknesses:</h4>
                  <ul className="list-disc pl-5">
                    {analysisResult.curseAnalysis.weaknesses && Array.isArray(analysisResult.curseAnalysis.weaknesses) ? (
                      analysisResult.curseAnalysis.weaknesses.map((weakness, index) => (
                        <li key={index}>{weakness}</li>
                      ))
                    ) : (
                      <li>No weaknesses data available</li>
                    )}
                  </ul>
                  <h4 className="font-semibold">Missed Opportunities:</h4>
                  <ul className="list-disc pl-5">
                    {analysisResult.curseAnalysis.missedOpportunities && Array.isArray(analysisResult.curseAnalysis.missedOpportunities) ? (
                      analysisResult.curseAnalysis.missedOpportunities.map((opportunity, index) => (
                        <li key={index}>{opportunity}</li>
                      ))
                    ) : (
                      <li>No missed opportunities data available</li>
                    )}
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Problem Fit Matrix Analysis</h3>
                  <p>Score: {analysisResult.problemFitMatrixAnalysis.score}/10</p>
                  <h4 className="font-semibold">Strengths:</h4>
                  <ul className="list-disc pl-5">
                    {analysisResult.problemFitMatrixAnalysis.strengths && Array.isArray(analysisResult.problemFitMatrixAnalysis.strengths) ? (
                      analysisResult.problemFitMatrixAnalysis.strengths.map((strength, index) => (
                        <li key={index}>{strength}</li>
                      ))
                    ) : (
                      <li>No strengths data available</li>
                    )}
                  </ul>
                  <h4 className="font-semibold">Weaknesses:</h4>
                  <ul className="list-disc pl-5">
                    {analysisResult.problemFitMatrixAnalysis.weaknesses && Array.isArray(analysisResult.problemFitMatrixAnalysis.weaknesses) ? (
                      analysisResult.problemFitMatrixAnalysis.weaknesses.map((weakness, index) => (
                        <li key={index}>{weakness}</li>
                      ))
                    ) : (
                      <li>No weaknesses data available</li>
                    )}
                  </ul>
                  <h4 className="font-semibold">Missed Opportunities:</h4>
                  <ul className="list-disc pl-5">
                    {analysisResult.problemFitMatrixAnalysis.missedOpportunities && Array.isArray(analysisResult.problemFitMatrixAnalysis.missedOpportunities) ? (
                      analysisResult.problemFitMatrixAnalysis.missedOpportunities.map((opportunity, index) => (
                        <li key={index}>{opportunity}</li>
                      ))
                    ) : (
                      <li>No missed opportunities data available</li>
                    )}
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Priming Analysis</h3>
                  <p>Score: {analysisResult.primingAnalysis.score}/10</p>
                  <h4 className="font-semibold">Instances of Priming:</h4>
                  <ul className="list-disc pl-5">
                    {analysisResult.primingAnalysis.instances && Array.isArray(analysisResult.primingAnalysis.instances) ? (
                      analysisResult.primingAnalysis.instances.map((instance, index) => (
                        <li key={index}>{instance}</li>
                      ))
                    ) : (
                      <li>No priming instances detected</li>
                    )}
                  </ul>
                  <h4 className="font-semibold">Impact:</h4>
                  <p>{analysisResult.primingAnalysis.impact || 'No impact data available'}</p>
                  <h4 className="font-semibold">Recommendations:</h4>
                  <ul className="list-disc pl-5">
                    {analysisResult.primingAnalysis.recommendations && Array.isArray(analysisResult.primingAnalysis.recommendations) ? (
                      analysisResult.primingAnalysis.recommendations.map((recommendation, index) => (
                        <li key={index}>{recommendation}</li>
                      ))
                    ) : (
                      <li>No recommendations available</li>
                    )}
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Actionable Recommendations</h3>
                  <ul className="list-disc pl-5">
                    {analysisResult.actionableRecommendations && Array.isArray(analysisResult.actionableRecommendations) ? (
                      analysisResult.actionableRecommendations.map((recommendation, index) => (
                        <li key={index}>{recommendation}</li>
                      ))
                    ) : (
                      <li>No actionable recommendations available</li>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </DialogDescription>
        </DialogContent>
      </Dialog>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default GradeTranscripts;