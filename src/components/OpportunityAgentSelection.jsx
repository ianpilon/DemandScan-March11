import React from 'react';
import AgentCard from './AgentCard';
import { agents } from '../data/agents';

// Custom component for Opportunity Evaluation page
const OpportunityAgentSelection = ({
  agents: agentsList = agents,
  agentSequence = [],
  onRunAgent,
  onViewResult,
  selectedResult,
  disableRun = false,
  onViewResults,
  agentProgress = {},
  analyzingAgents = new Set(),
  localAnalysisResults = {},
  isDone,
  isOptimizingTranscript = false,
  optimizationProgress = 0
}) => {
  // Get the current agent in sequence
  const getCurrentAgent = () => {
    for (const agentId of agentSequence) {
      if (!isDone(agentId)) {
        return agentId;
      }
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {agentsList.map((agent, index) => {
        const isAnalyzing = analyzingAgents.has(agent.id);
        // Check both isDone function and directly in localAnalysisResults to ensure consistency
        // Use let instead of const so we can modify it if needed
        let hasResults = isDone(agent.id) || !!localAnalysisResults[agent.id];
        const progress = agentProgress[agent.id] || 0;
        const currentAgent = getCurrentAgent();

        // Debug output to track state for each agent card
        if (agent && agent.id && agent.name) {
          console.log(`📊 ${agent.name} card state - hasResults: ${hasResults}, isAnalyzing: ${isAnalyzing}, in localResults: ${!!localAnalysisResults?.[agent.id]}`);
          
          // CRITICAL: Force hasResults to be true if the agent exists in localAnalysisResults
          // This is a failsafe to ensure View Results button is always shown
          if (localAnalysisResults && agent.id in localAnalysisResults) {
            hasResults = true;
          }
        }

        // Show transcript optimization progress on the first visible agent card (Needs Analysis)
        // This creates the grey progress bar on the first card while chunking runs in background
        const showOptimizationOnThisCard = index === 0 && isOptimizingTranscript;

        return (
          <AgentCard
            key={agent.id}
            agent={agent}
            progress={progress}
            onViewResults={() => onViewResults(agent.id)}
            isComplete={hasResults}
            hasResults={hasResults}  // Pass both prop names for compatibility
            isAnalyzing={isAnalyzing || showOptimizationOnThisCard}
            isActive={currentAgent === agent.id}
            onRunAgent={() => onRunAgent(agent.id)}
            disableRun={disableRun}
            // Pass the optimization progress to the first agent card
            isOptimizingTranscript={showOptimizationOnThisCard}
            optimizationProgress={optimizationProgress}
          />
        );
      })}

      {/* We're now showing the optimization progress directly on the first agent card */}
    </div>
  );
};

export default OpportunityAgentSelection;