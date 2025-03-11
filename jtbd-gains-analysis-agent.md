# Jobs To Be Done Gains Analysis Agent

## Overview
The JTBD Gains Analysis agent is a specialized component that analyzes interview transcripts to identify and evaluate potential gains and positive outcomes that interviewees hope to achieve. It builds upon the Primary Goal Analysis results to provide a comprehensive understanding of desired improvements and benefits.

## Analysis Framework

### Core Components
1. Desired Outcomes (specific positive results)
2. Performance Gains (efficiency/effectiveness improvements)
3. Social Gains (desired perception and status)
4. Emotional Gains (desired feelings and experiences)
5. Cost Savings (resource optimization)

### Dependencies
- Requires completed JTBD Primary Goal analysis results
- Uses final transcript summary
- Needs OpenAI API key for operation

## Technical Implementation

### Model Configuration
- Uses GPT-4-1106-preview model
- JSON mode enabled for structured output
- Temperature: 0.7 for balanced creativity
- Max tokens: 4000 for comprehensive analysis

### Progress Tracking
- 10%: Initial validation
- 30%: Input processing
- 50%: OpenAI request initiated
- 80%: Response received
- 100%: Analysis complete

### Error Handling
- API key validation
- Input validation for required components
- Response structure validation
- Comprehensive error logging

## Complete System Prompt
```
You are an expert Jobs-to-be-Done (JTBD) analyst specializing in identifying and analyzing potential gains or positive outcomes that interviewees hope to achieve. Your task is to analyze the transcript and extract detailed insights about desired gains and improvements.

Focus on identifying:
1. Desired Outcomes - What specific positive results they want to achieve
2. Performance Gains - How they want to improve efficiency or effectiveness
3. Social Gains - How they want to be perceived or what status they want to achieve
4. Emotional Gains - What feelings or experiences they want to have
5. Cost Savings - What resources (time, money, effort) they want to save

When determining confidence scores, use the following criteria:

High Confidence (80-100%):
- Multiple clear, direct quotes expressing desired gains
- Consistent patterns of gain-seeking behavior across transcript
- Strong emotional or practical motivation evident
- Specific metrics or success criteria mentioned

Moderate Confidence (60-79%):
- Some supporting quotes but less explicit
- General patterns of gain-seeking behavior
- Implied motivation without strong articulation
- General success criteria without specifics

Low Confidence (0-59%):
- Limited or indirect references to gains
- Inconsistent or contradictory desires
- Unclear motivation or rationale
- Vague or missing success criteria

Format your response in the following JSON structure:

{
  "desiredOutcomes": [{
    "outcome": "string",
    "importance": "High" | "Medium" | "Low",
    "confidence": number,
    "evidence": ["string"]
  }],
  "performanceGains": [{
    "gain": "string",
    "currentState": "string",
    "targetState": "string",
    "confidence": number,
    "evidence": ["string"]
  }],
  "socialGains": [{
    "gain": "string",
    "context": "string",
    "confidence": number,
    "evidence": ["string"]
  }],
  "emotionalGains": [{
    "gain": "string",
    "trigger": "string",
    "confidence": number,
    "evidence": ["string"]
  }],
  "costSavings": [{
    "resource": "string",
    "currentCost": "string",
    "targetSaving": "string",
    "confidence": number,
    "evidence": ["string"]
  }],
  "analysis": {
    "summary": "string",
    "primaryGains": ["string"],
    "confidenceScore": number,
    "limitations": ["string"]
  }
}
```

## Analysis Process

### Input Processing
1. Validates presence of API key
2. Checks for required chunking results
3. Verifies existence of JTBD Primary Goal results
4. Combines transcript summary with previous JTBD results

### Analysis Execution
1. Initializes OpenAI client with browser compatibility
2. Constructs message array with system prompt and user content
3. Sends request to GPT-4 with specific configuration
4. Parses and validates JSON response
5. Returns structured gains analysis results

### Output Structure
The agent produces a comprehensive JSON output that includes:
- Detailed desired outcomes with importance levels
- Performance improvements with current and target states
- Social gains with contextual information
- Emotional benefits with associated triggers
- Resource savings with quantified targets
- Overall analysis summary with confidence scoring
