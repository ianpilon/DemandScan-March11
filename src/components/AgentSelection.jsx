import React from 'react';
import AgentCard from './AgentCard';
import { agents } from '../data/agents';

// Define the strict sequence of agents
const AGENT_SEQUENCE = [
  'jtbd',
  'jtbdGains',
  'painExtractor',
  'problemAwareness',
  'finalReport'
];

const AgentSelection = ({
  onViewResults,
  agentProgress = {},
  analyzingAgents = new Set(),
  localAnalysisResults = {},
  isDone,
  // New props for transcript optimization status
  isOptimizingTranscript = false,
  optimizationProgress = 0
}) => {
  // Get the current agent in sequence
  const getCurrentAgent = () => {
    for (const agentId of AGENT_SEQUENCE) {
      if (!isDone(agentId)) {
        return agentId;
      }
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {agents.filter(agent => !['longContextChunking', 'needsAnalysis', 'demandAnalyst', 'opportunityQualification'].includes(agent.id)).map((agent) => {
        // Check if this agent is currently being analyzed
        const isAnalyzing = analyzingAgents.has(agent.id);
        const hasResults = isDone(agent.id);
        const progress = agentProgress[agent.id] || 0;
        // Get the current agent in sequence for highlighting purposes
        const currentAgent = getCurrentAgent();

        return (
          <AgentCard
            key={agent.id}
            agent={agent}
            progress={progress}
            onViewResults={() => onViewResults(agent.id)}
            isAnalyzing={isAnalyzing || (agent.id === 'jtbd' && analyzingAgents.size > 0)}
            hasResults={hasResults}
            // Pass optimization status only to the JTBD card when longContextChunking is running
            isOptimizingTranscript={agent.id === 'jtbd' && isOptimizingTranscript}
            optimizationProgress={optimizationProgress}
          />
        );
      })}
    </div>
  );
};

export default AgentSelection;