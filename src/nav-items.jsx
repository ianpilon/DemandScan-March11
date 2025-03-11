import { FileTextIcon, LightbulbIcon, CheckSquareIcon, SettingsIcon, SearchIcon } from "lucide-react";
import AIAgentAnalysis from "./pages/AIAgentAnalysis.jsx";
import ProblemHypothesis from "./pages/ProblemHypothesis.jsx";
import GradeTranscripts from "./pages/GradeTranscripts.jsx";
import Settings from "./pages/Settings.jsx";
import OpportunityEvaluation from "./pages/OpportunityEvaluation.jsx";

export const navItems = [
  {
    title: "Customer Problem Analyst",
    to: "/ai-agent-analysis",
    icon: <FileTextIcon className="h-4 w-4" />,
    page: <AIAgentAnalysis />,
  },
  {
    title: "Opportunity Evaluation",
    to: "/opportunity-evaluation",
    icon: <SearchIcon className="h-4 w-4" />,
    page: <OpportunityEvaluation />,
  },
  {
    title: "Assumptions & Hypothesis",
    to: "/problem-hypothesis",
    icon: <LightbulbIcon className="h-4 w-4" />,
    page: <ProblemHypothesis />,
  },
  {
    title: "Grade Transcripts",
    to: "/grade-transcripts",
    icon: <CheckSquareIcon className="h-4 w-4" />,
    page: <GradeTranscripts />,
  },
  {
    title: "Settings",
    to: "/settings",
    icon: <SettingsIcon className="h-4 w-4" />,
    page: <Settings />,
  },
];