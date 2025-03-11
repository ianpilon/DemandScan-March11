import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const getScoreVariant = (score) => {
  if (score >= 80) return "success";
  if (score >= 60) return "warning";
  return "destructive";
};

const AwarenessSection = ({ dimension, data }) => {
  return (
    <div className="bg-secondary p-6 rounded-lg">
      <div className="flex justify-between items-start mb-3">
        <h4 className="text-lg font-semibold">{dimension}</h4>
        <Badge variant={getScoreVariant(data.score)}>{data.score}%</Badge>
      </div>
      
      <div className="space-y-4">
        <div>
          <h5 className="text-sm font-medium mb-2">Strengths</h5>
          <ul className="list-disc pl-5 space-y-1">
            {data.strengths.map((strength, index) => (
              <li key={index} className="text-sm text-muted-foreground">{strength}</li>
            ))}
          </ul>
        </div>

        <div>
          <h5 className="text-sm font-medium mb-2">Weaknesses</h5>
          <ul className="list-disc pl-5 space-y-1">
            {data.weaknesses.map((weakness, index) => (
              <li key={index} className="text-sm text-muted-foreground">{weakness}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

const ProblemAwarenessResults = ({ result }) => {
  if (!result) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">Run the Problem Awareness Matrix Analysis agent to see results here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Problem Awareness Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Matrix Analysis */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Problem Understanding Matrix</h3>
              <div className="grid gap-4">
                {result.matrix.map((item, index) => (
                  <div key={index} className="bg-secondary p-6 rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="text-lg font-semibold">{item.dimension}</h4>
                      <Badge variant={getScoreVariant(item.score)}>{item.score}%</Badge>
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

            {/* Dimension Analysis */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Dimension Analysis</h3>
              <div className="grid gap-4">
                {Object.entries(result.dimensions).map(([dimension, data], index) => (
                  <AwarenessSection 
                    key={index}
                    dimension={dimension.replace(/([A-Z])/g, ' $1').trim()}
                    data={data}
                  />
                ))}
              </div>
            </div>

            {/* Analysis Summary */}
            <div className="mt-6 pt-6 border-t">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Analysis Summary</h3>
                <p className="text-sm text-muted-foreground">{result.analysis.summary}</p>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Understanding</span>
                  <Badge variant={getScoreVariant(result.analysis.overallScore)}>
                    {result.analysis.overallScore}%
                  </Badge>
                </div>

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

            {/* Score Explanation */}
            <div className="mt-8 pt-6 border-t">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">Understanding Problem Awareness Scores</h3>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>Problem awareness scores are calculated based on multiple factors:</p>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="success" className="w-16 justify-center">80-100%</Badge>
                      <span>Deep understanding with clear articulation of problems and implications</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="warning" className="w-16 justify-center">60-79%</Badge>
                      <span>Basic understanding with some gaps in problem recognition or impact</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="w-16 justify-center">0-59%</Badge>
                      <span>Limited understanding with significant gaps or misconceptions</span>
                    </div>
                  </div>
                  <p className="mt-2 italic">Scores reflect depth of understanding, ability to articulate problems, and awareness of implications.</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProblemAwarenessResults;
