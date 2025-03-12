import { FileTextIcon, LightbulbIcon, CheckSquareIcon, SettingsIcon, SearchIcon } from "lucide-react";
import CustomerProblemAnalyst from "./pages/CustomerProblemAnalyst.jsx";
import Settings from "./pages/Settings.jsx";

export const navItems = [
  {
    title: "Customer Problem Analyst",
    to: "/ai-agent-analysis",
    icon: <FileTextIcon className="h-4 w-4" />,
    page: <CustomerProblemAnalyst />,
  },
  {
    title: "Settings",
    to: "/settings",
    icon: <SettingsIcon className="h-4 w-4" />,
    page: <Settings />,
  },
];