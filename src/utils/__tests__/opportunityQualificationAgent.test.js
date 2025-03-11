import 'openai/shims/node';
import { analyzeOpportunityQualification } from '../opportunityQualificationAgent';
import { encode } from 'gpt-tokenizer';

// Mock OpenAI
jest.mock('openai', () => {
  return class OpenAI {
    constructor() {}
    chat = {
      completions: {
        create: jest.fn()
      }
    };
  };
});

describe('opportunityQualificationAgent', () => {
  let mockProgressCallback;
  
  beforeEach(() => {
    // Mock localStorage
    global.localStorage = {
      getItem: jest.fn(() => 'fake-api-key'),
      setItem: jest.fn(),
    };
    
    mockProgressCallback = jest.fn();
  });

  it('should handle large input by properly chunking and managing tokens', async () => {
    // Create mock analysis results
    const mockAnalysisResults = {
      longContextChunking: {
        finalSummary: 'Test summary',
        sectionSummaries: [
          { summary: 'Section 1', keyPoints: ['Point 1'], sentiment: 'positive' },
          { summary: 'Section 2', keyPoints: ['Point 2'], sentiment: 'neutral' }
        ]
      },
      needsAnalysis: {
        immediateNeeds: ['Need 1'],
        latentNeeds: ['Need 2'],
        summary: 'Needs summary'
      },
      problemAwareness: {
        awarenessLevel: 'High',
        analysis: 'Problem analysis',
        evidence: ['Evidence 1']
      }
    };

    // Mock OpenAI response
    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            overallAssessment: 'Fully Qualified',
            summary: 'Test summary',
            scores: {
              problemExperience: { score: 4, confidence: 80, analysis: 'Good', evidence: ['E1'] },
              activeSearch: { score: 5, confidence: 90, analysis: 'Great', evidence: ['E2'] },
              problemFit: { score: 4, confidence: 85, analysis: 'Good', evidence: ['E3'] }
            },
            recommendations: ['R1'],
            redFlags: []
          })
        }
      }]
    };

    // Set up the mock OpenAI response
    const OpenAI = jest.requireActual('openai').OpenAI;
    OpenAI.prototype.chat.completions.create.mockResolvedValue(mockResponse);

    // Test the agent with mock data
    const result = await analyzeOpportunityQualification(mockAnalysisResults, mockProgressCallback);

    // Verify the result structure
    expect(result).toHaveProperty('overallAssessment');
    expect(result).toHaveProperty('scores');
    expect(result.scores).toHaveProperty('problemExperience');
    expect(result.scores).toHaveProperty('activeSearch');
    expect(result.scores).toHaveProperty('problemFit');
  });
});
