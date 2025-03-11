import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import VerticalNavigation from "./components/VerticalNavigation";
import { useState } from "react";
import AIAgentAnalysis from "./pages/AIAgentAnalysis";
import ProblemHypothesis from "./pages/ProblemHypothesis";
import GradeTranscripts from "./pages/GradeTranscripts";
import Settings from "./pages/Settings";
import OpportunityEvaluation from "./pages/OpportunityEvaluation";

const queryClient = new QueryClient();

const App = () => {
  const [analysisResults, setAnalysisResults] = useState({});

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <div className="flex h-screen overflow-hidden bg-[#FAFAFA]">
            <VerticalNavigation />
            <div className="flex-1 overflow-auto">
              <Routes>
                <Route path="/" element={<Navigate to="/ai-agent-analysis" replace />} />
                <Route 
                  path="/ai-agent-analysis" 
                  element={
                    <AIAgentAnalysis 
                      setAnalysisResults={setAnalysisResults}
                    />
                  } 
                />
                <Route path="/opportunity-evaluation" element={<OpportunityEvaluation />} />
                <Route path="/problem-hypothesis" element={<ProblemHypothesis />} />
                <Route path="/grade-transcripts" element={<GradeTranscripts />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </div>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;