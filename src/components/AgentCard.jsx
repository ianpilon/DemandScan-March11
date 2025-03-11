import React, { useEffect, useRef } from 'react';
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const AgentCard = ({ 
  agent, 
  progress = 0, 
  onViewResults,
  isAnalyzing = false,
  hasResults = false,
  isComplete,  // Add this prop with no default
  className = '',
  // New prop to show when transcript optimization is in progress
  isOptimizingTranscript = false,
  optimizationProgress = 0
}) => {
  // For tracking state changes
  const prevIsAnalyzing = useRef(isAnalyzing);
  const prevIsOptimizing = useRef(isOptimizingTranscript);
  const prevProgress = useRef(progress);
  const prevOptProgress = useRef(optimizationProgress);
  
  // Log meaningful state changes to help debugging
  useEffect(() => {
    // Log when analysis starts or stops
    if (prevIsAnalyzing.current !== isAnalyzing) {
      console.log(`AgentCard ${agent.id}: isAnalyzing changed ${prevIsAnalyzing.current} -> ${isAnalyzing}`);
      prevIsAnalyzing.current = isAnalyzing;
    }
    
    // Log when optimization starts or stops
    if (prevIsOptimizing.current !== isOptimizingTranscript) {
      console.log(`AgentCard ${agent.id}: isOptimizingTranscript changed ${prevIsOptimizing.current} -> ${isOptimizingTranscript}`);
      prevIsOptimizing.current = isOptimizingTranscript;
    }
    
    // Log when progress reaches 100%
    if (prevProgress.current !== progress && progress === 100) {
      console.log(`AgentCard ${agent.id}: Progress reached 100%`);
    }
    prevProgress.current = progress;
    
    // Log when optimization progress reaches 100%
    if (prevOptProgress.current !== optimizationProgress && optimizationProgress === 100) {
      console.log(`AgentCard ${agent.id}: Optimization progress reached 100%`);
    }
    prevOptProgress.current = optimizationProgress;
  }, [agent.id, isAnalyzing, isOptimizingTranscript, progress, optimizationProgress]);
  
  const getStatusBadge = () => {
    // First priority: Show grey optimization progress
    if (isOptimizingTranscript) {
      console.log('Showing grey progress bar:', optimizationProgress);
      return (
        <Badge 
          variant="outline" 
          className="text-gray-500 border-transparent bg-transparent flex items-center gap-1 pr-2 pl-1"
        >
          <Loader2 className="h-3 w-3 animate-spin" />
          <span className="mr-2">Optimizing transcript</span>
          <div className="flex-grow h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gray-400" 
              style={{ width: `${optimizationProgress}%` }}
            />
          </div>
        </Badge>
      );
    }
    
    // Second priority: Show green analysis progress bar
    // ALWAYS show when agent is analyzing, even if progress isn't available
    // Use a default progress value of 50% if no specific progress is provided
    if (isAnalyzing && !isOptimizingTranscript) {
      // Ensure we have a valid progress value (default to 50% if not provided or invalid)
      const validProgress = (progress > 0 && progress <= 100) ? progress : 50;
      console.log(`Showing green progress bar for ${agent.name}: ${validProgress}%`);
      return (
        <Badge 
          variant="outline" 
          className="text-green-600 border-transparent bg-transparent flex items-center gap-1 pr-2 pl-1"
        >
          <Loader2 className="h-3 w-3 animate-spin" />
          <span className="mr-2">Analysis in progress</span>
          <div className="flex-grow h-2 bg-green-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500" 
              style={{ width: `${validProgress}%` }}
            />
          </div>
        </Badge>
      );
    }
    
    // No badge shown for completed or waiting agents
    return null;
  };

  const getActionButton = () => {
    // Check hasResults first (for AI Agent Analysis), then fall back to isComplete if provided
    if (hasResults || (isComplete === true)) {  // Explicitly check for boolean true
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={onViewResults}
          className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 hover:border-blue-300"
        >
          View Results
        </Button>
      );
    }
    return null;
  };

  return (
    <Card className={`flex flex-col p-4 ${className}`}>
      <div className="flex-grow">
        <CardTitle className="text-lg font-semibold">{agent.name}</CardTitle>
        <CardDescription className="text-sm text-gray-500 mt-1">
          {agent.description}
        </CardDescription>
      </div>

      <div className="mt-4 flex justify-between items-center min-h-[24px]">
        <div className="flex-grow">
          {getStatusBadge()}
        </div>
        <div className="ml-4 flex-shrink-0">
          {getActionButton()}
        </div>
      </div>
    </Card>
  );
};

export default AgentCard;