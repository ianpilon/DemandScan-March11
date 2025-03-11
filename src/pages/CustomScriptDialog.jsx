import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const CustomScriptDialog = ({ open, onOpenChange, onSave, initialScript }) => {
  const [customScript, setCustomScript] = useState(initialScript);

  const handleCustomScriptChange = (moduleId, questionIndex, value) => {
    setCustomScript(prev => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        questions: prev[moduleId]?.questions.map((q, i) => i === questionIndex ? value : q)
      }
    }));
  };

  const addNewQuestion = (moduleId) => {
    setCustomScript(prev => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        questions: [...(prev[moduleId]?.questions || []), ""]
      }
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Custom Script</DialogTitle>
          <DialogDescription>Customize your interview script by modifying the questions or adding new ones.</DialogDescription>
        </DialogHeader>
        {Object.entries(customScript).map(([moduleId, module]) => (
          <div key={moduleId} className="mb-6">
            <h3 className="text-lg font-semibold mb-2">{module.title}</h3>
            {module.questions.map((question, index) => (
              <div key={index} className="mb-2">
                <Label htmlFor={`${moduleId}-q${index}`}>Question {index + 1}</Label>
                <Input
                  id={`${moduleId}-q${index}`}
                  value={question}
                  onChange={(e) => handleCustomScriptChange(moduleId, index, e.target.value)}
                />
              </div>
            ))}
            <Button variant="outline" onClick={() => addNewQuestion(moduleId)} className="mt-2">
              Add New Question
            </Button>
          </div>
        ))}
        <Button onClick={() => onSave(customScript)}>Save Custom Script</Button>
      </DialogContent>
    </Dialog>
  );
};

export default CustomScriptDialog;