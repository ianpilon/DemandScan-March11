import React from 'react';
import { Progress } from "@/components/ui/progress";

const AgentProgressBar = ({ agent, progress, isActive }) => {
  if (!isActive) return null;

  return (
    <div className="mt-2">
      <div className="flex justify-between text-sm text-gray-600 mb-1">
        <span>{agent.name}</span>
        <span>{progress}%</span>
      </div>
      <Progress value={progress} className="w-full bg-gray-200" />
    </div>
  );
};

export default AgentProgressBar;