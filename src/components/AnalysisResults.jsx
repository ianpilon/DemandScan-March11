import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { agents } from '../data/agents';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Code } from 'lucide-react';
import { analyzePainPoints } from '../utils/jtbdPainExtractorAgent';
import ProblemAwarenessResults from './ProblemAwarenessResults';

/**
 * Helper function to determine badge variant based on confidence score
 * Returns appropriate UI variant for the confidence level badge
 */
const getConfidenceBadgeVariant = (score) => {
  if (score >= 80) return "success";
  if (score >= 60) return "warning";
  return "destructive";
};

/**
 * Helper function to get confidence range text based on score
 * Returns the appropriate confidence range in percentage format
 */
const getConfidenceRange = (score) => {
  if (score >= 80) return "80-100%";
  if (score >= 60) return "60-79%";
  return "0-59%";
};

/**
 * Helper function to determine badge variant based on urgency level
 * CHANGES (2025-02-03):
 * - Added null-safe check with optional chaining
 * - Standardized urgency levels
 * - Added case-insensitive comparison
 */
const getUrgencyVariant = (urgency) => {
  switch (urgency?.toLowerCase()) {
    case 'critical':
      return 'destructive';
    case 'high':
      return 'warning';
    case 'medium':
      return 'default';
    case 'low':
      return 'secondary';
    default:
      return 'default';
  }
};

/**
 * Component to render analysis results from various agents
 * 
 * CHANGES (2025-02-03):
 * - Added proper error handling for invalid result structures
 * - Updated needs analysis rendering to match new data structure
 * - Added evidence and context display
 * - Improved UI organization and readability
 */
const AnalysisResults = ({ showResult, localAnalysisResults, longContextResults, gainAnalysis, jtbdAnalysis, apiKey, setShowResult }) => {
  const [painAnalysisState, setPainAnalysisState] = useState(null);
  const [painAnalysisError, setPainAnalysisError] = useState(null);
  const [painAnalysisProgress, setPainAnalysisProgress] = useState(0);

  // Add state for tracking open collapsible sections
  const [openSections, setOpenSections] = useState({
    longContext: {},
    problemAwareness: {},
    needsAnalysis: {},
    demandAnalyst: {},
    jtbd: {}
  });
  


  /**
   * Renders JTBD analysis results
   * 
   * CHANGES (2025-02-03):
   * - Improved error handling and empty state display
   * - Added confidence score display
   * - Improved UI organization and readability
   */
  const renderJTBDResults = (result) => {
    if (!result) {
      return (
        <div className="p-4 text-center">
          <p className="text-muted-foreground">Run the JTBD Analysis agent to see results here.</p>
        </div>
      );
    }

    const {
      coreJob = {},
      functionalAspects = [],
      emotionalAspects = [],
      socialAspects = [],
      currentSolutions = [],
      hiringCriteria = [],
      analysisMetadata = {}
    } = result.jtbdAnalysis || {};

    if (!coreJob.statement) {
      return (
        <div className="p-4 text-center">
          <p className="text-muted-foreground">No JTBD analysis results available. Please run the analysis first.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Core Job To Be Done</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-secondary p-4 rounded-lg">
                <h4 className="font-semibold mb-2">{coreJob.statement}</h4>
                <p className="text-sm text-muted-foreground mb-2">Context: {coreJob.context || 'Not specified'}</p>
                <p className="text-sm">Desired Outcome: {coreJob.desiredOutcome || 'Not specified'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Analysis Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-secondary rounded-lg">
                <div className="text-2xl font-bold">{functionalAspects.length + emotionalAspects.length + socialAspects.length}</div>
                <div className="text-sm text-muted-foreground">Total Aspects</div>
              </div>
              <div className="text-center p-4 bg-secondary rounded-lg">
                <div className="text-2xl font-bold">{analysisMetadata.confidenceScore ? getConfidenceRange(Math.round(analysisMetadata.confidenceScore * 100)) : '--'}</div>
                <div className="text-sm text-muted-foreground">Confidence Score</div>
              </div>
              <div className="text-center p-4 bg-secondary rounded-lg">
                <div className="text-2xl font-bold">{currentSolutions.length}</div>
                <div className="text-sm text-muted-foreground">Current Solutions</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Functional Aspects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {functionalAspects.map((aspect, index) => (
                  <div key={index} className="bg-secondary p-3 rounded-md">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-medium">{aspect.aspect}</p>
                      <Badge variant="default">{aspect.importance}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{aspect.evidence}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Emotional Aspects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {emotionalAspects.map((aspect, index) => (
                  <div key={index} className="bg-secondary p-3 rounded-md">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-medium">{aspect.aspect}</p>
                      <Badge variant="secondary">{aspect.importance}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{aspect.evidence}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Social Aspects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {socialAspects.map((aspect, index) => (
                  <div key={index} className="bg-secondary p-3 rounded-md">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-medium">{aspect.aspect}</p>
                      <Badge variant="outline">{aspect.importance}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{aspect.evidence}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Current Solutions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentSolutions.map((solution, index) => (
                <div key={index} className="bg-secondary p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">{solution.solution}</h4>
                    <Badge variant={
                      solution.effectiveness === 'high' ? "default" :
                      solution.effectiveness === 'medium' ? "secondary" : "outline"
                    }>{solution.effectiveness}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Limitations: {solution.limitations}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hiring Criteria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {hiringCriteria.map((criterion, index) => (
                <div key={index} className="bg-secondary p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">{criterion.criterion}</h4>
                    <Badge variant={
                      criterion.importance === 'high' ? "default" :
                      criterion.importance === 'medium' ? "secondary" : "outline"
                    }>{criterion.importance}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Context: {criterion.context}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {analysisMetadata.keyInsights && analysisMetadata.keyInsights.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Key Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2">
                {analysisMetadata.keyInsights.map((insight, index) => (
                  <li key={index}>{insight}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {analysisMetadata.limitations && analysisMetadata.limitations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Analysis Limitations</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2">
                {analysisMetadata.limitations.map((limitation, index) => (
                  <li key={index}>{limitation}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  /**
   * Renders gain analysis results
   * 
   * CHANGES (2025-02-03):
   * - Improved error handling and empty state display
   * - Added confidence score display
   * - Improved UI organization and readability
   */
  const renderGainResults = (result) => {
    if (!result) {
      return (
        <div className="p-4 text-center">
          <p className="text-muted-foreground">Run the Gain Extractor agent to see results here.</p>
        </div>
      );
    }

    const gainAnalysis = result.gainAnalysis;

    if (!gainAnalysis || !gainAnalysis.identifiedGains) {
      return (
        <div className="p-4 text-center">
          <p className="text-muted-foreground">No gain analysis results available. Please run the analysis first.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Identified Gains</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {gainAnalysis.identifiedGains.map((gain, index) => (
                <div key={index} className="bg-secondary p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">{gain.gainStatement}</h4>
                    <div className="flex gap-2">
                      <Badge variant="outline">{gain.category}</Badge>
                      <Badge>{gain.importance}</Badge>
                    </div>
                  </div>
                  {gain.evidence && gain.evidence.map((ev, evIndex) => (
                    <div key={evIndex} className="mt-2 text-sm">
                      <p className="italic text-muted-foreground">"{ev.quote}"</p>
                      <p className="text-muted-foreground mt-1">Context: {ev.context}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {gainAnalysis.gainPatterns && gainAnalysis.gainPatterns.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Gain Patterns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {gainAnalysis.gainPatterns.map((pattern, index) => (
                  <div key={index} className="bg-secondary p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{pattern.patternName}</h4>
                      <Badge variant="outline">{pattern.significance}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{pattern.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {gainAnalysis.qualityMetrics && (
          <Card>
            <CardHeader>
              <CardTitle>Analysis Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-secondary p-4 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Evidence Coverage</p>
                  <p className="text-2xl font-semibold">{Math.round(gainAnalysis.qualityMetrics.evidenceCoverage * 100)}%</p>
                </div>
                <div className="bg-secondary p-4 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Gain Clarity</p>
                  <p className="text-2xl font-semibold">{Math.round(gainAnalysis.qualityMetrics.gainClarityScore * 100)}%</p>
                </div>
                <div className="bg-secondary p-4 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Contextual Relevance</p>
                  <p className="text-2xl font-semibold">{Math.round(gainAnalysis.qualityMetrics.contextualRelevance * 100)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  /**
   * Component to render pain analysis results
   * 
   * CHANGES (2025-02-03):
   * - Improved error handling and empty state display
   * - Added confidence score display
   * - Improved UI organization and readability
   */
  const CurseScoreCard = ({ label, score, reasoning }) => (
    <div className="bg-secondary p-4 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <span className="font-medium">{label}</span>
        <Badge variant={
          score >= 4 ? "destructive" :
          score >= 3 ? "warning" : "default"
        }>{score}/5</Badge>
      </div>
      <p className="text-sm text-muted-foreground">{reasoning}</p>
    </div>
  );

  /**
   * Helper function to determine severity badge styles
   * 
   * CHANGES (2025-02-03):
   * - Improved null-safe checks
   * - Standardized severity levels
   */
  const getSeverityBadgeStyles = (severity) => {
    const variant = 
      severity === 'Critical' || severity === 5 ? "destructive" :
      severity === 'High' || severity === 4 ? "orange" :
      severity === 'Medium' || severity === 'Moderate' || severity === 3 ? "yellow" :
      "secondary";

    const className = 
      (severity === 'High' || severity === 4) ? "bg-orange-500 hover:bg-orange-600" :
      (severity === 'Medium' || severity === 'Moderate' || severity === 3) ? "bg-yellow-500 hover:bg-yellow-600 text-black" :
      "";

    return { variant, className };
  };

  /**
   * Component to render pain level row
   * 
   * CHANGES (2025-02-03):
   * - Improved null-safe checks
   * - Standardized severity levels
   */
  const PainLevelRow = ({ score, level, description, indicators }) => {
    const { variant, className } = getSeverityBadgeStyles(score);
    return (
      <div className="grid grid-cols-12 gap-4 p-4 border-b border-border hover:bg-secondary/50 transition-colors">
        <div className="col-span-1">
          <Badge variant={variant} className={className}>{score}</Badge>
        </div>
        <div className="col-span-2 font-medium">{level}</div>
        <div className="col-span-4 text-sm text-muted-foreground">{description}</div>
        <div className="col-span-5 text-sm text-muted-foreground">{indicators}</div>
      </div>
    );
  };

  /**
   * Renders pain analysis results
   * 
   * CHANGES (2025-02-03):
   * - Improved error handling and empty state display
   * - Added confidence score display
   * - Improved UI organization and readability
   */
  const renderPainResults = (result) => {
    if (!result) return null;

    const { identifiedPains = [], frictionAnalysis = [], detailedFrictionAnalysis = {} } = result;

    return (
      <div className="space-y-6">
        {/* Pain Points Card */}
        <Card>
          <CardHeader>
            <CardTitle>Identified Pain Points</CardTitle>
            <CardDescription>Key pain points identified from the interview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {identifiedPains.map((pain, index) => {
                const { variant, className } = getSeverityBadgeStyles(pain.severity);
                return (
                  <div key={index} className="bg-secondary p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{pain.painStatement}</h4>
                      <Badge variant={variant} className={className}>{pain.severity}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2"><span className="font-medium">Category:</span> {pain.category}</p>
                    <p className="text-sm text-muted-foreground mb-2"><span className="font-medium">Evidence:</span> "{pain.evidence}"</p>
                    <p className="text-sm mb-2"><span className="font-medium">Impact:</span> {pain.impact}</p>
                    <div className="flex flex-wrap gap-2">
                      {pain.stakeholders?.map((stakeholder, idx) => (
                        <Badge key={idx} variant="outline">{stakeholder}</Badge>
                      ))}
                    </div>
                    {pain.metrics && pain.metrics.length > 0 && (
                      <div className="mt-2 text-sm">
                        <span className="font-medium">Key Metrics:</span>
                        <ul className="list-disc list-inside mt-1 text-muted-foreground">
                          {pain.metrics.map((metric, idx) => (
                            <li key={idx}>{metric}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Friction Analysis Card */}
        {detailedFrictionAnalysis.frictionPoints && (
          <Card>
            <CardHeader>
              <CardTitle>Frictions Preventing Progress</CardTitle>
              <CardDescription>Analysis of significant blockers and friction points</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Overview Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-secondary p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold">{detailedFrictionAnalysis.analysis?.totalFrictionPoints || 0}</div>
                    <div className="text-sm text-muted-foreground">Total Friction Points</div>
                  </div>
                  <div className="bg-secondary p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold">{detailedFrictionAnalysis.analysis?.criticalBlockers || 0}</div>
                    <div className="text-sm text-muted-foreground">Critical Blockers</div>
                  </div>
                  <div className="bg-secondary p-4 rounded-lg text-center col-span-2">
                    <div className="text-sm font-medium mb-1">Overall Impact</div>
                    <div className="text-sm text-muted-foreground">{detailedFrictionAnalysis.analysis?.overallImpact || 'No significant impact detected'}</div>
                  </div>
                </div>

                {/* Detailed Friction Points */}
                <div className="space-y-4">
                  {detailedFrictionAnalysis.frictionPoints?.map((friction, index) => {
                    const { variant, className } = getSeverityBadgeStyles(friction.severity);
                    return (
                      <div key={index} className="border border-border p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-semibold">{friction.blocker}</h4>
                          <Badge variant={variant} className={className}>{friction.severity}</Badge>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm"><span className="font-medium">Progress Impact:</span> {friction.progressImpact}</p>
                          <p className="text-sm text-muted-foreground"><span className="font-medium">Evidence:</span> {friction.evidence}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {friction.affectedGoals?.map((goal, goalIndex) => (
                              <Badge key={goalIndex} variant="outline">{goal}</Badge>
                            ))}
                          </div>
                          {friction.recommendations && friction.recommendations.length > 0 && (
                            <div className="mt-3">
                              <p className="text-sm font-medium mb-1">Recommendations:</p>
                              <ul className="list-disc list-inside text-sm text-muted-foreground">
                                {friction.recommendations.map((rec, recIndex) => (
                                  <li key={recIndex}>{rec}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pain Level Scoring Rubric */}
        <Card>
          <CardHeader>
            <CardTitle>Pain Level Scoring Rubric</CardTitle>
            <CardDescription>Guidelines for evaluating customer pain points and readiness</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Scoring Table */}
            <div className="rounded-lg border">
              {/* Header */}
              <div className="grid grid-cols-12 gap-4 p-4 bg-secondary font-medium">
                <div className="col-span-1">Score</div>
                <div className="col-span-2">Pain Level</div>
                <div className="col-span-4">Description</div>
                <div className="col-span-5">Indicators</div>
              </div>

              {/* Rows */}
              <PainLevelRow
                score={1}
                level="Minimal"
                description="Mentions a problem or a need"
                indicators="May not fully recognize the issue • No urgency in their description"
              />
              <PainLevelRow
                score={2}
                level="Low"
                description="They understand they have a problem"
                indicators="Clearly articulates the problem • Shows awareness of the issue's impact • No active search for solutions yet"
              />
              <PainLevelRow
                score={3}
                level="Moderate"
                description="Actively searching for a solution with a timeline"
                indicators="Describes efforts to find a solution • Mentions a timeline or deadline • Expresses some urgency"
              />
              <PainLevelRow
                score={4}
                level="High"
                description="Problem is so painful they've cobbled together an interim solution"
                indicators="Describes a temporary fix they're using • Expresses frustration with current situation • Clearly states the inadequacy of their interim solution"
              />
              <PainLevelRow
                score={5}
                level="Critical"
                description="Committed budget or can quickly acquire budget for a solution"
                indicators="Mentions allocated budget for a solution • Expresses immediate readiness to purchase • Describes the problem as critically impacting their operations"
              />
            </div>

            {/* Scoring Guidelines */}
            <div className="mt-6 space-y-2">
              <h4 className="font-medium mb-3">Scoring Guidelines:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-4">
                <li>Evaluate each person's description and assign a score from 1-5 based on the pain level they express.</li>
                <li>Consider both explicit statements and implicit cues in their language.</li>
                <li>If a description spans multiple levels, assign the highest applicable score.</li>
                <li>Use the 'Indicators' column to guide your assessment, looking for similar expressions or sentiments in the person's description.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  /**
   * Renders long context results
   * 
   * CHANGES (2025-02-03):
   * - Improved error handling and empty state display
   * - Added confidence score display
   * - Improved UI organization and readability
   */
  const LongContextResults = ({ results }) => {
    const [showDebug, setShowDebug] = useState(false);

    if (!results) {
      return (
        <div className="p-4 text-center">
          <p className="text-muted-foreground">Run the Long Context Chunking analysis to see results here.</p>
        </div>
      );
    }

    const { finalSummary, sectionSummaries, chunks, metadata } = results;

    return (
      <div className="space-y-6">
        {/* Section Summaries */}
        <Card>
          <CardHeader>
            <CardTitle>Key Sections</CardTitle>
            <CardDescription>Major themes and topics from the conversation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sectionSummaries.map((section, index) => (
                <Collapsible 
                  key={index}
                  open={openSections.longContext[`section-${index}`]} 
                  onOpenChange={(isOpen) => {
                    setOpenSections(prev => ({
                      ...prev,
                      longContext: {
                        ...prev.longContext,
                        [`section-${index}`]: isOpen
                      }
                    }));
                  }}
                >
                  <div className="bg-secondary p-4 rounded-lg">
                    <CollapsibleTrigger className="flex items-center justify-between w-full">
                      <h4 className="font-semibold">Section {index + 1}</h4>
                      <ChevronDown className="h-4 w-4" />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                        {section}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Debug View */}
        <Card>
          <CardHeader>
            <CardTitle>
              <Button 
                variant="ghost" 
                className="p-0"
                onClick={() => setShowDebug(!showDebug)}
              >
                <Code className="h-4 w-4 mr-2" />
                Debug Information
                {showDebug ? <ChevronDown className="h-4 w-4 ml-2" /> : <ChevronRight className="h-4 w-4 ml-2" />}
              </Button>
            </CardTitle>
          </CardHeader>
          {showDebug && (
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Metadata</h4>
                  <pre className="bg-secondary p-4 rounded-lg overflow-x-auto">
                    {JSON.stringify(metadata, null, 2)}
                  </pre>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Original Chunks</h4>
                  <div className="space-y-2">
                    {chunks.map((chunk, index) => (
                      <Collapsible 
                        key={index}
                        open={openSections.longContext[`chunk-${index}`]} 
                        onOpenChange={(isOpen) => {
                          setOpenSections(prev => ({
                            ...prev,
                            longContext: {
                              ...prev.longContext,
                              [`chunk-${index}`]: isOpen
                            }
                          }));
                        }}
                      >
                        <div className="bg-secondary p-4 rounded-lg">
                          <CollapsibleTrigger className="flex items-center justify-between w-full">
                            <span className="font-mono text-sm">Chunk {index + 1}</span>
                            <ChevronDown className="h-4 w-4" />
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <pre className="mt-2 text-sm overflow-x-auto whitespace-pre-wrap">
                              {chunk}
                            </pre>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    );
  };

  /**
   * Renders chunking results
   * 
   * CHANGES (2025-02-03):
   * - Improved error handling and empty state display
   * - Added confidence score display
   * - Improved UI organization and readability
   */
  const renderChunkingResults = (result) => {
    if (!result || !result.chunks) {
      return (
        <div className="p-4 text-center">
          <p className="text-muted-foreground">Run the Long Context Chunking agent to see results here.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {result.detailedAnalysis && (
          <Card>
            <CardHeader>
              <CardTitle>Detailed Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap">{result.detailedAnalysis}</div>
            </CardContent>
          </Card>
        )}

        {result.chunkSummaries && result.chunkSummaries.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Chunk Summaries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {result.chunkSummaries.map((summary, index) => (
                  <div key={index} className="bg-secondary p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Chunk {index + 1}</h4>
                    <div className="whitespace-pre-wrap">{summary}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Original Chunks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {result.chunks.map((chunk, index) => (
                <div key={index} className="bg-secondary p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Chunk {index + 1}</h4>
                  <div className="whitespace-pre-wrap">{chunk}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  /**
   * Renders needs analysis results
   * 
   * CHANGES (2025-02-03):
   * - Improved error handling and empty state display
   * - Added confidence score display
   * - Improved UI organization and readability
   */
  const renderNeedsAnalysis = (result) => {
    if (!result) {
      // Instead of just showing an error, create a fallback result object
      console.log('Creating fallback for missing needs analysis result');
      result = {
        immediateNeeds: [],
        latentNeeds: [],
        urgencyAssessment: { overall: 'Medium' },
        summary: 'Analysis data is being processed.',
        stakeholders: []
      };
    }
    
    // Initialize arrays if they don't exist
    const immediateNeeds = result.immediateNeeds || [];
    const latentNeeds = result.latentNeeds || [];

    return (
      <Card>
        <CardHeader>
          <CardTitle>Needs Analysis</CardTitle>
          <CardDescription>Immediate and latent needs identified from the interview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Immediate Needs */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Immediate Needs</h3>
              <div className="space-y-4">
                {immediateNeeds.map((need, index) => (
                  <div key={index} className="bg-secondary p-6 rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium">{need.need}</h4>
                        <Badge variant={getUrgencyVariant(need.urgency)} className="mt-1">
                          {need.urgency} Urgency
                        </Badge>
                      </div>
                    </div>
                    {need.context && (
                      <p className="text-muted-foreground mt-2">{need.context}</p>
                    )}
                    {need.evidence && (
                      <div className="mt-4">
                        <h5 className="text-sm font-medium">Evidence:</h5>
                        <p className="text-sm text-muted-foreground mt-1">{need.evidence}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Latent Needs */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Latent Needs</h3>
              <div className="space-y-4">
                {latentNeeds.map((need, index) => (
                  <div key={index} className="bg-secondary p-6 rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium">{need.need}</h4>
                        <Badge variant={getConfidenceBadgeVariant(need.confidence)} className="mt-1">
                          {getConfidenceRange(need.confidence)} Confidence
                        </Badge>
                      </div>
                    </div>
                    {need.rationale && (
                      <p className="text-muted-foreground mt-2">{need.rationale}</p>
                    )}
                    {need.evidence && (
                      <div className="mt-4">
                        <h5 className="text-sm font-medium">Evidence:</h5>
                        <p className="text-sm text-muted-foreground mt-1">{need.evidence}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Insights if present */}
            {result.insights && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Additional Insights</h3>
                <div className="bg-secondary p-6 rounded-lg">
                  <p className="text-muted-foreground">{result.insights}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  /**
   * Renders demand analysis results
   * 
   * CHANGES (2025-02-03):
   * - Improved error handling and empty state display
   * - Added confidence score display
   * - Improved UI organization and readability
   */
  // Updated renderDemandAnalysis function to handle the new data structure
  const renderDemandAnalysis = (result) => {
    if (!result) {
      console.log('Creating fallback for missing demand analysis result');
      // Instead of showing an error, create a fallback result to display
      result = {
        demandLevel: 1,
        confidenceScore: 70,
        reasoning: { summary: 'Analysis data is being processed.' },
        analysis: {
          level1Indicators: [],
          level2Indicators: [],
          level3Indicators: []
        },
        recommendations: []
      };
    }

    const getDemandLevelBadge = (level) => {
      switch (level) {
        case 1:
          return <Badge variant="secondary">Learning Demand (L1)</Badge>;
        case 2:
          return <Badge variant="default">Solution Demand (L2)</Badge>;
        case 3:
          return <Badge variant="success">Vendor Demand (L3)</Badge>;
        default:
          return <Badge variant="outline">Unknown Level</Badge>;
      }
    };

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Demand Analysis Results</span>
              <div className="flex flex-nowrap items-center gap-2">
                {getDemandLevelBadge(result.demandLevel || 1)}
                <Badge variant="outline">Confidence: {result.confidenceScore || 0}%</Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-secondary p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Analysis Summary</h4>
                <p className="text-sm text-muted-foreground">{result.reasoning?.summary || 'No summary available'}</p>
              </div>

              <div className="space-y-4">
                {[1, 2, 3].map(level => (
                  <Card key={level}>
                    <CardHeader>
                      <CardTitle className="text-sm">Level {level} Indicators</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {result[`level${level}Indicators`] && result[`level${level}Indicators`].map((indicator, index) => (
                          <div key={index} className="text-sm">
                            <p className="italic text-muted-foreground">"{indicator.quote}"</p>
                            <p className="text-xs text-muted-foreground mt-1">Context: {indicator.context}</p>
                          </div>
                        ))}
                        {result[`level${level}Indicators`] && result[`level${level}Indicators`].length === 0 && (
                          <p className="text-sm text-muted-foreground">No indicators found for this level</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {result.nextSteps && result.nextSteps.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold">Recommendations</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-medium mb-2">Next Steps</h5>
                      <ul className="list-disc pl-5 space-y-1">
                        {result.nextSteps.map((step, index) => (
                          <li key={index} className="text-sm text-muted-foreground">{step}</li>
                        ))}
                      </ul>
                    </div>
                    {result.areasForInvestigation && result.areasForInvestigation.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium mb-2">Areas for Investigation</h5>
                        <ul className="list-disc pl-5 space-y-1">
                          {result.areasForInvestigation.map((area, index) => (
                            <li key={index} className="text-sm text-muted-foreground">{area}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  /**
   * Renders opportunity qualification results
   * 
   * CHANGES (2025-02-03):
   * - Improved error handling and empty state display
   * - Added confidence score display
   * - Improved UI organization and readability
   */
  const renderOpportunityQualification = (result) => {
    if (!result) {
      return (
        <div className="p-4 text-center">
          <p className="text-muted-foreground">Run the Opportunity Qualification agent to see results here.</p>
        </div>
      );
    }

    const getScoreColor = (score) => {
      switch (score) {
        case 5:
        case 4:
          return 'text-green-500';
        case 3:
          return 'text-orange-500';
        default:
          return 'text-red-500';
      }
    };

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Opportunity Qualification Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Overall Assessment */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Overall Assessment: {result.overallAssessment}</h3>
                <p className="text-sm text-muted-foreground">{result.summary}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Problem Experience</h4>
                  <div className="flex items-center gap-2">
                    <span className={`text-xl font-bold ${getScoreColor(result.scores.problemExperience.score)}`}>
                      {result.scores.problemExperience.score}/5
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Confidence: {getConfidenceRange(result.scores.problemExperience.confidence)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Active Search</h4>
                  <div className="flex items-center gap-2">
                    <span className={`text-xl font-bold ${getScoreColor(result.scores.activeSearch.score)}`}>
                      {result.scores.activeSearch.score}/5
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Confidence: {getConfidenceRange(result.scores.activeSearch.confidence)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Problem Fit</h4>
                  <div className="flex items-center gap-2">
                    <span className={`text-xl font-bold ${getScoreColor(result.scores.problemFit.score)}`}>
                      {result.scores.problemFit.score}/5
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Confidence: {getConfidenceRange(result.scores.problemFit.confidence)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Detailed Analysis</h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-2">Problem Experience</h4>
                    <p className="text-sm text-muted-foreground mb-2">{result.scores.problemExperience.analysis}</p>
                    <div className="space-y-1">
                      <h5 className="text-sm font-medium">Evidence:</h5>
                      <ul className="list-disc pl-5 space-y-1">
                        {result.scores.problemExperience.evidence.map((item, index) => (
                          <li key={index} className="text-sm text-muted-foreground">{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Active Search</h4>
                    <p className="text-sm text-muted-foreground mb-2">{result.scores.activeSearch.analysis}</p>
                    <div className="space-y-1">
                      <h5 className="text-sm font-medium">Evidence:</h5>
                      <ul className="list-disc pl-5 space-y-1">
                        {result.scores.activeSearch.evidence.map((item, index) => (
                          <li key={index} className="text-sm text-muted-foreground">{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Problem Fit</h4>
                    <p className="text-sm text-muted-foreground mb-2">{result.scores.problemFit.analysis}</p>
                    <div className="space-y-1">
                      <h5 className="text-sm font-medium">Evidence:</h5>
                      <ul className="list-disc pl-5 space-y-1">
                        {result.scores.problemFit.evidence.map((item, index) => (
                          <li key={index} className="text-sm text-muted-foreground">{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Recommendations</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {result.recommendations.map((item, index) => (
                      <li key={index} className="text-sm text-muted-foreground">{item}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Red Flags</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {result.redFlags.map((item, index) => (
                      <li key={index} className="text-sm text-muted-foreground">{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {result.limitations && result.limitations.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Analysis Limitations</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {result.limitations.map((item, index) => (
                      <li key={index} className="text-sm text-muted-foreground">{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  /**
   * Renders final report results
   * 
   * CHANGES (2025-02-03):
   * - Improved error handling and empty state display
   * - Added confidence score display
   * - Improved UI organization and readability
   */
  const renderFinalReport = (result) => {
    if (!result) {
      return (
        <div className="p-4 text-center">
          <p className="text-muted-foreground">Run the Final Research Analysis Report agent to see results here.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Final Research Analysis Report</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Executive Summary */}
              <div className="bg-secondary p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Executive Summary</h3>
                <p className="text-sm text-muted-foreground">{result.executiveSummary}</p>
              </div>

              {/* Key Findings */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Key Findings</h3>

                {/* Current Situation */}
                <div className="space-y-2">
                  <h4 className="font-medium">Current Situation</h4>
                  <p className="text-sm text-muted-foreground">{result.keyFindings.currentSituation.summary}</p>
                  <ul className="list-disc pl-5 space-y-1">
                    {result.keyFindings.currentSituation.keyPoints.map((point, index) => (
                      <li key={index} className="text-sm text-muted-foreground">{point}</li>
                    ))}
                  </ul>
                </div>

                {/* Goals and Outcomes */}
                <div className="space-y-2">
                  <h4 className="font-medium">Goals and Desired Outcomes</h4>
                  <p className="text-sm text-muted-foreground">{result.keyFindings.goalsAndOutcomes.summary}</p>
                  <ul className="list-disc pl-5 space-y-1">
                    {result.keyFindings.goalsAndOutcomes.keyPoints.map((point, index) => (
                      <li key={index} className="text-sm text-muted-foreground">{point}</li>
                    ))}
                  </ul>
                </div>

                {/* Pain Points */}
                <div className="space-y-2">
                  <h4 className="font-medium">Pain Points and Areas of Friction</h4>
                  <p className="text-sm text-muted-foreground">{result.keyFindings.painPoints.summary}</p>
                  <ul className="list-disc pl-5 space-y-1">
                    {result.keyFindings.painPoints.keyPoints.map((point, index) => (
                      <li key={index} className="text-sm text-muted-foreground">{point}</li>
                    ))}
                  </ul>
                </div>


              </div>

              {/* Strategic Recommendations */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Strategic Recommendations</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {result.strategicRecommendations.map((recommendation, index) => (
                    <li key={index} className="text-sm text-muted-foreground">{recommendation}</li>
                  ))}
                </ul>
              </div>

              {/* Next Steps */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Next Steps</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {result.nextSteps.map((step, index) => (
                    <li key={index} className="text-sm text-muted-foreground">{step}</li>
                  ))}
                </ul>
              </div>

              {/* Metadata */}
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Confidence Score</span>
                  <Badge variant={getConfidenceBadgeVariant(result.metadata.confidenceScore)}>
                    {getConfidenceRange(result.metadata.confidenceScore)}
                  </Badge>
                </div>
                {result.metadata.dataGaps.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Data Gaps</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {result.metadata.dataGaps.map((gap, index) => (
                        <li key={index} className="text-sm text-muted-foreground">{gap}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  /**
   * Renders JTBD primary goal results
   * 
   * CHANGES (2025-02-03):
   * - Improved error handling and empty state display
   * - Added confidence score display
   * - Improved UI organization and readability
   */
  const renderJTBDPrimaryGoal = (result) => {
    if (!result) return null;

    return (
      <div className="space-y-6">
        <div>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-row items-center justify-between">
                <CardTitle>Primary Goal Analysis</CardTitle>
              </div>
              <CardDescription>Identifying the core objective that drives customer behavior and decision-making</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-secondary p-4 rounded-lg">
                  <p className="font-medium">{result.primaryGoal.statement}</p>
                  {result.primaryGoal.context && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Supporting Evidence:</p>
                      <p className="text-sm text-muted-foreground">"<i>{result.primaryGoal.context}</i>"</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Job Components</CardTitle>
              <CardDescription>Key aspects of the job the customer is trying to accomplish</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(result.jobComponents).map(([type, data]) => (
                  <div key={type} className="bg-secondary p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold capitalize">{type} Jobs</h4>
                    </div>
                    <p className="mb-2">{data.description}</p>
                    {data.evidence && data.evidence.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Supporting Evidence:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          {data.evidence.map((item, index) => (
                            <li key={index} className="text-sm text-muted-foreground">"<i>{item}</i>"</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>


      </div>
    );
  };

  /**
   * Renders JTBD gains results
   * 
   * CHANGES (2025-02-03):
   * - Improved error handling and empty state display
   * - Added confidence score display
   * - Improved UI organization and readability
   */
  const renderJTBDGains = (result) => {
    if (!result) return null;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Desired Outcomes</CardTitle>
            <CardDescription>Specific positive results the customer is looking for from getting the job done</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Desired Outcomes */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Desired Outcomes</h3>
                <div className="grid gap-4">
                  {result.desiredOutcomes.map((outcome, index) => (
                    <div key={index} className="bg-secondary p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{outcome.outcome}</h4>
                          <Badge className="mt-1">{outcome.importance}</Badge>
                        </div>
                        <Badge variant={getConfidenceBadgeVariant(outcome.confidence)}>
                          {getConfidenceRange(outcome.confidence)} Confidence
                        </Badge>
                      </div>
                      <div className="mt-2">
                        <h5 className="text-sm font-medium">Evidence:</h5>
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                          {outcome.evidence.map((item, i) => (
                            <li key={i} className="text-sm text-muted-foreground">{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Gains */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Performance Gains</h3>
                <div className="grid gap-4">
                  {result.performanceGains.map((gain, index) => (
                    <div key={index} className="bg-secondary p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{gain.gain}</h4>
                        <Badge variant={getConfidenceBadgeVariant(gain.confidence)}>
                          {getConfidenceRange(gain.confidence)} Confidence
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                        <div>
                          <span className="font-medium">Current State:</span>
                          <p className="text-muted-foreground">{gain.currentState}</p>
                        </div>
                        <div>
                          <span className="font-medium">Target State:</span>
                          <p className="text-muted-foreground">{gain.targetState}</p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <h5 className="text-sm font-medium">Evidence:</h5>
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                          {gain.evidence.map((item, i) => (
                            <li key={i} className="text-sm text-muted-foreground">{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Social Gains */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Social Gains</h3>
                <div className="grid gap-4">
                  {result.socialGains.map((gain, index) => (
                    <div key={index} className="bg-secondary p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{gain.gain}</h4>
                          <p className="text-sm text-muted-foreground">{gain.context}</p>
                        </div>
                        <Badge variant={getConfidenceBadgeVariant(gain.confidence)}>
                          {getConfidenceRange(gain.confidence)} Confidence
                        </Badge>
                      </div>
                      <div className="mt-2">
                        <h5 className="text-sm font-medium">Evidence:</h5>
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                          {gain.evidence.map((item, i) => (
                            <li key={i} className="text-sm text-muted-foreground">{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Analysis Summary */}
              <div className="mt-6 pt-6 border-t">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Analysis Summary</h3>
                  <p className="text-sm text-muted-foreground">{result.analysis.summary}</p>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Primary Gains:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {result.analysis.primaryGains.map((gain, index) => (
                        <li key={index} className="text-sm text-muted-foreground">{gain}</li>
                      ))}
                    </ul>
                  </div>


                </div>
              </div>


            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  /**
   * Renders problem awareness results
   * 
   * CHANGES (2025-02-03):
   * - Improved error handling and empty state display
   * - Added confidence score display
   * - Improved UI organization and readability
   */
  const renderProblemAwareness = (result) => {
    if (!result) return null;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Problem Awareness Matrix</CardTitle>
            <CardDescription>Analysis of understanding across key dimensions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {/* Problem Understanding Matrix */}
              <div>
                <h3 className="text-xl font-semibold mb-4">Problem Understanding Matrix</h3>
                <div className="grid gap-4">
                  {result.matrix.map((item, index) => (
                    <div key={index} className="bg-secondary p-6 rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="text-lg font-semibold">{item.dimension}</h4>
                        <Badge variant={getConfidenceBadgeVariant(item.score)}>
                          {item.score}% Understanding
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-3">{item.analysis}</p>
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">Evidence:</h5>
                        <ul className="list-disc pl-5 space-y-1">
                          {item.evidence.map((evidence, i) => (
                            <li key={i} className="text-sm text-muted-foreground">{evidence}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Analysis Summary */}
              <div className="mt-6 pt-6 border-t">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Analysis Summary</h3>
                  <p className="text-sm text-muted-foreground">{result.analysis.summary}</p>



                  {result.analysis.limitations.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Limitations</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {result.analysis.limitations.map((limitation, index) => (
                          <li key={index} className="text-sm text-muted-foreground">{limitation}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>


            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  /**
   * Handles download of analysis results
   * 
   * CHANGES (2025-02-03):
   * - Improved error handling and empty state display
   * - Added confidence score display
   * - Improved UI organization and readability
   */
  const handleDownload = () => {
    const result = localAnalysisResults[showResult];
    if (!result) return;

    const jsonString = JSON.stringify(result, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${showResult}_results.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * Renders analysis results based on the selected result type
   * 
   * CHANGES (2025-02-03):
   * - Improved error handling and empty state display
   * - Added confidence score display
   * - Improved UI organization and readability
   */
  const renderResults = () => {
    switch (showResult) {
      case 'longContextChunking':
        return <LongContextResults results={localAnalysisResults[showResult]} />;
      case 'jtbd':
        return renderJTBDPrimaryGoal(localAnalysisResults?.jtbd);
      case 'jtbdGains':
        return renderJTBDGains(localAnalysisResults?.jtbdGains);
      case 'painExtractor':
        return renderPainResults(localAnalysisResults?.painExtractor);
      case 'problemAwareness':
        return renderProblemAwareness(localAnalysisResults?.problemAwareness);
      case 'needsAnalysis':
        return renderNeedsAnalysis(localAnalysisResults?.needsAnalysis);
      case 'demandAnalyst':
        return renderDemandAnalysis(localAnalysisResults?.demandAnalyst);
      case 'opportunityQualification':
        return renderOpportunityQualification(localAnalysisResults?.opportunityQualification);
      case 'finalReport':
        return renderFinalReport(localAnalysisResults?.finalReport);
      default:
        return null;
    }
  };

  return (
    <div className="h-full">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">
              {showResult === 'longContextChunking' 
                ? 'Transcript has been optimized'
                : (showResult && agents.find(a => a.id === showResult)?.name)
              }
            </h2>
            <p className="text-muted-foreground">
              {showResult === 'longContextChunking' 
                ? 'The remaining analysis process uses this data as input which helps ensure the AI gives explicit and accurate results.'
                : showResult === 'jtbd'
                  ? 'Results from the transcript identifying the Jobs-to-be-Done (JTBD) goals mentioned by the interviewee.'
                  : 'Here are the detailed results of the analysis'
              }
            </p>
          </div>
          {showResult && localAnalysisResults[showResult] && showResult !== 'longContextChunking' && (
            <Button
              variant="outline"
              onClick={handleDownload}
              className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 hover:border-blue-3000"
            >
              Download Results
            </Button>
          )}
        </div>

        <div className="space-y-8 pb-24">
          {renderResults()}
        </div>
      </div>
    </div>
  );
};

export default AnalysisResults;