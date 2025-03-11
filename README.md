# Customer Problem Analyst

A sophisticated AI-powered tool for analyzing customer interview transcripts using the Jobs-to-be-Done (JTBD) framework and advanced demand analysis techniques.

## 🎯 Overview

The Customer Problem Analyst is a web application that helps product managers, researchers, and business analysts extract meaningful insights from customer interview transcripts. It uses a chain of specialized AI agents to analyze different aspects of customer conversations, including:

- Jobs to be Done (JTBD) Analysis
- Customer Needs Assessment
- Demand Level Analysis
- Problem Awareness Evaluation
- Opportunity Qualification

## ✨ Key Features

### 1. Multi-Agent Analysis Pipeline
- **Long Context Chunking**: Processes long interview transcripts efficiently
- **JTBD Analysis**: Identifies primary goals and desired outcomes
- **Gains & Pains Analysis**: Extracts customer gains and pain points
- **Problem Awareness Matrix**: Evaluates customer's understanding of their problems
- **Needs Analysis**: Identifies immediate and latent needs
- **Demand Analysis**: Determines customer's position in the buying cycle
- **Opportunity Qualification**: Assesses business opportunities

### 2. Smart Processing
- Efficient handling of long transcripts
- Caching system for API responses
- Rate limiting for API calls
- Progress tracking for batch processing

### 3. Modern UI
- Clean, intuitive interface
- Real-time progress tracking
- Interactive results visualization
- Responsive design

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ianpilon/Customer-Problem-Analyst-Agent.git
cd Customer-Problem-Analyst-Agent
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Once the app is running, go to the Settings page to enter your OpenAI API key. The app handles API key management through the UI and securely stores it in your browser's localStorage.

## 💡 Usage

1. **Upload Transcript**: Paste your interview transcript or upload a file
2. **Run Analysis**: Click through the agent cards to run different types of analysis
3. **View Results**: Each agent provides detailed results in an easy-to-understand format
4. **Export Reports**: Save and export analysis results for further use

## 🛠️ Technical Stack

- **Frontend**: React, Vite, TailwindCSS
- **UI Components**: Shadcn/ui
- **API Integration**: OpenAI GPT-4
- **State Management**: React Hooks + Local Storage
- **Testing**: Jest

## 🔒 Security

- OpenAI API keys are managed through the UI's Settings page and stored in your browser's localStorage
- Built-in rate limiting system prevents API abuse and manages costs
- Intelligent caching system reduces API calls and improves performance
- No server-side storage of API keys - everything is managed client-side

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with OpenAI's technology, utilizing:
  - GPT-4 for complex analysis (Demand Analysis, JTBD Primary Goals, Needs Analysis, Final Reports)
  - GPT-3.5-16k for efficient processing of long-form content
- UI components from Shadcn/ui
- Icons from Lucide React
