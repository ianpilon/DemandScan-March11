import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import useDragToScroll from '../hooks/useDragToScroll';
import { toast } from "sonner";
import { agents } from '../data/agents';
import FileUpload from '../components/FileUpload';
import OpportunityAgentSelection from '../components/OpportunityAgentSelection';
import SimpleAnalysisResults from '../components/SimpleAnalysisResults';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { processWithLongContextChunking } from '../utils/longContextChunkingAgent';
import { analyzeJTBDPrimaryGoal } from '../utils/jtbdPrimaryGoalAgent';
import { analyzeJTBDGains } from '../utils/jtbdGainsAnalysisAgent';
import { analyzePainPoints } from '../utils/jtbdPainExtractorAgent';
import { analyzeProblemAwareness } from '../utils/problemAwarenessMatrixAgent';
import { generateFinalReport } from '../utils/finalReportAgent';

import OpenAI from 'openai';

// Define system prompts directly to avoid import issues
const NEEDS_ANALYSIS_SYSTEM_PROMPT = `You are a customer needs analyst specializing in Jobs-to-be-Done framework. Your task is to analyze interview transcripts and identify both immediate needs (what the customer explicitly states they need) and latent needs (underlying needs they may not have articulated).

Output Format: JSON with the following structure:
{
  "immediateNeeds": [
    {
      "need": "<clear description of the need>",
      "evidence": "<direct quote or specific reference from the transcript>",
      "priority": "<high|medium|low>"
    }
  ],
  "latentNeeds": [
    {
      "need": "<inferred need>",
      "rationale": "<your reasoning for identifying this latent need>",
      "confidence": "<high|medium|low>"
    }
  ],
  "summary": "<brief 2-3 sentence overview of key needs>"
}`;

const DEMAND_ANALYST_SYSTEM_PROMPT = `You are a demand analysis specialist. Your task is to evaluate customer interview transcripts to determine the level of demand for a solution and where the prospect is in their buying cycle.

Output Format: JSON with the following structure:
{
  "demandLevel": "<Level 1-5 with description>",
  "buyingCycle": "<stage in buying process>",
  "confidence": <number between 0-100>,
  "evidence": "<supporting evidence from transcript>"
}`;


// Create local implementations of the agent functions to avoid import issues
// These will use the same core structure and prompts as the original functions
const analyzeNeeds = async (analysisResults, progressCallback, apiKey) => {
  console.log('Called local analyzeNeeds implementation');
  try {
    if (!apiKey) {
      throw new Error('OpenAI API key is required. Please set your API key first.');
    }

    // Validate input structure
    if (!analysisResults?.longContextChunking?.finalSummary) {
      console.error('Invalid analysis results:', analysisResults);
      throw new Error('Invalid analysis results. Expected longContextChunking.finalSummary to be present.');
    }

    const openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true
    });

    // Start with a small amount of progress to show activity
    progressCallback(5);
    const analysisContent = analysisResults.longContextChunking.finalSummary;
    // More gradually increase progress
    progressCallback(10);

    // Prepare messages for GPT-4
    const messages = [
      {
        role: 'system',
        content: NEEDS_ANALYSIS_SYSTEM_PROMPT
      },
      {
        role: 'user',
        content: `Please analyze this interview transcript to identify immediate and latent needs:

${analysisContent}`
      }
    ];

    // Show more gradual progress - just 25% before the main API call
    progressCallback(25);

    // Make API call
    console.log('Sending needs analysis request to OpenAI...');
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      temperature: 0.7,
      max_tokens: 2500
    });

    // Gradual increase after API call
    progressCallback(60);

    if (!response.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from OpenAI');
    }

    // Parse and validate the response
    const needsAnalysis = JSON.parse(response.choices[0].message.content);

    // Validate required fields
    if (!needsAnalysis.immediateNeeds || !needsAnalysis.latentNeeds) {
      console.error('Invalid needs analysis structure:', needsAnalysis);
      throw new Error('Invalid needs analysis structure. Missing required fields.');
    }

    progressCallback(100);
    console.log('Needs Analysis complete:', needsAnalysis);

    // Return clean needs analysis results
    return needsAnalysis;
  } catch (error) {
    console.error('Error in Needs Analysis:', error);
    throw error;
  }
};

// Simplified version of demand analysis - will return mock data for now
const analyzeDemand = async (analysisResults, progressCallback, apiKey) => {
  console.log('Called local analyzeDemand implementation');
  try {
    // Call progress callbacks to simulate analysis - more gradual progress
    progressCallback(5);  // Start with minimal progress
    await new Promise(resolve => setTimeout(resolve, 300));
    progressCallback(15);
    await new Promise(resolve => setTimeout(resolve, 300));
    progressCallback(30);
    await new Promise(resolve => setTimeout(resolve, 300));
    progressCallback(45);
    await new Promise(resolve => setTimeout(resolve, 300));
    progressCallback(60);
    await new Promise(resolve => setTimeout(resolve, 300));
    progressCallback(75);  // Never go to 100% until complete
    await new Promise(resolve => setTimeout(resolve, 300));

    // Return dummy data for now
    return {
      demandLevel: 'Level 2 - Solution Demand',
      buyingCycle: '3-6 months',
      confidence: 80,
      evidence: 'This is placeholder evidence for demand analysis.'
    };
  } catch (error) {
    console.error('Error in Demand Analysis:', error);
    throw error;
  }
};

// Simplified version of opportunity qualification - will return mock data for now
const qualifyOpportunity = async (analysisResults, progressCallback, apiKey) => {
  console.log('Called local qualifyOpportunity implementation');
  try {
    // Call progress callbacks to simulate analysis - more gradual progress
    progressCallback(5);  // Start with minimal progress
    await new Promise(resolve => setTimeout(resolve, 250));
    progressCallback(15);
    await new Promise(resolve => setTimeout(resolve, 250));
    progressCallback(30);
    await new Promise(resolve => setTimeout(resolve, 250));
    progressCallback(45);
    await new Promise(resolve => setTimeout(resolve, 250));
    progressCallback(60);
    await new Promise(resolve => setTimeout(resolve, 250));
    progressCallback(75);
    await new Promise(resolve => setTimeout(resolve, 250));
    progressCallback(90);
    await new Promise(resolve => setTimeout(resolve, 250));
    progressCallback(100);  // Complete the progress

    // Return dummy data for now
    return {
      qualified: true,
      score: 85,
      factors: {
        problemExperience: 'Strong evidence of problem experience',
        activeSearch: 'Currently evaluating solutions',
        problemFit: 'High alignment with our solution capabilities'
      },
      overallAssessment: "Strong Opportunity",
      summary: "This opportunity shows significant potential based on the customer's clear problem experience, active search for solutions, and alignment with our capabilities."
    };
  } catch (error) {
    console.error('Error in Opportunity Qualification:', error);
    throw error;
  }
};

// Define the analysis sequence to match AIAgentAnalysis.jsx
// Define the full sequence for Opportunity Evaluation page
const AGENT_SEQUENCE = [
  'longContextChunking',  // Runs in background with grey progress bar
  'needsAnalysis',       // First visible agent with green progress bar
  'demandAnalyst',       // Second visible agent
  'opportunityQualification', // Third visible agent
  'finalReport'          // Final report
];

// Define agent dependencies
const AGENT_DEPENDENCIES = {
  'needsAnalysis': 'longContextChunking',
  'demandAnalyst': 'needsAnalysis',
  'opportunityQualification': 'demandAnalyst',
  'finalReport': ['needsAnalysis', 'demandAnalyst', 'opportunityQualification']
};

const OpportunityEvaluation = () => {
  const [transcript, setTranscript] = useLocalStorage('opportunityTranscript', '');
  // Convert Set to Array for localStorage and back when using
  const [analyzingAgentsArray, setAnalyzingAgentsArray] = useLocalStorage('opportunityAnalyzingAgents', []);
  const [analyzingAgents, setAnalyzingAgents] = useState(new Set(analyzingAgentsArray));
  const [hasAnalyzed, setHasAnalyzed] = useLocalStorage('opportunityHasAnalyzed', false);
  const [localAnalysisResults, setLocalAnalysisResults] = useLocalStorage('opportunityResults', {});
  const [agentProgress, setAgentProgress] = useLocalStorage('opportunityAgentProgress', {});
  const [showResult, setShowResult] = useLocalStorage('opportunityShowResult', null);
  // Flag to track if the user has actively selected a view
  const [userHasSelectedView, setUserHasSelectedView] = useLocalStorage('opportunityUserSelectedView', false);
  const [apiKey] = useLocalStorage('llmApiKey', '');
  const agentListRef = useRef(null);
  const localResultsRef = useRef(localAnalysisResults);
  const [currentAgent, setCurrentAgent] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastViewedResult, setLastViewedResult] = useLocalStorage('lastViewedOpportunityResult', null);
  // Track the transcript optimization status separately
  const [isOptimizingTranscript, setIsOptimizingTranscript] = useLocalStorage('opportunityIsOptimizing', false);
  const [optimizationProgress, setOptimizationProgress] = useLocalStorage('opportunityOptimizationProgress', 0);
  
  // PERSISTENT state to track which agents have finished - only cleared with 'Reset Evaluation'
  // This ensures 'View Results' buttons stay visible even as sequence progresses
  const [finishedAgentsArray, setFinishedAgentsArray] = useLocalStorage('opportunityFinishedAgents', []);
  const [finishedAgents, setFinishedAgents] = useState(new Set(finishedAgentsArray));

  // Track the current agent in the analysis sequence
  const [currentAnalysisIndex, setCurrentAnalysisIndex] = useState(0);
  const [isSequenceRunning, setIsSequenceRunning] = useLocalStorage('opportunityIsSequenceRunning', false);

  // Use refs to break circular dependencies
  const stateRef = useRef({
    analyzingAgents: new Set(),
    localAnalysisResults: {},
    isSequenceRunning: false,
    currentAnalysisIndex: 0
  });

  // Use the drag to scroll hook
  const { containerRef } = useDragToScroll();

  // Long context chunking results
  const [longContextResults, setLongContextResults] = useLocalStorage('opportunityLongContextResults', {});

  // JTBD analysis results
  const [jtbdAnalysis, setJtbdAnalysis] = useLocalStorage('opportunityJtbdAnalysis', {});

  // JTBD Gain analysis results
  const [gainAnalysis, setGainAnalysis] = useLocalStorage('opportunityGainAnalysis', {});

  // Store previous transcript to avoid re-running analysis
  const previousTranscriptRef = useRef('');

  // Track the currently running agent
  const [currentRunningAgent, setCurrentRunningAgent] = useLocalStorage('opportunityCurrentAgent', null);

  // Sync analyzingAgents Set with localStorage array - with safeguard against infinite updates
  useEffect(() => {
    const currentArray = Array.from(analyzingAgents);
    const storedArray = JSON.parse(localStorage.getItem('opportunityAnalyzingAgents') || '[]');

    // Only update if the arrays are different by comparing their string representations
    if (JSON.stringify(currentArray) !== JSON.stringify(storedArray)) {
      setAnalyzingAgentsArray(currentArray);
    }
  }, [analyzingAgents]);

  // This sequence running flag is already declared above

  // Sync finishedAgents with localStorage
  useEffect(() => {
    const currentArray = Array.from(finishedAgents);
    const storedArray = JSON.parse(localStorage.getItem('opportunityFinishedAgents') || '[]');

    // Only update if the arrays are different by comparing their string representations
    if (JSON.stringify(currentArray) !== JSON.stringify(storedArray)) {
      setFinishedAgentsArray(currentArray);
    }
  }, [finishedAgents]);

  // Check if there's active analysis going on
  const isAnalyzing = analyzingAgents.size > 0;

  // Function to check if an agent has completed its analysis
  const isDone = useCallback((agentId) => {
    // First check immediate state
    const hasResults = !!localAnalysisResults[agentId];
    
    // Check if the agent is in the finishedAgents set (persistent through sequence)
    const isFinished = finishedAgents.has(agentId);
    
    // Special case for needsAnalysis and demandAnalyst - ensure they're marked as done even if the results structure is empty
    if ((agentId === 'needsAnalysis' || agentId === 'demandAnalyst') && agentId in localAnalysisResults) {
      return true;
    }

    // Debug state for logging
    const debugState = {
      hasResults,
      inComponentState: !!localAnalysisResults[agentId],
      explicitKeyCheck: agentId in localAnalysisResults
    };

    console.log(`🔍 isDone Check for ${agentId}:`, debugState, { isFinished });
    // Return true if either we have results OR the agent is in the finishedAgents Set
    return hasResults || isFinished;
  }, [localAnalysisResults, finishedAgents]);

  const reportUrl = useMemo(() => {
    if (localAnalysisResults.finalReport?.reportUrl) {
      return localAnalysisResults.finalReport.reportUrl;
    }
    return null;
  }, [localAnalysisResults]);

  // Effect to set the first completed agent result as the view if the user hasn't selected one
  useEffect(() => {
    if (!userHasSelectedView && hasAnalyzed) {
      // Find the first completed agent
      for (const agentId of AGENT_SEQUENCE) {
        if (localAnalysisResults[agentId]) {
          setShowResult(agentId);
          break;
        }
      }
    }
  }, [hasAnalyzed, localAnalysisResults, showResult, userHasSelectedView]);

  // Effect to scroll to the agent that is currently running
  useEffect(() => {
    if (currentRunningAgent && agentListRef.current) {
      const agentElement = document.getElementById(`agent-${currentRunningAgent}`);
      if (agentElement) {
        agentElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [currentRunningAgent]);

  // Reset function
  const handleReset = useCallback(() => {
    if (window.confirm('Are you sure you want to reset the analysis? This will clear all existing results.')) {
      // Clear all state variables (which will also clear localStorage)
      setTranscript('');
      setAnalyzingAgents(new Set());
      setAnalyzingAgentsArray([]);
      setHasAnalyzed(false);
      setLongContextResults({});
      setJtbdAnalysis({});
      setGainAnalysis({});
      setLocalAnalysisResults({});
      setAgentProgress({});
      setShowResult(null);
      setLastViewedResult(null);
      setUserHasSelectedView(false);
      setCurrentRunningAgent(null);
      setIsSequenceRunning(false);
      setIsOptimizingTranscript(false);
      setOptimizationProgress(0);
      previousTranscriptRef.current = '';
      
      // Clear finishedAgents state - only place this should be cleared
      setFinishedAgents(new Set());
      setFinishedAgentsArray([]);

      // Clear ALL local storage for opportunity evaluation
      window.localStorage.removeItem('opportunityTranscript');
      window.localStorage.removeItem('opportunityAnalyzingAgents');
      window.localStorage.removeItem('opportunityHasAnalyzed');
      window.localStorage.removeItem('opportunityResults');
      window.localStorage.removeItem('opportunityAgentProgress');
      window.localStorage.removeItem('opportunityShowResult');
      window.localStorage.removeItem('opportunityUserSelectedView');
      window.localStorage.removeItem('lastViewedOpportunityResult');
      window.localStorage.removeItem('opportunityIsOptimizing');
      window.localStorage.removeItem('opportunityOptimizationProgress');
      window.localStorage.removeItem('opportunityFinishedAgents');
      window.localStorage.removeItem('opportunityIsSequenceRunning');
      window.localStorage.removeItem('opportunityLongContextResults');
      window.localStorage.removeItem('opportunityJtbdAnalysis');
      window.localStorage.removeItem('opportunityGainAnalysis');
      window.localStorage.removeItem('opportunityCurrentAgent');

      toast.success('Analysis reset successfully');
      
      // Force a complete UI refresh to ensure all components reset properly
      // This guarantees that View Results buttons disappear and cards reset to initial state
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  }, [setTranscript, setAnalyzingAgents, setAnalyzingAgentsArray, setHasAnalyzed, setLongContextResults, setJtbdAnalysis, setGainAnalysis, setLocalAnalysisResults, setAgentProgress, setShowResult, setLastViewedResult, setUserHasSelectedView, setCurrentRunningAgent, setIsSequenceRunning, setIsOptimizingTranscript, setOptimizationProgress, setFinishedAgents, setFinishedAgentsArray]);

  // Function to handle agent result view selection
  const handleViewResult = useCallback((agentId) => {
    // Before switching views, make sure we preserve the current results
    // This ensures that when we switch back, we'll still have the real results
    if (showResult && localAnalysisResults[showResult]) {
      console.log(`Preserving results for ${showResult} before switching to ${agentId}`);
      // Store the current view's results in localStorage for persistence
      try {
        localStorage.setItem(`analysisResult_${showResult}`, JSON.stringify(localAnalysisResults[showResult]));
      } catch (error) {
        console.error('Failed to preserve current analysis results:', error);
      }
    }
    
    // Check if we have preserved results for the agent we're switching to
    try {
      const savedResults = localStorage.getItem(`analysisResult_${agentId}`);
      if (savedResults) {
        const parsedResults = JSON.parse(savedResults);
        console.log(`Loading preserved results for ${agentId}`);
        // Update the analysis results with the preserved data
        setLocalAnalysisResults(prev => ({
          ...prev,
          [agentId]: parsedResults
        }));
      }
    } catch (error) {
      console.error('Failed to load preserved analysis results:', error);
    }
    
    setShowResult(agentId);
    setUserHasSelectedView(true);
  }, [showResult, localAnalysisResults]);

  // Function to update the agent progress
  const updateAgentProgress = useCallback((agentId, progress, status = 'loading', error = null) => {
    console.log(`Updating progress for ${agentId}: ${progress}%, status: ${status}`);
    setAgentProgress(prev => {
      return {
        ...prev,
        [agentId]: { progress, status, error, timestamp: new Date().toISOString() }
      };
    });
  }, [setAgentProgress]);

  // Helper function to clean up agent state after completion or error
  const cleanupAgentState = useCallback((agentId) => {
    console.log(`💡 Cleaning up state for agent: ${agentId}`);
    
    // Use a short timeout to ensure UI updates complete first
    setTimeout(() => {
      // CRITICAL CHANGE: Always remove from analyzing agents set when done processing
      // This ensures progress bar disappears when agent is done
      setAnalyzingAgents(prev => {
        const newSet = new Set(prev);
        if (newSet.has(agentId)) {
          newSet.delete(agentId);
          console.log(`💫 Removed ${agentId} from analyzing agents to hide progress bar`);
        }
        return newSet;
      });
      
      // But we want to keep the agent in our tracking array if it has results
      // This ensures the 'View Results' button persists on completed agent cards
      if (localAnalysisResults[agentId]) {
        console.log(`✅ Keeping ${agentId} in results state to show View Results button`);
      }

      // Clear current running agent if this is it
      if (agentId === currentRunningAgent) {
        console.log(`Clearing currentRunningAgent: ${currentRunningAgent}`);
        setCurrentRunningAgent(null);
      }

      // Set hasAnalyzed if we have completed at least one agent
      if (Object.keys(localAnalysisResults).length > 0) {
        console.log(`Setting hasAnalyzed=true since we have completed agents`);
        setHasAnalyzed(true);

        // If we've just finished the last agent and no view is selected, auto-select a result
        setTimeout(() => {
          // Important: use another setTimeout to ensure the analyzing agents state has been updated
          const currentAnalyzingAgentsSize = document.querySelector('[data-analyzing-agents]')?.getAttribute('data-analyzing-agents-size') || '0';
          console.log(`Current analyzing agents size: ${currentAnalyzingAgentsSize}`);

          // If no agents are running, update the view results
          if (currentAnalyzingAgentsSize === '0' && !userHasSelectedView) {
            // Find the last completed agent (prefer opportunityQualification if available)
            const lastAgent = 
              localAnalysisResults.opportunityQualification ? 'opportunityQualification' :
              localAnalysisResults.demandAnalyst ? 'demandAnalyst' :
              localAnalysisResults.needsAnalysis ? 'needsAnalysis' : null;

            if (lastAgent) {
              console.log(`Auto-selecting result view for completed agent: ${lastAgent}`);
              setShowResult(lastAgent);
            }
          } else {
            // If we just completed a specific agent, show its results automatically
            // (unless user has selected a different view)
            if (!userHasSelectedView) {
              if (agentId === 'needsAnalysis' || agentId === 'demandAnalyst' || agentId === 'opportunityQualification') {
                console.log(`Just completed ${agentId} - updating view to show its results`);
                setShowResult(agentId);
              }
            }
          }
        }, 100);
      }
    }, 300);
  }, [currentRunningAgent, localAnalysisResults, showResult, userHasSelectedView]);

  // Function to process a transcript with a specific agent
  const processWithAgent = useCallback(async (agentId, content, previousResults = {}) => {
    console.log(`Starting processWithAgent for ${agentId}`);

    if (!apiKey && agentId !== 'longContextChunking') {
      toast.error('API key is missing. Please add it in Settings.');
      // Clean up state on early exit
      cleanupAgentState(agentId);
      return null;
    }

    // Make a safe copy of previousResults to avoid reference issues
    const resultsCopy = {...previousResults};

    // Initialize progress state
    setAnalyzingAgents(prev => {
      console.log(`Adding ${agentId} to analyzing agents set`);
      return new Set([...prev, agentId]);
    });
    setCurrentRunningAgent(agentId);
    updateAgentProgress(agentId, 0, 'loading');

    // Initialize OpenAI only when needed
    let openai = null;
    if (agentId !== 'longContextChunking') {
      try {
        openai = new OpenAI({
          apiKey,
          dangerouslyAllowBrowser: true
        });
      } catch (error) {
        console.error(`Error initializing OpenAI for ${agentId}:`, error);
        toast.error(`Failed to initialize OpenAI: ${error.message}`);
        cleanupAgentState(agentId);
        return null;
      }
    }

    try {
      // Validate required functions are available
      if (agentId === 'needsAnalysis' && typeof analyzeNeeds !== 'function') {
        console.error('analyzeNeeds function is not available:', analyzeNeeds);
        throw new Error('analyzeNeeds function is not properly imported');
      }
      if (agentId === 'demandAnalyst' && typeof analyzeDemand !== 'function') {
        console.error('analyzeDemand function is not available:', analyzeDemand);
        throw new Error('analyzeDemand function is not properly imported');
      }
      if (agentId === 'opportunityQualification' && typeof qualifyOpportunity !== 'function') {
        console.error('qualifyOpportunity function is not available:', qualifyOpportunity);
        throw new Error('qualifyOpportunity function is not properly imported');
      }

      let result;

      // ===== TEST MODE: Use dummy data instead of calling real agents =====
      console.log('🔄 TEST MODE: Using dummy data for agent:', agentId);
      
      // Set initial progress to make sure progress bar appears immediately
      updateAgentProgress(agentId, 0, 'loading');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Simulate progress updates with visible stepping
      for (let i = 1; i <= 3; i++) {
        console.log(`Agent ${agentId} progress: ${i * 25}%`);
        updateAgentProgress(agentId, i * 25, 'loading');
        await new Promise(resolve => setTimeout(resolve, 700));
      }
      
      // Create appropriate dummy data based on agent type
      switch (agentId) {
        case 'longContextChunking':
          console.log('TEST: Creating dummy data for longContextChunking');
          result = {
            chunks: ['Dummy Chunk 1', 'Dummy Chunk 2', 'Dummy Chunk 3'],
            summary: 'This is a test summary of the chunked transcript'
          };
          setLongContextResults(result);
          break;

        case 'needsAnalysis':
          console.log('TEST: Creating dummy data for needsAnalysis');
          result = {
            immediateNeeds: ['Need better UI', 'Need faster response times'],
            latentNeeds: ['Future scalability', 'Integration with other tools'],
            urgencyAssessment: { overall: 'High' },
            summary: 'Test needs analysis summary with dummy data',
            stakeholders: ['Product Manager', 'End Users']
          };
          break;

        case 'demandAnalyst':
          console.log('TEST: Creating dummy data for demandAnalyst');
          result = {
            demandLevel: 2,
            confidence: 80,
            summary: 'Test demand analysis with dummy data',
            indicators: {
              level1: ['Indicator 1', 'Indicator 2'],
              level2: ['Indicator 3', 'Indicator 4'],
              level3: ['Indicator 5', 'Indicator 6']
            }
          };
          console.log('📊 TEST MODE: demandAnalyst dummy result created:', result);
          break;

        case 'opportunityQualification':
          console.log('TEST: Creating dummy data for opportunityQualification');
          result = {
            qualified: true,
            score: 85,
            factors: {
              problemExperience: 'Strong evidence of problem experience',
              activeSearch: 'Currently evaluating solutions',
              problemFit: 'High alignment with our solution capabilities'
            },
            overallAssessment: 'Strong Opportunity',
            summary: 'Test opportunity qualification with dummy data'
          };
          break;

        case 'finalReport':
          console.log('TEST: Creating dummy data for finalReport');
          result = {
            summary: 'Test final report summary',
            recommendations: ['Recommendation 1', 'Recommendation 2'],
            reportUrl: '#test-report'
          };
          break;

        default:
          console.log('TEST: Creating generic dummy data for unknown agent', agentId);
          result = {
            summary: `Test data for ${agentId}`,
            completed: true,
            timestamp: new Date().toISOString()
          };
      }
      
      console.log(`✅ TEST: ${agentId} completed with dummy data`);

      // Save the result
      setLocalAnalysisResults(prev => {
        console.log(`Saving result for ${agentId} to local analysis results:`, { previous: !!prev[agentId], new: !!result });
        // For needsAnalysis and demandAnalyst, ensure we're getting a proper result
        if (agentId === 'needsAnalysis' || agentId === 'demandAnalyst') {
          console.log(`📊 ${agentId} detailed result check:`, { 
            hasResult: !!result,
            resultType: typeof result,
            isEmpty: result && Object.keys(result).length === 0
          });

          // Critical: As soon as we have results for any agent, immediately set hasAnalyzed
          if (result) {
            console.log(`💯 ${agentId} completed - immediately setting hasAnalyzed=true`);
            setTimeout(() => {
              setHasAnalyzed(true);
              // Also set the showResult to this agent if not already set by user
              if (!userHasSelectedView && (showResult === null || showResult === 'longContextChunking')) {
                console.log(`Setting showResult to: ${agentId}`);
                setShowResult(agentId);
              }
            }, 50); // Small delay to ensure state updates properly
          }
        }

        const newResults = { ...prev, [agentId]: result };
        return newResults;
      });

      // Update the progress to 100% and set status to 'success'
      // Final progress update - now we can safely set it to 100%
      updateAgentProgress(agentId, 100, 'success');
      console.log(`Agent ${agentId} completed successfully with progress 100%`);
      
      // Mark the agent as having results directly in localAnalysisResults to ensure its state is preserved
      // This is a failsafe to ensure we always have a record of completed agents
      setLocalAnalysisResults(prevResults => {
        if (!prevResults[agentId]) {
          console.log(`Ensuring ${agentId} is recorded in localAnalysisResults`);
          return { ...prevResults, [agentId]: result || { completed: true } };
        }
        return prevResults;
      });

      // IMPORTANT: Force clear the status in agentProgress to prevent progress bars from showing
      setAgentProgress(prev => {
        const newProgress = { ...prev };
        // Set to 0 to hide progress bar but keep 'View Results' button
        if (newProgress[agentId] === 100) {
          newProgress[agentId] = 0;
        }
        return newProgress;
      });

      // Use the cleanupAgentState helper with a delay to ensure UI updates complete
      // but DO NOT remove from analyzingAgents if it has results
      setTimeout(() => {
        if (result) {
          // Only update progress but keep in analyzingAgents to maintain View Results button
          console.log(`Agent ${agentId} has results - preserving in analyzingAgents`);
        } else {
          cleanupAgentState(agentId);
        }
      }, 500);

      // Return the result for potential chaining
      return result;
    } catch (error) {
      console.error(`Error processing with ${agentId}:`, error);
      toast.error(`Error in ${agentId}: ${error.message}`);

      // Update the progress with error status
      updateAgentProgress(agentId, 0, 'error', error.message);

      // Use the cleanupAgentState helper with a delay for error handling too
      setTimeout(() => {
        console.log(`Calling cleanupAgentState for ${agentId} after error`);
        cleanupAgentState(agentId);
      }, 500);

      return null;
    }
  }, [apiKey, updateAgentProgress, longContextResults, jtbdAnalysis, gainAnalysis, setLocalAnalysisResults, currentRunningAgent, cleanupAgentState]);

  // Function to run the next agent in the sequence
  const runNextAgentInSequence = useCallback(async () => {
    if (!isSequenceRunning) {
      console.log('Sequence is not running, stopping');
      return;
    }

    // CRITICAL: Ensure we're never showing the longContextChunking results
    if (showResult === 'longContextChunking') {
      console.log('🚨 CRITICAL: Detected longContextChunking being shown - resetting showResult');
      setShowResult(null);
    }

    // Find which agents have been completed
    const completedAgents = new Set(Object.keys(localAnalysisResults));
    console.log('Completed agents:', [...completedAgents]);

    // Define the visible agent sequence (without the hidden longContextChunking)
    const visibleAgentSequence = ['needsAnalysis', 'demandAnalyst', 'opportunityQualification', 'finalReport'];

    // Special case: If we just completed longContextChunking, immediately proceed to needsAnalysis
    if (completedAgents.has('longContextChunking') && currentRunningAgent === 'longContextChunking') {
      console.log('🔄 Transitioning from chunking phase to analysis phase');
      setShowResult(null); // Ensure no results are showing during transition
    }

    // Find the next visible agent to run
    let nextAgentIndex = visibleAgentSequence.findIndex(agentId => !completedAgents.has(agentId));

    // If needsAnalysis is already done (processed directly in startAnalysisSequence)
    // skip to the agent after it
    if (nextAgentIndex === 0 && completedAgents.has('needsAnalysis')) {
      nextAgentIndex = 1;  // Move to the second visible agent
    }

    // Check if we've completed all agents
    if (nextAgentIndex === -1) {
      console.log('All agents completed, sequence is done');
      setIsSequenceRunning(false);
      return;
    }

    // Get the next agent to run
    const nextAgentId = visibleAgentSequence[nextAgentIndex];
    console.log(`Running next agent in sequence: ${nextAgentId}`);

    // Get agent information
    const agentInfo = agents.find(a => a.id === nextAgentId);

    // Check if prerequisites are satisfied
    if (agentInfo?.requiresPreviousAgent) {
      const prerequisiteIds = Array.isArray(agentInfo.requiresPreviousAgent) 
        ? agentInfo.requiresPreviousAgent 
        : [agentInfo.requiresPreviousAgent];

      const allPrerequisitesMet = prerequisiteIds.every(id => localAnalysisResults[id]);

      if (!allPrerequisitesMet) {
        // Cannot run this agent yet, try to find prerequisites that need to be run
        const missingPrerequisites = prerequisiteIds.filter(id => !localAnalysisResults[id]);

        // Check if any of these missing prerequisites have their own prerequisites
        for (const missingId of missingPrerequisites) {
          // Recursively try to run prerequisites first
          const missingAgentInfo = agents.find(a => a.id === missingId); // Get agent from agents array
          if (!missingAgentInfo?.requiresPreviousAgent || 
              (Array.isArray(missingAgentInfo.requiresPreviousAgent) 
                ? missingAgentInfo.requiresPreviousAgent.every(id => localAnalysisResults[id])
                : localAnalysisResults[missingAgentInfo.requiresPreviousAgent])) {
            // This prerequisite can be run
            await processWithAgent(missingId, transcript, localAnalysisResults);
            // After running the prerequisite, attempt to continue the sequence
            if (isSequenceRunning) {
              runNextAgentInSequence();
            }
            return;
          }
        }

        // If we can't find a runnable prerequisite, there might be a dependency issue
        toast.error(`Cannot run ${agentInfo.name}. Missing required prerequisite analyses.`);
        setIsSequenceRunning(false);
        return;
      }
    }

    // Add a small delay before running the next agent to ensure UI updates
    console.log(`⏳ Waiting briefly before starting next agent: ${nextAgentId}`);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Run the next agent
    console.log(`🚀 Running next agent in sequence: ${nextAgentId}`);
    await processWithAgent(nextAgentId, transcript, localAnalysisResults);
    
    // Ensure we give time for state to update before continuing
    console.log(`✅ Agent ${nextAgentId} completed, preparing for next in sequence`);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Only continue if we're still in sequence mode
    if (isSequenceRunning) {
      console.log('🔄 Continuing sequence to next agent');
      runNextAgentInSequence();
    } else {
      // Critical: If the sequence is ending here, make sure we set the analyzed state
      console.log('Sequence ending - ensuring hasAnalyzed=true and a result is selected');
      setHasAnalyzed(true);

      // Auto-select a result if none is selected yet
      if (showResult === null && !userHasSelectedView) {
        // Prefer the opportunity qualification if available
        if (localAnalysisResults.opportunityQualification) {
          console.log('Auto-selecting opportunityQualification result');
          setShowResult('opportunityQualification');
        } else if (localAnalysisResults.needsAnalysis) {
          console.log('Auto-selecting needsAnalysis result');
          setShowResult('needsAnalysis');
        }
      }
    }
  }, [isSequenceRunning, localAnalysisResults, processWithAgent, transcript, showResult, userHasSelectedView]);

  // Helper function to create consistent Demand Analyst results
  const createDemandAnalystResult = (baseResult, transcriptSummary) => {
    return {
      ...baseResult,
      systemPrompt: `
        You are a Demand Analyst. Your task is to analyze the buying cycle position across 3 demand levels:
        
        Level 1: Learning Demand (6-24 months)
        Level 2: Solution Demand (3-6 months)
        Level 3: Vendor Demand (1-3 months)
        
        Evaluate specific indicators for each level:
        Level 1: Info gathering, basic understanding
        Level 2: Pain points, budget discussions, implementation planning
        Level 3: Urgent needs, approved budget, vendor comparison
        
        Required Analysis Components:
        - Demand level determination (1-3)
        - Confidence score (0-100%)
        - Evidence from transcript
        - Indicators found at each level
        - Reasoning and gaps
        - Recommendations
        - Transcript quality assessment
        
        Output Format: JSON structure with:
        - demandLevel
        - confidenceScore
        - analysis (indicators for each level)
        - reasoning
        - recommendations
        - metadata
        
        Must be evidence-based, no assumptions allowed.
      `,
      processedTranscript: transcriptSummary,
      demandLevel: 2,
      confidenceScore: 75,
      analysis: {
        level1Indicators: [
          'Information gathering about product features',
          'Basic understanding of problem space'
        ],
        level2Indicators: [
          'Discussion of specific pain points',
          'Preliminary budget considerations',
          'Implementation timeline exploration'
        ],
        level3Indicators: [
          'Comparing specific vendor offerings'
        ]
      },
      reasoning: {
        summary: 'Based on the transcript analysis, the prospect is primarily in Solution Demand (Level 2) with some indicators of Vendor Demand (Level 3). They have clearly identified pain points and are discussing implementation details, but have not yet finalized budget approval or created a formal vendor shortlist.',
        gaps: [
          'No explicit budget approval mentioned',
          'Timeline not firmly established'
        ]
      },
      recommendations: [
        'Focus on differentiating solution capabilities',
        'Provide case studies of similar implementations',
        'Offer a detailed implementation plan with timeline',
        'Discuss ROI calculations to help with budget approval process'
      ],
      metadata: {
        transcriptQuality: 'Good',
        confidenceFactors: [
          'Clear pain point articulation',
          'Multiple solution discussions',
          'Some budget consideration'
        ]
      }
    };
  };

  // Helper function to create consistent Needs Analysis results
  const createNeedsAnalysisResult = (baseResult, transcriptSummary) => {
    return {
      ...baseResult,
      processedTranscript: transcriptSummary,
      immediateNeeds: [
        { 
          need: 'Need to streamline customer onboarding process', 
          urgency: 'High', 
          context: 'Current process is causing customer frustration and delays', 
          evidence: 'Based on transcript analysis showing multiple mentions of onboarding friction' 
        },
        { 
          need: 'Need for better technical documentation', 
          urgency: 'Medium', 
          context: 'Users struggle to find answers to technical questions', 
          evidence: 'Evidence from transcript showing confusion about product features' 
        }
      ],
      latentNeeds: [
        { 
          need: 'Need for more personalized customer support options', 
          confidence: 85, 
          rationale: 'Customers expressing desire for more tailored assistance', 
          evidence: 'Pattern of comments about generic support responses' 
        },
        { 
          need: 'Need for mobile-friendly interface improvements', 
          confidence: 70, 
          rationale: 'Increasing mobile usage patterns suggest growing importance', 
          evidence: 'Subtle references to mobile access challenges in transcript' 
        }
      ],
      urgencyAssessment: { overall: 'Medium-High' },
      stakeholders: ['Product Team', 'Customer Support', 'Engineering']
    };
  };

  // ULTRA-SIMPLIFIED: Function to start the automatic analysis sequence with visual-only flow
  const startAnalysisSequence = useCallback(async () => {
    if (!transcript) {
      toast.error('Please upload or enter a transcript before running analysis.');
      return;
    }

    console.log('🚀 Starting ULTRA-SIMPLIFIED flow - visual elements only');

    // Reset everything first to ensure clean state
    setShowResult(null);
    setAnalyzingAgents(new Set());
    setLocalAnalysisResults({});
    setAgentProgress({});
    setHasAnalyzed(false);

    // Define sequence of agents to run in order
    const agentSequence = [
      'longContextChunking',
      'needsAnalysis', 
      'demandAnalyst', 
      'opportunityQualification', 
      'finalReport'
    ];
    
    // Start the sequence
    setIsSequenceRunning(true);

    try {
      // Special handling for the longContextChunking agent (progress showing on first card)
      const needsAnalysisId = 'needsAnalysis';
      
      // Run each agent in sequence with simple visual progression
      let currentIndex = 0;
      for (const agentId of agentSequence) {
        console.log(`Starting agent: ${agentId} (index: ${currentIndex})`);
        currentIndex++;
        
        // Handle the special case of longContextChunking agent showing progress on the needsAnalysis card
        if (agentId === 'longContextChunking') {
          // Set isOptimizingTranscript to true to show grey progress bar on first visible card
          setIsOptimizingTranscript(true);
          
          try {
            console.log('Starting real transcript processing with longContextChunking...');
            
            // Get the current transcript from state
            const currentTranscript = transcript || '';
            if (!currentTranscript.trim()) {
              throw new Error('No transcript content to analyze');
            }
            
            // Set initial progress
            setOptimizationProgress(5);
            
            // Process the transcript using the real implementation
            const result = await processWithLongContextChunking(
              currentTranscript,
              // Progress callback function
              (progress) => {
                console.log(`Real transcript optimization progress: ${progress}%`);
                setOptimizationProgress(progress);
              },
              // Use the OpenAI API key from state
              apiKey
            );
            
            console.log('Transcript processing completed successfully:', result);
            
            // Add the real results to state
            setLocalAnalysisResults(prev => ({
              ...prev,
              [agentId]: {
                completed: true,
                timestamp: new Date().toISOString(),
                summary: result.finalSummary,
                chunks: result.chunks,
                chunkSummaries: result.chunkSummaries,
                sectionSummaries: result.sectionSummaries,
                finalSummary: result.finalSummary,
                metadata: result.metadata
              }
            }));
            
          } catch (error) {
            console.error('Error processing transcript:', error);
            
            // If there's an error, create a fallback result
            const fallbackResult = {
              completed: true,
              timestamp: new Date().toISOString(),
              summary: 'Error optimizing transcript: ' + error.message,
              chunks: [],
              chunkSummaries: [],
              sectionSummaries: [],
              finalSummary: 'Failed to process transcript: ' + error.message,
              error: error.message
            };
            
            // Add fallback results to state
            setLocalAnalysisResults(prev => ({
              ...prev,
              [agentId]: fallbackResult
            }));
            
            // Complete the progress bar even on error
            setOptimizationProgress(100);
          }
          
          // Add to finishedAgents set to ensure View Results buttons persist
          setFinishedAgents(prev => new Set([...prev, agentId]));
          
          // Finish optimization but don't remove transcript optimization flag yet
          // We need to keep a record of completing this step
          setOptimizationProgress(100);
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Add to finishedAgents array for persistence across sessions
          setFinishedAgentsArray(prev => [...prev, agentId]);
          
          // Keep running the sequence - do not skip or jump ahead
          // This is important to maintain the automated flow
          setIsOptimizingTranscript(false);
        }
        
        // For all visible agents (not longContextChunking), set the analyzing state
        // to ensure the green progress bar shows
        if (agentId !== 'longContextChunking') {
          console.log(`Setting analyzing state for visible agent: ${agentId}`);
          
          // First clear any previous analyzing agents
          // This ensures only one agent shows the green progress bar at a time
          setAnalyzingAgents(new Set([agentId]));
          setCurrentRunningAgent(agentId);
          
          // Ensure progress starts immediately to show the green bar
          setAgentProgress(prev => ({
            ...prev,
            [agentId]: { progress: 15, status: 'loading', timestamp: new Date().toISOString() }
          }));
        } else {
          // For background agents, just set the current running agent
          setCurrentRunningAgent(agentId);
        }
        
        // Make sure to log when each agent starts running for debugging
        console.log(`❇️ Running agent: ${agentId} - starting green progress bar`);
        
        // 2. Show progress updates - use a custom delay for the first agent (needs analysis)
        // to ensure a smooth transition from grey to green bar
        const isFirstVisibleAgent = agentId === 'needsAnalysis';
        const progressDelay = isFirstVisibleAgent ? 400 : 700; // Faster progress updates for first agent
        
        // Set initial progress immediately to trigger bar display
        setAgentProgress(prev => ({
          ...prev,
          [agentId]: { progress: 10, status: 'loading', timestamp: new Date().toISOString() }
        }));
        
        // Then increment regularly
        for (let progress = 25; progress <= 100; progress += 25) {
          console.log(`Agent ${agentId} progress: ${progress}%`);
          setAgentProgress(prev => ({
            ...prev,
            [agentId]: { progress, status: 'loading', timestamp: new Date().toISOString() }
          }));
          await new Promise(resolve => setTimeout(resolve, progressDelay));
        }
        
        // 3. Create appropriate dummy results for each agent type
        let dummyResult = {
          completed: true,
          timestamp: new Date().toISOString(),
          summary: `Dummy result for ${agentId}`
        };
        
        // Customize data based on agent type
        if (agentId === 'needsAnalysis') {
          // Get the processed transcript from longContextChunking results
          const chunkingResults = localAnalysisResults['longContextChunking'];
          
          // Log what we have for debugging
          console.log('Current analysis results:', JSON.stringify(localAnalysisResults, null, 2));
          
          // Check if we have the chunking results
          if (!chunkingResults) {
            console.error('Missing longContextChunking results for Needs Analysis - using fallback');
            // Instead of throwing an error, use a fallback approach
            // This ensures the sequence continues even if chunking results aren't available
            
            // Use the raw transcript as fallback
            const rawTranscriptSummary = 'Using raw transcript as fallback due to missing chunking results';
            console.log(rawTranscriptSummary);
            
            // Continue with fallback data
            dummyResult = createNeedsAnalysisResult(dummyResult, rawTranscriptSummary);
          } else {
            // We have chunking results, use them
            console.log('Using processed transcript for Needs Analysis:', chunkingResults.finalSummary);
            
            // Continue with real data
            dummyResult = createNeedsAnalysisResult(dummyResult, chunkingResults.finalSummary);
          }
          
          // We've already created the result using our helper function
        } else if (agentId === 'demandAnalyst') {
          // Get the processed transcript from longContextChunking results or needsAnalysis
          const chunkingResults = localAnalysisResults['longContextChunking'];
          const needsResults = localAnalysisResults['needsAnalysis'];
          
          // Use the best available transcript data
          let transcriptData = '';
          
          if (chunkingResults && chunkingResults.finalSummary) {
            console.log('Using longContextChunking results for Demand Analyst');
            transcriptData = chunkingResults.finalSummary;
          } else if (needsResults && needsResults.processedTranscript) {
            console.log('Using needsAnalysis processed transcript for Demand Analyst');
            transcriptData = needsResults.processedTranscript;
          } else {
            console.log('No processed transcript available, using raw transcript for Demand Analyst');
            transcriptData = transcript || 'No transcript available';
          }
          
          // Create the demand analysis result using our helper function
          dummyResult = createDemandAnalystResult(dummyResult, transcriptData);
        } else if (agentId === 'opportunityQualification') {
          dummyResult = {
            ...dummyResult,
            qualification: 'Qualified',
            opportunityScore: 75,
            reasons: { strengths: ['Sample strength'], weaknesses: ['Sample weakness'] }
          };
        } else if (agentId === 'longContextChunking') {
          dummyResult = {
            ...dummyResult,
            chunks: ['Sample chunk 1', 'Sample chunk 2'],
            chunkSummaries: ['Summary of chunk 1', 'Summary of chunk 2']
          };
        } else if (agentId === 'finalReport') {
          dummyResult = {
            ...dummyResult,
            sections: [
              { title: 'Summary', content: 'Sample report summary content' },
              { title: 'Analysis', content: 'Sample analysis content' }
            ]
          };
        }
        
        // 4. Update analysis results (keeps View Results button visible)
        setLocalAnalysisResults(prev => ({
          ...prev,
          [agentId]: dummyResult
        }));
        
        // Add to finishedAgents set to ensure View Results buttons always persist
        setFinishedAgents(prev => new Set([...prev, agentId]));
        
        // 5. Mark as complete and show View Results
        setAgentProgress(prev => ({
          ...prev,
          [agentId]: { progress: 100, status: 'success', timestamp: new Date().toISOString() }
        }));
        
        // 7. If this isn't longContextChunking, show its results
        // But don't reset the results when switching views
        if (agentId !== 'longContextChunking') {
          // Store the current agent's results in localStorage to ensure persistence
          try {
            localStorage.setItem(`analysisResult_${agentId}`, JSON.stringify(dummyResult));
          } catch (error) {
            console.error('Failed to store analysis results in localStorage:', error);
          }
          setShowResult(agentId);
        }
        
        // Wait before starting next agent
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 6. Only remove from analyzing agents right before the next agent starts
        // This keeps the progress bar visible until the very last moment
        setAnalyzingAgents(prev => {
          const newSet = new Set(prev);
          newSet.delete(agentId);
          return newSet;
        });
      }

      // Mark that we've analyzed something and finish the sequence
      console.log('✅ Completed SIMPLIFIED visual flow sequence');
      setHasAnalyzed(true);
      
      // Show success message and end sequence
      console.log('Analysis sequence complete!');
      toast.success('Analysis sequence completed successfully!');
      
      // Ensure sequence is properly marked as done
      setIsSequenceRunning(false);
    } catch (error) {
      console.error('Error in simplified analysis sequence:', error);
      toast.error(`Error in analysis: ${error.message || 'Unknown error'}`);
      
      // Reset states on error
      setIsSequenceRunning(false);
      setAnalyzingAgents(new Set());
    }
  }, [transcript, runNextAgentInSequence, apiKey, setLocalAnalysisResults]);

  // Handle the stop of the analysis sequence
  const stopAnalysisSequence = useCallback(() => {
    setIsSequenceRunning(false);
    toast.info('Analysis sequence stopped.');
  }, []);

  // Handle transcript upload or input
  const handleContentChange = useCallback((content) => {
    // Clear any previous analysis state when uploading new content
    setAnalyzingAgents(new Set());
    setAgentProgress({});
    setLocalAnalysisResults({});
    setCurrentAgent(null);
    setHasAnalyzed(false);
    setTranscript(content);
  }, []);

  // Effect to store previous transcript
  useEffect(() => {
    previousTranscriptRef.current = transcript;
  }, [transcript]);

  // Clear all state and localStorage items
  const clearAllState = useCallback(() => {
    // Clear ALL localStorage items for opportunity evaluation
    localStorage.removeItem('opportunityResults');
    localStorage.removeItem('opportunityAgentProgress');
    localStorage.removeItem('opportunityTranscript');
    localStorage.removeItem('opportunityAnalyzingAgents');
    localStorage.removeItem('opportunityHasAnalyzed');
    localStorage.removeItem('opportunityShowResult');
    localStorage.removeItem('opportunityUserSelectedView');
    localStorage.removeItem('opportunityCurrentAgent');
    localStorage.removeItem('opportunityIsProcessing');
    localStorage.removeItem('opportunityIsOptimizing');
    localStorage.removeItem('opportunityOptimizationProgress');
    localStorage.removeItem('opportunityCurrentIndex');
    localStorage.removeItem('opportunityIsSequenceRunning');
    localStorage.removeItem('opportunityFinishedAgents');
    localStorage.removeItem('lastViewedOpportunityResult');
    localStorage.removeItem('opportunityLongContextResults');
    localStorage.removeItem('opportunityJtbdAnalysis');
    localStorage.removeItem('opportunityGainAnalysis');
    localStorage.removeItem('opportunityCurrentAgent');

    // Clear all state variables completely
    setLocalAnalysisResults({});
    setAgentProgress({});
    setTranscript('');
    setAnalyzingAgents(new Set());
    setAnalyzingAgentsArray([]);
    setHasAnalyzed(false);
    setShowResult(null);
    setLastViewedResult(null);
    setCurrentAgent(null);
    setCurrentRunningAgent(null);
    setIsSequenceRunning(false);
    setUserHasSelectedView(false);
    setIsOptimizingTranscript(false);
    setOptimizationProgress(0);
    setFinishedAgents(new Set());
    setFinishedAgentsArray([]);
    setLongContextResults({});
    setJtbdAnalysis({});
    setGainAnalysis({});
  }, []);

  // Handle clearing data with toast notification
  const handleClearData = useCallback(() => {
    // First clear all state using our function
    clearAllState();
    
    // Make sure finishedAgents is cleared (which controls View Results buttons)
    setFinishedAgents(new Set());
    setFinishedAgentsArray([]);
    
    // Make sure to clear ALL localStorage items
    localStorage.removeItem('opportunityFinishedAgents');
    localStorage.removeItem('lastViewedOpportunityResult');
    localStorage.removeItem('opportunityLongContextResults');
    localStorage.removeItem('opportunityJtbdAnalysis');
    localStorage.removeItem('opportunityGainAnalysis');
    
    toast.success("All opportunity evaluation data has been reset.");
    
    // Force page refresh to guarantee complete reset to default state
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }, [clearAllState]);

  // Handle individual agent analysis
  const handleRunSingleAgent = async (agentId) => {
    if (!transcript) {
      toast.error('Please upload or enter a transcript before running analysis.');
      return;
    }

    // Check if agent has prerequisites
    const agentInfo = agents.find(a => a.id === agentId);
    if (agentInfo?.requiresPreviousAgent) {
      const prerequisiteIds = Array.isArray(agentInfo.requiresPreviousAgent) 
        ? agentInfo.requiresPreviousAgent 
        : [agentInfo.requiresPreviousAgent];

      const missingPrerequisites = prerequisiteIds.filter(id => !localAnalysisResults[id]);

      if (missingPrerequisites.length > 0) {
        const missingNames = missingPrerequisites.map(id => {
          const prereqAgent = agents.find(a => a.id === id);
          return prereqAgent?.name || id;
        }).join(', ');
        toast.error(`${agentInfo.name} requires ${missingNames} to be run first.`);
        return;
      }
    }

    await processWithAgent(agentId, transcript, localAnalysisResults);
  };

  // Create refs outside the effects to persist between renders
  const sequenceCompletedRef = useRef(false);
  const contextChunkingFixedRef = useRef(false);

  // Simplified sequential agent handling - using a single effect
  useEffect(() => {
    // Don't run again if we've already completed this sequence
    if (sequenceCompletedRef.current) return;

    // Skip if no results yet
    if (!Object.keys(localAnalysisResults).length) {
      return;
    }

    console.log('💯 Checking if we should set hasAnalyzed=true');
    console.log('Has needsAnalysis results:', !!localAnalysisResults.needsAnalysis);

    // Immediately mark hasAnalyzed=true if we have ANY agent results
    if (localAnalysisResults.needsAnalysis || 
        localAnalysisResults.demandAnalyst || 
        localAnalysisResults.opportunityQualification) {
      console.log('✅ We have some results! Setting hasAnalyzed=true');
      setHasAnalyzed(true);
    }

    // Only set sequence as completed if ALL agents are done or sequence isn't running
    if (!isSequenceRunning && analyzingAgents.size === 0) {
      console.log('✅ Full sequence completed! Marking as done');
      sequenceCompletedRef.current = true;
    }

    // Only set the show result if user hasn't made a choice
    if (showResult === null && !userHasSelectedView) {
      // Default to showing the last visible agent result
      const visibleAgentSequence = ['needsAnalysis', 'demandAnalyst', 'opportunityQualification', 'finalReport'];
      for (let i = visibleAgentSequence.length - 1; i >= 0; i--) {
        const agentId = visibleAgentSequence[i];
        if (localAnalysisResults[agentId]) {
          console.log(`Setting showResult to: ${agentId}`);
          setShowResult(agentId);
          break;
        }
      }
    }
  }, [isSequenceRunning, analyzingAgents.size, localAnalysisResults, showResult, userHasSelectedView]);

  // Simple safeguard to prevent showing longContextChunking (as a separate effect)
  useEffect(() => {
    // Skip if already fixed or if not showing longContextChunking
    if (showResult !== 'longContextChunking' || contextChunkingFixedRef.current) {
      return;
    }

    // Fix the longContextChunking view once
    console.log('🛡️ Preventing longContextChunking view');
    contextChunkingFixedRef.current = true;

    // Show the first available result instead
    const agents = ['needsAnalysis', 'demandAnalyst', 'opportunityQualification'];
    for (const agentId of agents) {
      if (localAnalysisResults[agentId]) {
        setShowResult(agentId);
        return;
      }
    }

    // If no results found, show nothing
    setShowResult(null);
  }, [showResult, localAnalysisResults]);

  // Add debug logging for render conditions
  useEffect(() => {
    console.log('Render state debug:', { 
      showResult, 
      hasAnalyzed, 
      isSequenceRunning, 
      analyzingAgentsSize: analyzingAgents.size,
      shouldShowResults: showResult && hasAnalyzed
    });
  }, [showResult, hasAnalyzed, isSequenceRunning, analyzingAgents]);

  // Handle analysis completion
  const handleAnalysisComplete = useCallback((agentId, results) => {
    setAnalyzingAgents(prev => prev.filter(id => id !== agentId));
    setLocalAnalysisResults(prev => ({ ...prev, [agentId]: results }));
    setAgentProgress(prev => ({ ...prev, [agentId]: 100 }));
    setHasAnalyzed(true);

    // Select the result to show if user hasn't already selected one
    if (!userHasSelectedView) {
      if (agentId === 'opportunityQualification') {
        setShowResult('opportunityQualification');
      } else if (agentId === 'demandAnalyst' && showResult !== 'opportunityQualification') {
        setShowResult('demandAnalyst');
      } else if (agentId === 'needsAnalysis' && showResult !== 'opportunityQualification' && showResult !== 'demandAnalyst') {
        setShowResult('needsAnalysis');
      }
    }

    // Find agent's position in sequence and run next agent
    const currentIndex = AGENT_SEQUENCE.indexOf(agentId);
    if (currentIndex !== -1 && currentIndex < AGENT_SEQUENCE.length - 1) {
      console.log(`✅ Agent ${agentId} completed, running next in sequence`);
      runNextAgentInSequence();
    }
  }, [runNextAgentInSequence, showResult, userHasSelectedView]);

  const updateLocalResults = useCallback((agentId, results) => {
    // Make sure we never store undefined or null results
    if (results) {
      console.log(`Updating localAnalysisResults for ${agentId} with valid results`);
      setLocalAnalysisResults(prev => ({ ...prev, [agentId]: results }));
      
      // Make sure this agent is properly showing as done by clearing progress
      setAgentProgress(prev => {
        // Only update if needed to avoid unnecessary renders
        if (prev[agentId] !== 0) {
          console.log(`Resetting progress for ${agentId} to prevent progress bar display`);
          return { ...prev, [agentId]: 0 };
        }
        return prev;
      });
    } else {
      console.warn(`Attempted to update localAnalysisResults for ${agentId} with invalid results:`, results);
    }
  }, []);

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="w-full bg-[#FAFAFA] p-4 border-b">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Opportunity Evaluation</h1>
          <Button 
              onClick={handleClearData} 
              variant="outline" 
              className="bg-white text-red-600 hover:bg-red-50 border-red-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Reset Evaluation
            </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-grow overflow-hidden">
        <div className="w-1/3 p-4 overflow-y-auto" ref={containerRef}>
          <OpportunityAgentSelection
            agents={agents.filter(agent => ['needsAnalysis', 'demandAnalyst', 'opportunityQualification', 'finalReport'].includes(agent.id))}
            // The full sequence includes the hidden longContextChunking agent that runs in the background
            agentSequence={['longContextChunking', 'needsAnalysis', 'demandAnalyst', 'opportunityQualification', 'finalReport']}
            agentProgress={agentProgress}
            analyzingAgents={analyzingAgents}
            localAnalysisResults={localAnalysisResults}
            onRunAgent={handleRunSingleAgent}
            onViewResult={handleViewResult}
            selectedResult={showResult}
            disableRun={!transcript || isSequenceRunning}
            isDone={isDone}
            onViewResults={handleViewResult}
            isOptimizingTranscript={isOptimizingTranscript}
            optimizationProgress={optimizationProgress}
            onAnalysisComplete={handleAnalysisComplete}
          />
        </div>
        <div className="w-2/3 p-4 overflow-y-auto" ref={agentListRef}>
          <Card className="p-6">
            {/* Debug info - remove this in production */}
            <div className="hidden" data-debug-info
              data-show-result={showResult || 'null'}
              data-has-analyzed={hasAnalyzed.toString()}
              data-analyzing-agents-size={analyzingAgents.size}
              data-sequence-running={isSequenceRunning.toString()}
            />

            {/* Show results if ANY agent has completed (showResult exists OR hasAnalyzed) */}
            {((showResult && showResult !== 'longContextChunking') || (hasAnalyzed && localAnalysisResults.needsAnalysis)) ? (
              <SimpleAnalysisResults 
                showResult={showResult}
                localAnalysisResults={localAnalysisResults}
              />
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className={`text-xl font-semibold ${(transcript || analyzingAgents.size > 0) ? 'text-gray-400' : ''}`}>Upload Interview Transcript</h2>
                </div>
                <FileUpload
                  onContentChange={handleContentChange}
                  defaultValue={transcript}
                  isLoading={analyzingAgents.size > 0}
                />
                <div className="flex justify-end">
                  <Button
                    onClick={startAnalysisSequence}
                    disabled={!transcript || analyzingAgents.size > 0}
                    variant="outline"
                    className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 hover:border-blue-300"
                  >
                    {analyzingAgents.size > 0 ? 'Analyzing...' : 'Analyze Transcript'}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};



export default OpportunityEvaluation;