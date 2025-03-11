# Jobs To Be Done Needs Analysis Agent

## Overview
The Needs Analysis agent is an expert system designed to analyze interview transcripts and identify both immediate and latent customer needs. It employs sophisticated natural language processing to uncover both explicit and implicit needs, providing detailed analysis with supporting evidence.

## Analysis Framework

### Core Components
1. Immediate Needs Analysis
2. Latent Needs Detection
3. Evidence Collection
4. Confidence Scoring
5. Pattern Recognition

### Dependencies
- OpenAI GPT-4 model
- Requires chunked interview transcripts
- Progress tracking system
- Input validation framework

## Technical Implementation

### Model Configuration
- Uses GPT-4 model
- Temperature: 0.7
- Max tokens: 2500
- Structured JSON output format
- Comprehensive error handling

### Progress Tracking
- 10%: Initial validation
- 30%: Content preparation
- 50%: Analysis initiation
- 80%: Response processing
- 100%: Results validation

### Error Handling
- API key validation
- Input structure validation
- Response parsing validation
- Required fields verification
- Detailed error logging

## Complete System Prompt
```
You are an expert needs analysis agent. Your task is to analyze interview transcripts to identify both immediate and latent needs.

Focus on identifying:
1. Immediate needs - current, pressing needs that the customer is actively aware of
2. Latent needs - underlying or future needs that the customer may not be fully aware of yet

For each need identified, provide:
- Clear description of the need
- Supporting evidence from the transcript
- For immediate needs: urgency level (Critical, High, Medium, Low)
- For latent needs: confidence score (0-100) and rationale

Format your response in the following JSON structure:

{
  "immediateNeeds": [
    {
      "need": "string",
      "urgency": "Critical" | "High" | "Medium" | "Low",
      "context": "string",
      "evidence": "string"
    }
  ],
  "latentNeeds": [
    {
      "need": "string",
      "confidence": number,
      "rationale": "string",
      "evidence": "string"
    }
  ],
  "insights": "string (optional additional insights or patterns noticed)"
}

Guidelines for analysis:
1. Be specific and actionable in need descriptions
2. Use direct quotes or specific examples as evidence
3. Consider both explicit statements and implicit indicators
4. Look for patterns and recurring themes
5. Consider both functional and emotional needs
```

## Analysis Process

### Input Processing
1. Validates API key presence
2. Checks analysis results structure
3. Extracts final summary from long context chunking
4. Logs initial state for debugging

### Analysis Pipeline
1. Immediate Needs Analysis
   - Identifies current, pressing needs
   - Assesses urgency levels
   - Collects supporting evidence
   - Provides contextual information

2. Latent Needs Detection
   - Uncovers underlying needs
   - Calculates confidence scores
   - Documents rationale
   - Links to supporting evidence

3. Results Compilation
   - Validates response structure
   - Ensures required fields presence
   - Formats clean output
   - Provides additional insights

### Key Features
- Distinguishes between immediate and latent needs
- Provides urgency levels for immediate needs
- Includes confidence scores for latent needs
- Supports findings with direct evidence
- Considers both functional and emotional aspects
- Identifies patterns and recurring themes
