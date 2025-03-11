import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import useDragToScroll from '../hooks/useDragToScroll';
import { toast } from "sonner";
import { agents } from '../data/agents';
import FileUpload from '../components/FileUpload';
import OpportunityAgentSelection from '../components/OpportunityAgentSelection';
import AnalysisResults from '../components/AnalysisResults';
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
    progressCallback(70);  // Never go to 100% until complete
    await new Promise(resolve => setTimeout(resolve, 250));

    // Return dummy data for now
    return {
      qualified: true,
      score: 85,
      factors: {
        problemExperience: 'Strong evidence of problem experience',
        activeSearch: 'Currently evaluating solutions',
        problemFit: 'High alignment with our solution capabilities'
      }
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

  // Check if there's active analysis going on
  const isAnalyzing = analyzingAgents.size > 0;

  // Function to check if an agent has completed its analysis
  const isDone = useCallback((agentId) => {
    // First check immediate state
    const hasResults = !!localAnalysisResults[agentId];

    // Debug state for logging
    const debugState = {
      hasResults,
      inComponentState: !!localAnalysisResults[agentId]
    };

    console.log(`🔍 isDone Check for ${agentId}:`, debugState);
    return hasResults;
  }, [localAnalysisResults]);

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

      // Clear local storage for analysis results
      window.localStorage.removeItem('opportunityResults');
      window.localStorage.removeItem('opportunityAgentProgress');

      toast.success('Analysis reset successfully');
    }
  }, [setLocalAnalysisResults, setAgentProgress]);

  // Function to handle agent result view selection
  const handleViewResult = useCallback((agentId) => {
    setShowResult(agentId);
    setUserHasSelectedView(true);
  }, []);

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
    console.log(`Cleaning up state for agent: ${agentId}`);
    // Use a short timeout to ensure UI updates complete first
    setTimeout(() => {
      // Remove from analyzing agents
      setAnalyzingAgents(prev => {
        const newSet = new Set(prev);
        newSet.delete(agentId);
        console.log(`Removed ${agentId} from analyzing agents`);
        return newSet;
      });

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

      // Determine which agent function to call based on agentId
      switch (agentId) {
        case 'longContextChunking':
          console.log('Processing with longContextChunking agent');
          // The correct order is: (transcript, progressCallback, apiKey)
          result = await processWithLongContextChunking(content, progress => updateAgentProgress(agentId, progress), apiKey);
          setLongContextResults(result);
          break;

        case 'needsAnalysis':
          console.log('Processing with needsAnalysis agent');
          // Process the Needs Analysis agent (first visible agent)
          result = await analyzeNeeds({ ...longContextResults, ...previousResults }, progress => updateAgentProgress(agentId, progress), apiKey);
          break;

        case 'demandAnalyst':
          console.log('Processing with demandAnalyst agent');
          // Process the Demand Analyst agent (second visible agent)
          result = await analyzeDemand({ ...longContextResults, ...previousResults }, progress => updateAgentProgress(agentId, progress), apiKey);
          console.log('📊 demandAnalyst returned result:', result ? 'Result exists' : 'No result');
          break;

        case 'opportunityQualification':
          console.log('Processing with opportunityQualification agent');
          // Process the Opportunity Qualification agent (third visible agent)
          result = await qualifyOpportunity({ ...longContextResults, ...previousResults }, progress => updateAgentProgress(agentId, progress), apiKey);
          break;

        case 'jtbd':
          // Update parameters to match function signature: (analysisResults, progressCallback, apiKey)
          result = await analyzeJTBDPrimaryGoal({ ...longContextResults, ...previousResults }, progress => updateAgentProgress(agentId, progress), apiKey);
          break;

        case 'jtbdGains':
          // Update parameters to match function signature: (analysisResults, progressCallback, apiKey)
          result = await analyzeJTBDGains({ ...longContextResults, ...previousResults }, progress => updateAgentProgress(agentId, progress), apiKey);
          break;

        case 'painExtractor':
          // Update parameters to match function signature: (analysisResults, progressCallback, apiKey)
          result = await analyzePainPoints({ ...longContextResults, ...previousResults }, progress => updateAgentProgress(agentId, progress), apiKey);
          break;

        case 'problemAwareness':
          // Update parameters to match function signature: (analysisResults, progressCallback, apiKey)
          result = await analyzeProblemAwareness({ ...longContextResults, ...previousResults }, progress => updateAgentProgress(agentId, progress), apiKey);
          break;

        case 'finalReport':
          console.log('Processing with finalReport agent');
          // The correct order is: (allResults, progressCallback, apiKey)
          result = await generateFinalReport({ ...longContextResults, ...previousResults }, progress => updateAgentProgress(agentId, progress), apiKey);
          break;

        default:
          throw new Error(`Unknown agent: ${agentId}`);
      }

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

      // Use the cleanupAgentState helper with a delay to ensure progress bar completes visually
      setTimeout(() => {
        cleanupAgentState(agentId);
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

    // Run the next agent
    await processWithAgent(nextAgentId, transcript, localAnalysisResults);

    // Only continue if we're still in sequence mode
    if (isSequenceRunning) {
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

  // Function to start the automatic analysis sequence
  const startAnalysisSequence = useCallback(async () => {
    if (!transcript) {
      toast.error('Please upload or enter a transcript before running analysis.');
      return;
    }

    // Reset everything first to ensure clean state
    setShowResult(null);
    setAnalyzingAgents(new Set());
    setLocalAnalysisResults({});
    setAgentProgress({});

    // Start the sequence
    setIsSequenceRunning(true);

    try {
      // FIRST STEP: Background Chunking with Grey Progress Bar
      console.log('Starting chunking process with grey progress bar');

      // Set the optimization status for the background chunking process
      // This will show a GREY progress bar on the first agent card
      setIsOptimizingTranscript(true);
      setOptimizationProgress(0);

      // Run the chunking agent in the background
      const result = await processWithLongContextChunking(
        transcript, 
        (progress) => {
          // Update the optimization progress as chunking happens
          setOptimizationProgress(progress);
        }, 
        apiKey
      );

      // Store the chunking results but keep them hidden
      setLongContextResults(result);

      // Add to analysis results but ENSURE these are never displayed to the user
      setLocalAnalysisResults({
        longContextChunking: result
      });

      // Important: NEVER set showResult to longContextChunking
      if (showResult === 'longContextChunking') {
        console.log('Preventing longContextChunking results from being displayed');
        setShowResult(null);
      }

      // Update optimization progress to 100% first
      setOptimizationProgress(100);

      // Update optimization progress to 100% first
      console.log('Setting optimization progress to 100% before transition');
      setOptimizationProgress(100);

      // Force a small delay to allow UI to update before switching progress bars
      console.log('Optimization complete, waiting before transition to analysis');
      await new Promise(resolve => setTimeout(resolve, 800));

      // Important: explicitly clear optimization state BEFORE starting analysis
      console.log('Explicitly clearing optimization state');
      setIsOptimizingTranscript(false);
      setOptimizationProgress(0);

      // Small delay to ensure state updates are processed
      await new Promise(resolve => setTimeout(resolve, 100));

      // SECOND STEP: Start the first visible agent (Needs Analysis)
      console.log('Starting needs analysis with green progress bar');

      // Run the first visible agent (needsAnalysis)
      // This will show a GREEN progress bar
      const needsAnalysisResult = await processWithAgent(
        'needsAnalysis', 
        transcript, 
        { longContextChunking: result }
      );

      // THIRD STEP: Continue with rest of the sequence
      console.log('Explicitly ensuring sequence continues running');
      // Force sequence running to true to ensure continuation
      setIsSequenceRunning(true);

      // Small delay to make sure state updates
      await new Promise(resolve => setTimeout(resolve, 50));

      console.log('Continuing with the rest of the agent sequence (next up: demandAnalyst)');
      
      // Explicitly start the Demand Analyst agent
      const demandAnalystResult = await processWithAgent(
        'demandAnalyst',
        transcript,
        { 
          longContextChunking: result,
          needsAnalysis: needsAnalysisResult
        }
      );
      
      // Continue with the rest of sequence
      await runNextAgentInSequence();

      // Explicitly ensure hasAnalyzed is set and results are shown
      console.log('Analysis sequence completed, explicitly setting final states');
      setHasAnalyzed(true);

      // Double check that a result is selected for viewing
      if ((showResult === null || showResult === 'longContextChunking') && !userHasSelectedView) {
        console.log('Selecting appropriate result to display');

        // NEVER show longContextChunking results, look for the most important result to show
        if (localAnalysisResults.opportunityQualification) {
          console.log('Setting showResult to opportunityQualification');
          setShowResult('opportunityQualification');
        } else if (localAnalysisResults.needsAnalysis) {
          console.log('Setting showResult to needsAnalysis');
          setShowResult('needsAnalysis');
        } else if (localAnalysisResults.demandAnalyst) {
          console.log('Setting showResult to demandAnalyst');
          setShowResult('demandAnalyst');
        } else {
          // Fallback to ensure we're never showing longContextChunking
          if (showResult === 'longContextChunking') {
            console.log('Preventing longContextChunking results from being displayed');
            setShowResult(null);
          }
        }
      }

      // Log debug information about the final state
      console.log('Final analysis state:', {
        hasAnalyzed: true,
        showResult,
        resultsAvailable: Object.keys(localAnalysisResults),
        analyzingAgentsSize: analyzingAgents.size
      });
    } catch (error) {
      console.error('Error during analysis sequence:', error);
      toast.error(`Error: ${error.message}`);

      // Reset all states on error
      setIsSequenceRunning(false);
      setIsOptimizingTranscript(false);
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
    // Clear localStorage
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

    // Clear all state
    setLocalAnalysisResults({});
    setAgentProgress({});
    setTranscript('');
    setAnalyzingAgents(new Set());
    setHasAnalyzed(false);
    setShowResult(null);
    setCurrentAgent(null);
    setIsSequenceRunning(false);
    setUserHasSelectedView(false);
  }, []);

  // Handle clearing data with toast notification
  const handleClearData = useCallback(() => {
    clearAllState();
    toast.success("All opportunity evaluation data has been reset.");
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
              <AnalysisResults 
                showResult={showResult}
                localAnalysisResults={localAnalysisResults}
                setShowResult={setShowResult}
                longContextResults={localAnalysisResults.longContextChunking}
                gainAnalysis={gainAnalysis}
                jtbdAnalysis={jtbdAnalysis}
                apiKey={apiKey}
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