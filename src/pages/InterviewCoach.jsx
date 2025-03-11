import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { coachingModules } from './interviewCoachData';
import CustomScriptDialog from './CustomScriptDialog';

const InterviewCoach = () => {
  const [openDialog, setOpenDialog] = useState(null);
  const [customScriptOpen, setCustomScriptOpen] = useState(false);

  const navigate = useNavigate();

  const saveCustomScript = (customScript) => {
    const savedScripts = JSON.parse(localStorage.getItem('customScripts') || '[]');
    savedScripts.push(customScript);
    localStorage.setItem('customScripts', JSON.stringify(savedScripts));
    setCustomScriptOpen(false);
    toast.success("Custom script saved successfully");
    navigate('/problem-solution-fit-script');
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Interview Coach</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {coachingModules.map((module) => (
          <Card key={module.id} className="flex flex-col justify-between">
            <CardHeader>
              <CardTitle>{module.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">{module.description}</p>
              <Button 
                variant="link" 
                className="w-full justify-start p-0 text-primary hover:text-primary/80"
                onClick={() => setOpenDialog(module.id)}
              >
                Questions to Ask
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Custom Script</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Create a custom interview script that can be completed in 45 minutes or less.</p>
          <Button onClick={() => setCustomScriptOpen(true)}>Create Custom Script</Button>
        </CardContent>
      </Card>

      {coachingModules.map((module) => (
        <Dialog key={module.id} open={openDialog === module.id} onOpenChange={() => setOpenDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{module.title}</DialogTitle>
              <DialogDescription>{module.description}</DialogDescription>
            </DialogHeader>
            <ul className="list-disc pl-6 mt-4">
              {module.questions.map((question, index) => (
                <li key={index} className="mb-2">{question}</li>
              ))}
            </ul>
          </DialogContent>
        </Dialog>
      ))}

      <CustomScriptDialog
        open={customScriptOpen}
        onOpenChange={setCustomScriptOpen}
        onSave={saveCustomScript}
        initialScript={coachingModules.reduce((acc, module) => {
          acc[module.id] = {
            title: module.title,
            questions: [...module.questions]
          };
          return acc;
        }, {})}
      />
    </div>
  );
};

export default InterviewCoach;