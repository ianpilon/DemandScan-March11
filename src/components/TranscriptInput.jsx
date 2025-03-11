import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button"; // Added missing import
import FileUploadWrapper from './FileUploadWrapper';

const TranscriptInput = ({ 
  transcript, 
  setTranscript, 
  onFileUpload,
  onAnalyze,
  isAnalyzing,
  hasAnalyzed,
  autoSequence,
  placeholder
}) => {
  console.log('TranscriptInput autoSequence:', autoSequence);
  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="upload">Upload File</TabsTrigger>
            <TabsTrigger value="paste">Paste Transcript</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="mt-0">
            <FileUploadWrapper
              onFileUpload={onFileUpload}
              onAnalyze={onAnalyze}
              isAnalyzing={isAnalyzing}
              hasAnalyzed={hasAnalyzed}
              autoSequence={autoSequence}
              defaultValue={transcript}
              showTextArea={false}
            />
          </TabsContent>
          
          <TabsContent value="paste" className="mt-0">
            <div className="space-y-4">
              <Textarea
                id="transcript"
                placeholder={placeholder}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                className="min-h-[200px] resize-none"
                disabled={isAnalyzing}
              />
              {transcript && !hasAnalyzed && autoSequence && (
                <div className="flex justify-end">
                  <Button
                    onClick={onAnalyze}
                    disabled={isAnalyzing}
                    className="shrink-0 bg-green-500 hover:bg-green-600 text-white"
                  >
                    Run Analysis
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TranscriptInput;