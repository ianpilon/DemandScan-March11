import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import useDragToScroll from '../hooks/useDragToScroll';
import { toast } from "sonner";
import { agents } from '../data/agents';
import FileUpload from '../components/FileUpload';
import AgentSelection from '../components/AgentSelection';
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
import { analyzeNeeds } from '../utils/needsAnalysisAgent';
import { analyzeDemand } from '../utils/demandAnalystAgent';
import { analyzeOpportunityQualification } from '../utils/opportunityQualificationAgent';
import { generateFinalReport } from '../utils/finalReportAgent';
import OpenAI from 'openai';



// Define the analysis sequence
const AGENT_SEQUENCE = [
  'jtbd',
  'jtbdGains',
  'painExtractor',
  'problemAwareness',
  'finalReport'
];

const CustomerProblemAnalyst = () => {
  const [transcript, setTranscript] = useLocalStorage('aiAnalysisTranscript', '');
  // Convert Set to Array for localStorage and back when using
  const [analyzingAgentsArray, setAnalyzingAgentsArray] = useLocalStorage('aiAnalysisAgents', []);
  const [analyzingAgents, setAnalyzingAgents] = useState(new Set(analyzingAgentsArray));
  const [hasAnalyzed, setHasAnalyzed] = useLocalStorage('aiAnalysisHasAnalyzed', false);
  const [localAnalysisResults, setLocalAnalysisResults] = useLocalStorage('analysisResults', {});
  const [agentProgress, setAgentProgress] = useLocalStorage('agentProgress', {});
  const [showResult, setShowResult] = useLocalStorage('aiAnalysisShowResult', null);
  // Flag to track if the user has actively selected a view
  const [userHasSelectedView, setUserHasSelectedView] = useLocalStorage('aiAnalysisUserSelectedView', false);
  const [apiKey] = useLocalStorage('llmApiKey', '');
  const agentListRef = useRef(null);
  const localResultsRef = useRef(localAnalysisResults);
  const [currentAgent, setCurrentAgent] = useLocalStorage('aiAnalysisCurrentAgent', null);
  const [isProcessing, setIsProcessing] = useLocalStorage('aiAnalysisIsProcessing', false);
  const [lastViewedResult, setLastViewedResult] = useLocalStorage('lastViewedResult', null);
  // Track the transcript optimization status separately
  const [isOptimizingTranscript, setIsOptimizingTranscript] = useLocalStorage('aiAnalysisIsOptimizing', false);
  const [optimizationProgress, setOptimizationProgress] = useLocalStorage('aiAnalysisOptimizationProgress', 0);
  
  // Track the current agent in the analysis sequence
  const [currentAnalysisIndex, setCurrentAnalysisIndex] = useLocalStorage('aiAnalysisCurrentIndex', 0);
  const [isSequenceRunning, setIsSequenceRunning] = useLocalStorage('aiAnalysisIsSequenceRunning', false);
  
  // Use refs to break circular dependencies
  const stateRef = useRef({
    analyzingAgents: new Set(),
    localAnalysisResults: {},
    isSequenceRunning: false,
    currentAnalysisIndex: 0
  });

  const hasData = useMemo(() => {
    return Boolean(transcript?.trim());
  }, [transcript]);

  // Sync analyzingAgents Set with localStorage array - with safeguard against infinite updates
  useEffect(() => {
    const currentArray = Array.from(analyzingAgents);
    const storedArray = JSON.parse(localStorage.getItem('aiAnalysisAgents') || '[]');
    
    // Only update if the arrays are different by comparing their string representations
    if (JSON.stringify(currentArray) !== JSON.stringify(storedArray)) {
      setAnalyzingAgentsArray(currentArray);
    }
  }, [analyzingAgents]);

  useEffect(() => {
    localResultsRef.current = localAnalysisResults;
    console.log('Updated localResultsRef:', localResultsRef.current);
  }, [localAnalysisResults]);

  useEffect(() => {
    console.log('State updated - localAnalysisResults:', localAnalysisResults);
    console.log('State updated - agentProgress:', agentProgress);
  }, [localAnalysisResults, agentProgress]);

  useEffect(() => {
    const storedApiKey = localStorage.getItem('llmApiKey');
    if (storedApiKey) {
      // setApiKey(storedApiKey);
    }
  }, []);

  useEffect(() => {
    // Debug state changes
    console.log('🔄 State Change Debug:', {
      analyzingAgents: Array.from(analyzingAgents),
      localAnalysisResults,
      agentProgress,
      currentAgent,
      hasData
    });
    
    // Verify localStorage state
    const storedResults = JSON.parse(localStorage.getItem('analysisResults') || '{}');
    const storedProgress = JSON.parse(localStorage.getItem('agentProgress') || '{}');
    
    console.log('📦 LocalStorage State:', {
      storedResults,
      storedProgress,
      matchesState: JSON.stringify(storedResults) === JSON.stringify(localAnalysisResults)
    });
    
    // Update ref to match current state
    localResultsRef.current = localAnalysisResults;
  }, [analyzingAgents, localAnalysisResults, agentProgress, currentAgent, hasData]);

  useEffect(() => {
    console.log('🔍 DEBUG - LocalStorage State:', {
      analysisResults: JSON.parse(localStorage.getItem('analysisResults') || '{}'),
      progress: JSON.parse(localStorage.getItem('agentProgress') || '{}'),
      apiKey: !!localStorage.getItem('llmApiKey')
    });
  }, [localAnalysisResults, agentProgress]);

  useEffect(() => {
    console.log('🔄 DEBUG - Component State:', {
      analyzingAgents: Array.from(analyzingAgents),
      showResult,
      currentAgent,
      hasData,
      hasAnalyzed,
      resultsKeys: Object.keys(localAnalysisResults)
    });
  }, [analyzingAgents, showResult, currentAgent, hasData, hasAnalyzed, localAnalysisResults]);

  const handleContentChange = useCallback((content) => {
    // Clear any previous analysis state when uploading new content
    setAnalyzingAgents(new Set());
    setAgentProgress({});
    setLocalAnalysisResults({});
    setCurrentAgent(null);
    setHasAnalyzed(false);
    setTranscript(content);
  }, []);

  /**
   * Handles the completion of an agent's analysis and updates the application state.
   * This function ensures atomic updates of both results and progress state.
   */
  // Forward declaration for handleRunAgent
  const handleRunAgentRef = useRef(null);
  
  const handleAnalysisComplete = useCallback(async (agentId, results) => {
    console.log(`🔄 handleAnalysisComplete called for ${agentId}`);
    const currentIndex = AGENT_SEQUENCE.indexOf(agentId);
    
    // Clear the current agent from analyzing state immediately
    setAnalyzingAgents(prev => {
      const next = new Set(prev);
      next.delete(agentId);
      return next;
    });

    console.log(`🔄 Analysis complete, sequence state:`, {
      agentId,
      currentIndex,
      isSequenceRunning,
      analyzingAgents: Array.from(analyzingAgents)
    });
    console.log(`✨ Analysis complete for ${agentId}:`, {
      hasResults: !!results,
      resultKeys: Object.keys(results || {})
    });
    
    try {
      // If this was the longContextChunking agent completing, clear the optimization status
      if (agentId === 'longContextChunking') {
        setIsOptimizingTranscript(false);
        setOptimizationProgress(0);
      }

      // Get latest state
      const latestStored = JSON.parse(localStorage.getItem('analysisResults') || '{}');
      
      // Create new results object
      const newResults = { ...latestStored };
      newResults[agentId] = results;
      
      // Also store the transcript for restoration
      newResults.transcript = transcript;
      
      // Update localStorage first
      localStorage.setItem('analysisResults', JSON.stringify(newResults));
      
      // Then update React state
      setLocalAnalysisResults(newResults);
      
      // Update progress
      const newProgress = { ...agentProgress };
      newProgress[agentId] = 100;
      
      // Update prerequisite chain progress
      const agent = agents.find(a => a.id === agentId);
      if (agent?.requiresPreviousAgent) {
        let currentAgent = agent;
        while (currentAgent?.requiresPreviousAgent) {
          const prerequisiteId = currentAgent.requiresPreviousAgent;
          newProgress[prerequisiteId] = 100;
          currentAgent = agents.find(a => a.id === prerequisiteId);
        }
      }
      
      // Update progress state
      localStorage.setItem('agentProgress', JSON.stringify(newProgress));
      setAgentProgress(newProgress);
      
      // Only show results if no result is currently being viewed AND user hasn't actively selected a view
      // This prevents disrupting the user's current view when agents complete in the background
      // Additionally, never show longContextChunking results
      if (showResult === null && !userHasSelectedView && agentId !== 'longContextChunking') {
        setShowResult(agentId);
      }
      
      // Verify state
      console.log('✅ Updated State:', {
        results: Object.keys(newResults),
        progress: newProgress,
        agent: agentId,
        isSequenceRunning,
        nextAgent: AGENT_SEQUENCE[AGENT_SEQUENCE.indexOf(agentId) + 1]
      });
      
      // Get agent name for logging
      const agentName = agents.find(a => a.id === agentId)?.name;
      console.log(`${agentName} has finished processing${isSequenceRunning ? ', continuing sequence...' : ''}`);

      // Always trigger the next agent in the sequence, regardless of isSequenceRunning state
      // This ensures the full sequence runs automatically
      const currentIndex = AGENT_SEQUENCE.indexOf(agentId);
      if (currentIndex >= 0) {
        const nextIndex = currentIndex + 1;
        if (nextIndex < AGENT_SEQUENCE.length) {
          console.log(`🚀 Triggering next agent in sequence:`, {
            current: agentId,
            next: AGENT_SEQUENCE[nextIndex],
            index: nextIndex,
            isSequenceRunning: stateRef.current.isSequenceRunning
          });
          const nextAgentId = AGENT_SEQUENCE[nextIndex];
          // Run next agent immediately
          setCurrentAnalysisIndex(nextIndex);
          // Use the ref to avoid stale closures
          if (handleRunAgentRef.current) {
            handleRunAgentRef.current(nextAgentId);
          }
        }
      } else {
        console.log(`⚠️ Agent ${agentId} not found in sequence, cannot advance`);
      }
      
    } catch (error) {
      console.error('Failed to update state:', error);
      toast.error("Failed to save analysis results. Please try again.");
      
      // Reset progress on error
      const newProgress = { ...agentProgress };
      newProgress[agentId] = 0;
      setAgentProgress(newProgress);
      localStorage.setItem('agentProgress', JSON.stringify(newProgress));
    }
  }, [setAnalyzingAgents, setLocalAnalysisResults, setAgentProgress, setCurrentAnalysisIndex, agents, agentProgress, toast]);

  const isDone = useCallback((agentId) => {
    const debugState = {
      agentId,
      hasDirectResults: !!localAnalysisResults[agentId],
      progress: agentProgress[agentId],
      allResults: { ...localAnalysisResults },
      allProgress: { ...agentProgress }
    };
    
    console.log(`🔍 isDone Check for ${agentId}:`, debugState);
    
    // Direct completion check
    if (localAnalysisResults[agentId]) {
      console.log(`✅ ${agentId} has direct results`);
      return true;
    }
    if (agentProgress[agentId] === 100) {
      console.log(`✅ ${agentId} has 100% progress`);
      return true;
    }
    
    // Check if any dependent agent is complete (backward inference)
    const dependentAgents = agents.filter(agent => agent.requiresPreviousAgent === agentId);
    console.log(`🔄 Checking dependent agents for ${agentId}:`, dependentAgents);
    
    const hasCompletedDependentAgent = dependentAgents.some(agent => {
      const isDependentAgent = agent.requiresPreviousAgent === agentId;
      const isComplete = localAnalysisResults[agent.id] || agentProgress[agent.id] === 100;
      
      console.log(`📋 Dependent agent check for ${agent.id}:`, {
        isDependentAgent,
        isComplete,
        hasResults: !!localAnalysisResults[agent.id],
        progress: agentProgress[agent.id]
      });
      
      return isDependentAgent && isComplete;
    });

    console.log(`${hasCompletedDependentAgent ? '✅' : '❌'} ${agentId} completion by dependent agents:`, hasCompletedDependentAgent);
    return hasCompletedDependentAgent;
  }, [localAnalysisResults, agentProgress, agents]);

  // Skip state verification during auto sequence
  const verifyStateBeforeRun = (agentId) => {
    console.log('🔍 Pre-run State Verification:', {
      agentId,
      isSequenceRunning: stateRef.current.isSequenceRunning,
      analyzingAgents: Array.from(analyzingAgents)
    });
    
    // Skip verification during automated sequence
    if (stateRef.current.isSequenceRunning) {
      console.log('✅ Skipping verification during automated sequence');
      return true;
    }
    
    // Only do strict verification for manual runs
    const storedResults = JSON.parse(localStorage.getItem('analysisResults') || '{}');
    if (JSON.stringify(storedResults) !== JSON.stringify(localAnalysisResults)) {
      console.warn('⚠️ State sync mismatch detected, forcing sync');
      setLocalAnalysisResults(storedResults);
      return false;
    }
    return true;
  };

  const handleRunAgent = useCallback(async (agentId) => {
    console.log(`🚀 handleRunAgent called for ${agentId}`);
    
    // Store the function in ref for use by other callbacks
    handleRunAgentRef.current = handleRunAgent;
    
    // Skip verification during automated sequence or do simplified verification
    if (stateRef.current.isSequenceRunning || verifyStateBeforeRun(agentId)) {
      // Continue with agent execution
    } else {
      console.error('State verification failed, will not retry to avoid loops');
      return;
    }

    console.log('handleRunAgent called for:', agentId);
    console.log('Current transcript:', transcript?.substring(0, 100) + '...');
    console.log('API Key exists:', !!apiKey);
    console.log('Current analyzing agents:', Array.from(analyzingAgents));
    console.log('Current analysis results:', localAnalysisResults);
    
    if (!transcript?.trim()) {
      console.warn('No transcript available');
      toast.error("Please provide a transcript to analyze");
      return;
    }

    const storedApiKey = localStorage.getItem('llmApiKey');
    if (!storedApiKey) {
      console.warn('No API key available');
      toast.error("Please set your OpenAI API key in Settings");
      return;
    }

    if (analyzingAgents.has(agentId)) {
      console.warn(`Agent ${agentId} is already running`);
      return;
    }

    try {
      const agent = agents.find(a => a.id === agentId);
      if (!agent) {
        throw new Error(`Agent ${agentId} not found`);
      }

      // Enhanced prerequisite checking using the latest results from both sources
      if (agent.requiresPreviousAgent) {
        // Try to get latest results from multiple sources to avoid stale data
        const storedResults = JSON.parse(localStorage.getItem('analysisResults') || '{}');
        const prerequisiteResults = 
          // First check stateRef (most up-to-date)
          stateRef.current.localAnalysisResults[agent.requiresPreviousAgent] || 
          // Then check localStorage (persisted state)
          storedResults[agent.requiresPreviousAgent] || 
          // Finally check component state (might be stale in closures)
          localAnalysisResults[agent.requiresPreviousAgent];
          
        const prerequisiteAgent = agents.find(a => a.id === agent.requiresPreviousAgent);
        
        console.log(`Checking prerequisites for ${agentId}:`, {
          prerequisiteAgent: prerequisiteAgent?.id,
          hasPrerequisiteResults: !!prerequisiteResults,
          // Debug info about where results might be found
          inStateRef: !!stateRef.current.localAnalysisResults[agent.requiresPreviousAgent],
          inLocalStorage: !!storedResults[agent.requiresPreviousAgent],
          inComponentState: !!localAnalysisResults[agent.requiresPreviousAgent]
        });
        
        if (!prerequisiteResults) {
          const error = new Error(`Missing required analysis from ${prerequisiteAgent?.name}`);
          error.code = 'MISSING_PREREQUISITE';
          throw error;
        }
      }

      // Only check for running agents if not in sequence mode
      if (!isSequenceRunning && analyzingAgents.size > 0) {
        const error = new Error("Another analysis is currently in progress");
        error.code = 'AGENT_RUNNING';
        throw error;
      }

      console.log('Starting analysis for agent:', agentId);
      setAnalyzingAgents(prev => new Set(prev).add(agentId));
      setCurrentAgent(agentId);
      
      setAgentProgress(prev => ({
        ...prev,
        [agentId]: 0
      }));

      let results;
      const updateProgress = (progress) => {
        console.log(`Progress update for ${agentId}:`, progress);
        
        // Update the regular agent progress
        setAgentProgress(prev => ({
          ...prev,
          [agentId]: progress
        }));
      };

      switch (agentId) {
        case 'longContextChunking':
          console.log('Long Context Chunking is bypassed in this version');
          // Simulate progress updates to show the green progress bar
          updateProgress(10);
          await new Promise(resolve => setTimeout(resolve, 300));
          updateProgress(30);
          await new Promise(resolve => setTimeout(resolve, 300));
          updateProgress(60);
          await new Promise(resolve => setTimeout(resolve, 300));
          updateProgress(90);
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Return a minimal result structure to satisfy any dependencies
          results = {
            finalSummary: transcript
          };
          
          // Complete with 100% progress
          updateProgress(100);
          break;

        case 'jtbd':
          // Use the transcript directly for JTBD analysis
          console.log('Starting JTBD Primary Goal analysis directly with transcript...');
          
          if (!transcript) {
            console.error('Missing transcript for JTBD analysis');
            throw new Error('Transcript is required for JTBD analysis');
          }
          
          console.log('✅ Using raw transcript for JTBD analysis:', { 
            transcriptLength: transcript.length
          });
          
          // Initial progress update to show the green progress bar
          updateProgress(5);
          
          // Make sure analyzingAgents includes this agent
          setAnalyzingAgents(prev => new Set(prev).add(agentId));
          
          results = await analyzeJTBDPrimaryGoal(
            transcript,
            updateProgress,
            storedApiKey
          );
          break;

        case 'jtbdGains':
          // Get the most up-to-date JTBD results from all possible sources
          const gainsStoredResults = JSON.parse(localStorage.getItem('analysisResults') || '{}');
          
          // Initial progress update to show the green progress bar
          updateProgress(5);
          
          // Make sure analyzingAgents includes this agent
          setAnalyzingAgents(prev => new Set(prev).add(agentId));
          
          // Get JTBD results from all sources
          const jtbdResults = 
            stateRef.current.localAnalysisResults.jtbd || 
            gainsStoredResults.jtbd || 
            localAnalysisResults.jtbd;
          
          // Verify we have the prerequisite
          if (!jtbdResults) {
            console.error('Missing prerequisite for JTBD Gains:', {
              hasJTBD: {
                inStateRef: !!stateRef.current.localAnalysisResults.jtbd,
                inLocalStorage: !!gainsStoredResults.jtbd,
                inComponentState: !!localAnalysisResults.jtbd
              }
            });
            throw new Error('JTBD Primary Goal results required for Gains Analysis');
          }
          
          console.log('✅ Found prerequisite for JTBD Gains analysis');
          
          // Prepare input with transcript and JTBD results
          const gainsInput = {
            transcript: transcript,
            jtbdResults: jtbdResults
          };

          console.log('Structured input for JTBD Gains analysis:', { 
            transcriptLength: transcript.length,
            hasJtbdResults: !!jtbdResults
          });
          
          try {
            results = await analyzeJTBDGains(
              gainsInput,
              updateProgress,
              storedApiKey
            );
          } catch (error) {
            console.error('JTBD Gains Analysis failed:', error);
            toast.error(error.message || "Error in JTBD Gains Analysis");
            setAgentProgress(prev => ({ ...prev, [agentId]: 0 }));
            throw error;
          }
          break;

        case 'painExtractor':
          // Get the most up-to-date results from all possible sources
          const painStoredResults = JSON.parse(localStorage.getItem('analysisResults') || '{}');
          
          // Get JTBD Gains results from all sources - this is the only prerequisite we need
          const gainsResults = 
            stateRef.current.localAnalysisResults.jtbdGains || 
            painStoredResults.jtbdGains || 
            localAnalysisResults.jtbdGains;
          
          // Set initial progress update
          setAgentProgress(prev => ({
            ...prev,
            [agentId]: 5
          }));
          
          // Verify we have the prerequisite
          if (!gainsResults) {
            console.error('Missing prerequisite for Pain Analysis:', {
              hasGains: {
                inStateRef: !!stateRef.current.localAnalysisResults.jtbdGains,
                inLocalStorage: !!painStoredResults.jtbdGains,
                inComponentState: !!localAnalysisResults.jtbdGains
              }
            });
            throw new Error('JTBD Gains Analysis results required for Pain Analysis');
          }
          
          console.log('✅ Found all prerequisites for Pain Analysis');
          
          try {
            // Create input with transcript and gains results
            const painInput = {
              transcript: transcript,
              gainsAnalysis: gainsResults
            };
            
            console.log('Starting Pain Analysis with transcript and gains results');
            
            results = await analyzePainPoints(
              painInput,
              updateProgress,
              storedApiKey
            );
          } catch (error) {
            console.error('Pain Analysis failed:', error);
            toast.error(error.message || "Pain Analysis failed");
            setAgentProgress(prev => ({ ...prev, [agentId]: 0 }));
            throw error;
          }
          break;

        case 'problemAwareness':
          // Get pain results from all sources
          const problemAwarenessStoredResults = JSON.parse(localStorage.getItem('analysisResults') || '{}');
          
          // Get Pain Analysis results from all sources
          const painResults = 
            stateRef.current.localAnalysisResults.painExtractor || 
            problemAwarenessStoredResults.painExtractor || 
            localAnalysisResults.painExtractor;
          
          // Set initial progress update
          setAgentProgress(prev => ({
            ...prev,
            [agentId]: 5
          }));
          
          // Verify we have the prerequisite
          if (!painResults) {
            console.error('Missing prerequisite for Problem Awareness Analysis:', {
              hasPainResults: {
                inStateRef: !!stateRef.current.localAnalysisResults.painExtractor,
                inLocalStorage: !!problemAwarenessStoredResults.painExtractor,
                inComponentState: !!localAnalysisResults.painExtractor
              }
            });
            throw new Error('Pain Analysis results required for Problem Awareness Analysis');
          }
          
          console.log('✅ Found pain results for Problem Awareness analysis');
          
          // Create input with transcript and pain results
          const problemInput = {
            transcript: transcript,
            painAnalysis: painResults
          };
          
          console.log('Starting Problem Awareness Analysis with transcript and pain results');
          
          results = await analyzeProblemAwareness(
            problemInput,
            updateProgress,
            storedApiKey
          );
          break;

        case 'needsAnalysis':
          console.log('Starting Needs Analysis directly with transcript...');
          
          // Verify we have a transcript
          if (!transcript) {
            console.error('Missing transcript for Needs Analysis');
            throw new Error('Transcript is required for Needs Analysis');
          }
          
          console.log('✅ Using raw transcript for Needs Analysis:', { 
            transcriptLength: transcript.length
          });
          
          // Initial progress update to show the green progress bar
          updateProgress(5);
          
          // Create input with transcript
          const needsInputData = {
            transcript: transcript
          };
          
          try {
            // Make sure analyzingAgents includes this agent
            setAnalyzingAgents(prev => new Set(prev).add(agentId));
            
            // Run needs analysis with proper error handling
            results = await analyzeNeeds(
              needsInputData,
              updateProgress,
              storedApiKey
            );
          } catch (error) {
            console.error('Needs Analysis failed:', error);
            toast.error(error.message || "Needs Analysis failed");
            // Reset progress on error
            setAgentProgress(prev => ({ ...prev, [agentId]: 0 }));
            throw error;
          }
          break;

        case 'demandAnalyst':
          try {
            // Get the most up-to-date results from all possible sources
            const demandStoredResults = JSON.parse(localStorage.getItem('analysisResults') || '{}');
            
            // Get chunker results from all sources
            const demandChunkerResults = 
              stateRef.current.localAnalysisResults.longContextChunking || 
              demandStoredResults.longContextChunking || 
              localAnalysisResults.longContextChunking;
              
            // Get needs analysis results from all sources (optional)
            const needsResults = 
              stateRef.current.localAnalysisResults.needsAnalysis || 
              demandStoredResults.needsAnalysis || 
              localAnalysisResults.needsAnalysis;
            
            console.log('🎯 Starting Demand Analysis:', {
              state: {
                hasChunking: {
                  inStateRef: !!stateRef.current.localAnalysisResults.longContextChunking,
                  inLocalStorage: !!demandStoredResults.longContextChunking,
                  inComponentState: !!localAnalysisResults.longContextChunking
                },
                hasNeeds: needsResults ? true : false,
                analyzingAgents: Array.from(analyzingAgents)
              }
            });

            // Validate prerequisites are available
            if (!demandChunkerResults) {
              console.error('❌ Missing prerequisites for Demand Analysis');
              throw new Error('Required prerequisite is missing. Please run Long Context Chunking first.');
            }
          
            console.log('✅ Found all prerequisites for Demand Analysis');
            
            // Add debug info about the available data
            if (needsResults) {
              console.log('📊 Additional needs data available:', {
                hasImmediate: !!needsResults?.immediateNeeds,
                hasLatent: !!needsResults?.latentNeeds,
                immediateCount: needsResults?.immediateNeeds?.length,
                latentCount: needsResults?.latentNeeds?.length
              });
            }
          
            // Attempt demand analysis
            try {
              results = await analyzeDemand(
                demandChunkerResults,
                updateProgress,
                storedApiKey
              );
              
              console.log('✅ DEBUG - Demand Analysis succeeded:', {
                demandLevel: results.demandLevel,
                confidenceScore: results.confidenceScore,
                hasAnalysis: !!results.analysis
              });
              
            } catch (error) {
              console.error('❌ DEBUG - Demand Analysis failed:', {
                error: {
                  message: error.message,
                  stack: error.stack
                },
                inputStructure: {
                  hasChunking: !!chunkingResults.finalSummary,
                  summaryLength: chunkingResults.finalSummary?.length
                }
              });
              
              toast.error(`${error.message}. Please try running the analysis again.`);
              
              setAgentProgress(prev => ({ ...prev, [agentId]: 0 }));
              throw error;
            }
          } catch (error) {
            console.error('❌ DEBUG - Demand Analysis preparation failed:', {
              error: {
                message: error.message,
                stack: error.stack
              },
              state: {
                localResults: Object.keys(localAnalysisResults),
                currentAgent,
                progress: agentProgress[agentId]
              }
            });
            
            toast.error(error.message);
            setAgentProgress(prev => ({ ...prev, [agentId]: 0 }));
            throw error;
          }
          break;

        case 'opportunityQualification':
          // Get the most up-to-date results from all possible sources
          const oppStoredResults = JSON.parse(localStorage.getItem('analysisResults') || '{}');
          
          // Get chunker results from all sources
          const oppChunkerResults = 
            stateRef.current.localAnalysisResults.longContextChunking || 
            oppStoredResults.longContextChunking || 
            localAnalysisResults.longContextChunking;
            
          // Create a consolidated results object with the latest data
          const oppInputResults = {
            ...localAnalysisResults,  // Base results
            longContextChunking: oppChunkerResults  // Latest chunking results
          };
            
          // Verify prerequisites
          if (!oppChunkerResults) {
            console.error('Missing prerequisites for Opportunity Qualification:', {
              hasChunking: {
                inStateRef: !!stateRef.current.localAnalysisResults.longContextChunking,
                inLocalStorage: !!oppStoredResults.longContextChunking,
                inComponentState: !!localAnalysisResults.longContextChunking
              }
            });
            throw new Error('Long Context Chunking results required');
          }
          
          console.log('✅ Found all prerequisites for Opportunity Qualification');
          
          results = await analyzeOpportunityQualification(
            oppInputResults,
            updateProgress,
            storedApiKey
          );
          break;

        case 'finalReport':
          // Get the most up-to-date results from all possible sources
          const finalStoredResults = JSON.parse(localStorage.getItem('analysisResults') || '{}');
          
          // Create a consolidated object with the most up-to-date results from all sources
          const finalInputResults = {
            ...localAnalysisResults,  // Base results
            
            // Include the transcript which is required for the final report
            transcript: transcript,
            
            // Override with the most up-to-date versions of each result
            longContextChunking: 
              stateRef.current.localAnalysisResults.longContextChunking || 
              finalStoredResults.longContextChunking || 
              localAnalysisResults.longContextChunking,
              
            jtbd: 
              stateRef.current.localAnalysisResults.jtbd || 
              finalStoredResults.jtbd || 
              localAnalysisResults.jtbd,
              
            jtbdGains: 
              stateRef.current.localAnalysisResults.jtbdGains || 
              finalStoredResults.jtbdGains || 
              localAnalysisResults.jtbdGains,
              
            painExtractor: 
              stateRef.current.localAnalysisResults.painExtractor || 
              finalStoredResults.painExtractor || 
              localAnalysisResults.painExtractor,
              
            problemAwareness: 
              stateRef.current.localAnalysisResults.problemAwareness || 
              finalStoredResults.problemAwareness || 
              localAnalysisResults.problemAwareness

          };
          
          // Verify that we have the transcript and at least some analysis results
          if (!finalInputResults.transcript || 
              (!finalInputResults.jtbdGains && !finalInputResults.painExtractor && !finalInputResults.problemAwareness)) {
            console.error('Missing prerequisites for Final Report:', {
              hasTranscript: !!finalInputResults.transcript,
              hasGainsAnalysis: !!finalInputResults.jtbdGains,
              hasPainAnalysis: !!finalInputResults.painExtractor,
              hasProblemAwareness: !!finalInputResults.problemAwareness
            });
            throw new Error('Previous analysis results required');
          }
          
          console.log('✅ Generating Final Report with all available analyses');
          
          results = await generateFinalReport(
            finalInputResults,
            updateProgress,
            storedApiKey
          );
          break;

        default:
          throw new Error(`Unknown agent: ${agentId}`);
      }

      // Handle successful completion
      await handleAnalysisComplete(agentId, results);
      console.log(`Analysis completed successfully for ${agentId}`);

    } catch (error) {
      console.error(`Error running agent ${agentId}:`, error);
      
      // Clear analyzing state
      setAnalyzingAgents(prev => {
        const next = new Set(prev);
        next.delete(agentId);
        return next;
      });
      
      // Reset progress
      setAgentProgress(prev => ({
        ...prev,
        [agentId]: 0
      }));
      
      // Show appropriate error message
      let errorMessage = "An unexpected error occurred";
      if (error.code === 'MISSING_PREREQUISITE') {
        errorMessage = error.message;
      } else if (error.code === 'AGENT_RUNNING') {
        errorMessage = "Please wait for the current analysis to complete";
      } else {
        errorMessage = error.message || "Failed to run analysis";
      }
      
      toast.error(errorMessage);
    }
  }, [transcript, apiKey, analyzingAgents, localAnalysisResults, handleAnalysisComplete]);

  const clearAllState = useCallback(() => {
    // Clear localStorage
    localStorage.removeItem('analysisResults');
    localStorage.removeItem('agentProgress');
    localStorage.removeItem('lastViewedResult');
    localStorage.removeItem('aiAnalysisTranscript');
    localStorage.removeItem('aiAnalysisAgents');
    localStorage.removeItem('aiAnalysisHasAnalyzed');
    localStorage.removeItem('aiAnalysisShowResult');
    localStorage.removeItem('aiAnalysisUserSelectedView');
    localStorage.removeItem('aiAnalysisCurrentAgent');
    localStorage.removeItem('aiAnalysisIsProcessing');
    localStorage.removeItem('aiAnalysisIsOptimizing');
    localStorage.removeItem('aiAnalysisOptimizationProgress');
    localStorage.removeItem('aiAnalysisCurrentIndex');
    localStorage.removeItem('aiAnalysisIsSequenceRunning');
    
    // Clear all state
    setLocalAnalysisResults({});
    setAgentProgress({});
    setTranscript('');
    setAnalyzingAgents(new Set());
    setHasAnalyzed(false);
    setShowResult(null);
    setCurrentAgent(null);
    setIsProcessing(false);
    setLastViewedResult(null);
    setUserHasSelectedView(false);
    
    // Clear ref
    if (localResultsRef.current) {
      localResultsRef.current = {};
    }
  }, [setLastViewedResult]);

  const handleClearData = useCallback(() => {
    clearAllState();
    toast.success("All analysis data has been reset.");
  }, [clearAllState, toast]);

  // Update ref values when state changes
  useEffect(() => {
    stateRef.current.analyzingAgents = analyzingAgents;
    stateRef.current.localAnalysisResults = localAnalysisResults;
    stateRef.current.isSequenceRunning = isSequenceRunning;
    stateRef.current.currentAnalysisIndex = currentAnalysisIndex;
  }, [analyzingAgents, localAnalysisResults, isSequenceRunning, currentAnalysisIndex]);
  
  // State restoration effect - runs once on component mount
  useEffect(() => {
    // Check if we have any completed analyses in localStorage
    const storedResults = JSON.parse(localStorage.getItem('analysisResults') || '{}');
    const completedAnalyses = Object.keys(storedResults).filter(key => key !== 'transcript');
    
    console.log('🔄 Checking for stored analysis data:', {
      hasStoredResults: completedAnalyses.length > 0,
      availableAnalyses: completedAnalyses
    });
    
    if (completedAnalyses.length > 0) {
      console.log('🔄 Restoring analysis state from localStorage');
      
      // Set hasAnalyzed to true if we have any completed analyses
      setHasAnalyzed(true);
      
      // Determine which result to show
      let resultToShow = null;
      
      // Filter out longContextChunking from our considerations
      // If we have a last viewed result and it exists in our stored results and it's not longContextChunking, use that
      if (lastViewedResult && lastViewedResult !== 'longContextChunking' && storedResults[lastViewedResult]) {
        resultToShow = lastViewedResult;
        console.log(`✅ Restoring last viewed result: ${lastViewedResult}`);
      } else {
        // Otherwise show the last completed analysis in the sequence (excluding longContextChunking)
        const validAgents = completedAnalyses.filter(id => 
          AGENT_SEQUENCE.includes(id) && id !== 'longContextChunking'
        );
        
        if (validAgents.length > 0) {
          // Find the agent furthest along in the sequence
          const lastCompletedIndex = Math.max(...validAgents.map(id => AGENT_SEQUENCE.indexOf(id)));
          const lastCompletedAgent = AGENT_SEQUENCE[lastCompletedIndex];
          resultToShow = lastCompletedAgent;
          setLastViewedResult(lastCompletedAgent);
          console.log(`✅ Showing last completed analysis: ${lastCompletedAgent}`);
        } else if (completedAnalyses.filter(id => id !== 'longContextChunking').length > 0) {
          // As a fallback, just use the first available analysis that's not longContextChunking
          const visibleCompletedAnalyses = completedAnalyses.filter(id => id !== 'longContextChunking');
          resultToShow = visibleCompletedAnalyses[0];
          console.log(`✅ Showing available analysis: ${resultToShow}`);
        }
      }
      
      // Always set the showResult if we found a result to show
      if (resultToShow) {
        setShowResult(resultToShow);
        // If we're restoring the last viewed result the user selected, mark it as user-selected
        if (resultToShow === lastViewedResult) {
          setUserHasSelectedView(true);
        }
        console.log(`💾 Setting showResult to ${resultToShow}`);
      }
      
      // Restore transcript if available
      if (storedResults.transcript) {
        setTranscript(storedResults.transcript);
        console.log('✅ Restored transcript from storage');
      }
    }
  }, [lastViewedResult, setLastViewedResult]);
  

  // Effect to handle sequence completion
  useEffect(() => {
    if (!isSequenceRunning || !transcript || !apiKey) return;

    const currentAgentId = AGENT_SEQUENCE[currentAnalysisIndex];
    if (!currentAgentId) {
      console.log('✅ Sequence complete');
      setIsSequenceRunning(false);
      setHasAnalyzed(true);
      console.log("Analysis sequence completed!");
      
      // Only show the final result if the user isn't already viewing something AND hasn't actively selected a view
      // Skip showing longContextChunking results
      if (showResult === null && !userHasSelectedView) {
        const visibleAgents = AGENT_SEQUENCE.filter(id => id !== 'longContextChunking');
        const lastVisibleAgentId = visibleAgents[visibleAgents.length - 1];
        setShowResult(lastVisibleAgentId);
      }
    }
  }, [isSequenceRunning, currentAnalysisIndex, transcript, apiKey, showResult]);

  const handleAnalyze = useCallback(async () => {
    if (!transcript) {
      toast.error("Please enter a transcript or upload a file.");
      return;
    }

    if (!apiKey) {
      toast.error("Please set your OpenAI API key in the settings page.");
      return;
    }

    console.log('🎬 Starting analysis sequence');
    
    // Clear all state before starting new analysis
    clearAllState();
    
    // Initialize sequence
    setCurrentAnalysisIndex(0);
    // Set isSequenceRunning to true to ensure all agents run in sequence
    setIsSequenceRunning(true);
    
    // Reset the user's view selection flag since we're starting a fresh analysis
    setUserHasSelectedView(false);
    
    // Set initial progress for the first agent to show the progress bar immediately
    const firstAgent = AGENT_SEQUENCE[0];
    setAgentProgress(prev => ({
      ...prev,
      [firstAgent]: 5
    }));
    
    // Add the first agent to the analyzing agents set
    setAnalyzingAgents(new Set([firstAgent]));
    
    // Start with first agent
    try {
      console.log('🚀 Starting first agent:', firstAgent);
      await handleRunAgent(firstAgent);
    } catch (error) {
      console.error('Failed to start analysis sequence:', error);
      setIsSequenceRunning(false);
      toast.error(error.message || "Failed to start analysis");
    }
  }, [transcript, apiKey, clearAllState, handleRunAgent]);

  // Create a ref for the results container to control scrolling
  const resultsContainerRef = useRef(null);
  const agentCardsRef = useDragToScroll();

  const handleViewResults = useCallback((agentId) => {
    setShowResult(agentId);
    setLastViewedResult(agentId);  // Save last viewed result
    setUserHasSelectedView(true);  // Mark that user has actively selected this view
    
    // Reset scroll position to top when changing results
    if (resultsContainerRef.current) {
      resultsContainerRef.current.scrollTop = 0;
    }
  }, []);

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="w-full bg-[#FAFAFA] p-4 border-b">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Customer Problem Analyst</h1>
          <Button 
              onClick={handleClearData} 
              variant="outline" 
              className="bg-white text-red-600 hover:bg-red-50 border-red-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Reset Analysis
            </Button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex flex-grow overflow-hidden">
        <div className="w-1/3 p-4 overflow-y-auto" ref={agentCardsRef}>
          <AgentSelection
            onViewResults={handleViewResults}
            agentProgress={agentProgress}
            analyzingAgents={analyzingAgents}
            localAnalysisResults={localAnalysisResults}
            isDone={isDone}
            isOptimizingTranscript={isOptimizingTranscript}
            optimizationProgress={optimizationProgress}
          />
        </div>
        <div className="w-2/3 p-4 overflow-y-auto" ref={resultsContainerRef}>
          <Card className="p-6">
            {showResult && hasAnalyzed ? (
              <AnalysisResults 
                showResult={showResult}
                localAnalysisResults={localAnalysisResults}
                setShowResult={setShowResult}
                longContextResults={localAnalysisResults.longContextChunking}
                gainAnalysis={localAnalysisResults.gainExtractor}
                jtbdAnalysis={localAnalysisResults.jtbdAnalysis}
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
                    onClick={handleAnalyze}
                    disabled={!hasData || analyzingAgents.size > 0}
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

export default CustomerProblemAnalyst;