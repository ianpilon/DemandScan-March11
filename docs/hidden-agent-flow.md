# DemandScan Hidden Agent Flow Documentation

## Overview of the Transcript Analysis Flow

When a user clicks the "Analyze Transcript" button in the DemandScan application, a series of agent analyses are triggered in sequence. The first agent in this sequence is hidden from the user interface by design but plays a crucial role in preparing the data for all subsequent analyses.

## The Hidden First Agent: longContextChunking

The `longContextChunking` agent is the first to run when analysis is initiated. This agent isn't visible in the UI results but serves as the foundation for all subsequent analysis.

### What longContextChunking Does:

1. **Transcript Processing and Chunking**
   - Breaks down the transcript into manageable conversation-aware chunks with smart speaker context preservation
   - Uses a token estimation algorithm to ensure chunks stay within model context limits
   - Maintains conversation flow by preserving speaker context across chunks

2. **Multi-Stage Processing Pipeline**:
   - **First pass**: Summarizes individual chunks using GPT-3.5-Turbo-16k
   - **Second pass**: Combines chunk summaries into coherent section summaries
   - **Final pass**: Creates an overall document summary that captures key insights

3. **Creates Structured Data Output**: 
   - Original chunks (with speaker context)
   - Individual chunk summaries
   - Section summaries
   - Final document summary
   - Processing metadata (chunk count, timestamp, model used)

### Code Implementation

The agent is implemented in `src/utils/longContextChunkingAgent.js` with several key functions:

- `splitIntoConversationChunks()`: Divides transcript while preserving conversation context
- `summarizeChunk()`: Creates individual chunk summaries
- `summarizeSections()`: Combines chunk summaries into section summaries
- `summarizeDocument()`: Creates the final summary
- `processWithLongContextChunking()`: Main function that orchestrates the entire process

## The Complete Analysis Sequence

The application follows a predefined analysis sequence defined in `CustomerProblemAnalyst.jsx`:

```javascript
const AGENT_SEQUENCE = [
  'longContextChunking',
  'jtbd',
  'jtbdGains',
  'painExtractor',
  'problemAwareness',
  'finalReport'
];
```

### What Happens After longContextChunking Completes:

1. The application automatically proceeds to the next agent in the sequence: `jtbd` (Jobs To Be Done Primary Goal analysis)

2. Each subsequent agent builds upon the data provided by previous agents:
   - `jtbd`: Analyzes primary goals using the chunked and summarized transcript
   - `jtbdGains`: Examines gains based on primary goals and transcript chunks
   - `painExtractor`: Identifies pain points using gains analysis and transcript chunks
   - `problemAwareness`: Maps customer awareness levels
   - `finalReport`: Synthesizes all previous analyses into a comprehensive report

3. The UI shows loading states for each visible agent as they're processed, but deliberately hides the `longContextChunking` step from the final results view

## Technical Design Considerations

1. **Progress Tracking**: Each agent reports progress percentage that updates the UI

2. **State Management**: Results are stored in localStorage to persist between sessions

3. **Error Handling**: Each agent has robust error handling to prevent cascading failures

4. **Dependency Chain**: Agents validate that prerequisite analyses exist before proceeding

5. **Performance Optimization**: The chunking approach allows processing of large transcripts that would exceed normal context limits

This architecture allows the application to handle large transcripts efficiently by preprocessing them into a format that subsequent analysis agents can work with effectively, without overwhelming the user with technical details about the preprocessing step.
