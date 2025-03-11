import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * A simplified version of the analysis results component
 * that only displays basic information for our visual automated flow
 */
const SimpleAnalysisResults = ({ showResult, localAnalysisResults }) => {
  // Always show a title based on the selected agent, even if results are empty
  if (!showResult) {
    return (
      <Card className="p-6">
        <CardHeader>
          <CardTitle>No Results Selected</CardTitle>
          <CardDescription>Please select a result to view</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  // Get agent title and description even if results are empty
  const getAgentTitle = () => {
    switch(showResult) {
      case 'needsAnalysis': return { title: 'Needs Analysis', description: 'Immediate and latent needs identified' };
      case 'demandAnalyst': return { title: 'Demand Analysis', description: 'Patterns of customer priorities and interests' };
      case 'opportunityQualification': return { title: 'Opportunity Qualification', description: 'Assessment of the business opportunity' };
      case 'finalReport': return { title: 'Final Summary Report', description: 'Comprehensive evaluation results' };
      default: return { title: showResult, description: 'Analysis results' };
    }
  };
  
  // Show a placeholder with the correct title if results are empty
  if (!localAnalysisResults[showResult]) {
    const { title, description } = getAgentTitle();
    return (
      <Card className="p-6">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Results are being processed. The analysis will be available shortly.</p>
        </CardContent>
      </Card>
    );
  }

  const result = localAnalysisResults[showResult];
  
  // Different display based on the result type
  const renderContent = () => {
    switch (showResult) {
      case 'needsAnalysis':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Needs Analysis</CardTitle>
              <CardDescription>Immediate and latent needs identified</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Immediate Needs</h3>
                  {result.immediateNeeds?.map((need, i) => (
                    <div key={i} className="bg-secondary p-4 rounded-lg mb-2">
                      <div className="flex justify-between">
                        <p className="font-medium">{need.need}</p>
                        <Badge>{need.urgency} Urgency</Badge>
                      </div>
                      {need.context && <p className="text-sm mt-2">{need.context}</p>}
                    </div>
                  ))}
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Latent Needs</h3>
                  {result.latentNeeds?.map((need, i) => (
                    <div key={i} className="bg-secondary p-4 rounded-lg mb-2">
                      <div className="flex justify-between">
                        <p className="font-medium">{need.need}</p>
                        <Badge variant="secondary">{need.urgency} Urgency</Badge>
                      </div>
                      {need.context && <p className="text-sm mt-2">{need.context}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      
      case 'demandAnalyst':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Demand Analysis</CardTitle>
              <CardDescription>Customer's buying cycle position</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-secondary p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Demand Level: {result.demandLevel}/5</h3>
                  <p>{result.reasoning?.summary || 'Analysis complete'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      
      case 'opportunityQualification':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Opportunity Qualification</CardTitle>
              <CardDescription>Qualification status and score</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-secondary p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Status: {result.qualification}</h3>
                    <Badge variant={result.qualification === 'Qualified' ? 'success' : 'secondary'}>
                      Score: {result.opportunityScore || 0}%
                    </Badge>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Strengths</h3>
                  <ul className="list-disc pl-5">
                    {result.reasons?.strengths?.map((item, i) => (
                      <li key={i}>{item}</li>
                    )) || <li>No data available</li>}
                  </ul>
                </div>
                
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Weaknesses</h3>
                  <ul className="list-disc pl-5">
                    {result.reasons?.weaknesses?.map((item, i) => (
                      <li key={i}>{item}</li>
                    )) || <li>No data available</li>}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      
      case 'longContextChunking':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Transcript Processing</CardTitle>
              <CardDescription>Analyzed and processed transcript data</CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <p className="mb-4">Transcript has been successfully processed and optimized.</p>
                {result.chunkSummaries?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Summary</h3>
                    {result.chunkSummaries.map((summary, i) => (
                      <div key={i} className="bg-secondary p-3 rounded mb-2">
                        {summary}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      
      case 'finalReport':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Final Report</CardTitle>
              <CardDescription>Comprehensive analysis summary</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {result.sections?.map((section, i) => (
                  <div key={i} className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">{section.title}</h3>
                    <div className="bg-secondary p-4 rounded-lg">
                      <p className="whitespace-pre-wrap">{section.content}</p>
                    </div>
                  </div>
                )) || (
                  <div className="bg-secondary p-4 rounded-lg">
                    <p>Report data is being processed.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      
      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle>{showResult} Results</CardTitle>
              <CardDescription>Analysis results summary</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-secondary p-4 rounded-lg overflow-auto max-h-[400px]">
                {JSON.stringify(result, null, 2)}
              </pre>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="h-full">
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-2">
          {showResult === 'longContextChunking' ? 'Transcript Processing' : 
           showResult === 'needsAnalysis' ? 'Needs Analysis' :
           showResult === 'demandAnalyst' ? 'Demand Analysis' :
           showResult === 'opportunityQualification' ? 'Opportunity Qualification' :
           showResult === 'finalReport' ? 'Final Report' : showResult}
        </h2>
        <p className="text-muted-foreground mb-6">
          {showResult === 'longContextChunking' ? 'The transcript has been processed for optimal analysis.' :
           'Results of the automated analysis sequence'}
        </p>
        
        <div className="space-y-8 pb-24">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default SimpleAnalysisResults;
