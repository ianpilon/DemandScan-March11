# Jobs To Be Done Opportunity Qualification Agent

## Overview
The Opportunity Qualification agent is an expert system designed to evaluate opportunities based on three key dimensions: Problem Experience, Active Search, and Problem Fit. It analyzes interview data and previous analyses to provide comprehensive qualification assessments with evidence-based scoring.

## Analysis Framework

### Core Components
1. Problem Experience Evaluation
2. Active Search Assessment
3. Problem Fit Analysis
4. Token Management
5. Hierarchical Context Processing

### Dependencies
- OpenAI GPT-4 Turbo Preview model
- GPT Tokenizer
- Previous analysis results
- Progress tracking system
- Local storage for API key

## Technical Implementation

### Model Configuration
- Uses GPT-4-turbo-preview model
- Temperature: 0.7
- Max tokens: 2000
- Token limit: 6000
- Structured JSON output format

### Progress Tracking
- 10%: Initial validation
- 30%: Context preparation
- 50%: Analysis initiation
- 90%: Result validation
- 100%: Completion

### Error Handling
- API key validation
- Input structure validation
- Token limit verification
- JSON parsing validation
- Detailed error logging

## Complete System Prompt
```
You are an expert Opportunity Qualification Analyst. Analyze the provided interview data and previous analyses to evaluate qualification based on Problem Experience, Active Search, and Problem Fit.

You have access to:
1. The complete conversation summary and section summaries
2. Previous analyses of needs and problem awareness

Use all available context to make a comprehensive qualification assessment.

Output your analysis in JSON format:
{
  "overallAssessment": "Fully Qualified" | "Partially Qualified" | "Not Qualified",
  "summary": "string",
  "scores": {
    "problemExperience": {
      "score": number (1-5),
      "confidence": number (0-100),
      "analysis": "string",
      "evidence": ["string"]
    },
    "activeSearch": {
      "score": number (1-5),
      "confidence": number (0-100),
      "analysis": "string",
      "evidence": ["string"]
    },
    "problemFit": {
      "score": number (1-5),
      "confidence": number (0-100),
      "analysis": "string",
      "evidence": ["string"]
    }
  },
  "recommendations": ["string"],
  "redFlags": ["string"]
}
```

## Analysis Process

### Input Processing
1. Token Management
   - Counts tokens in messages
   - Ensures token limits
   - Logs token usage details
   - Handles token optimization

2. Context Preparation
   - Extracts conversation context
   - Processes section summaries
   - Integrates needs analysis
   - Incorporates problem awareness

3. Analysis Structure
   - Validates input structure
   - Organizes hierarchical context
   - Prepares analysis input
   - Formats messages for API

### Analysis Pipeline
1. Problem Experience Analysis
   - Evaluates understanding level
   - Assesses past experiences
   - Scores confidence level
   - Collects supporting evidence

2. Active Search Evaluation
   - Analyzes search behavior
   - Measures engagement level
   - Determines search intensity
   - Documents search evidence

3. Problem Fit Assessment
   - Evaluates solution alignment
   - Measures problem-solution fit
   - Calculates fit score
   - Provides fit evidence

4. Results Compilation
   - Determines overall qualification
   - Generates recommendations
   - Identifies red flags
   - Validates result structure

### Key Features
- Three-dimensional qualification scoring
- Evidence-based assessment
- Confidence scoring system
- Token usage optimization
- Comprehensive logging
- Hierarchical context analysis
- Detailed recommendations
