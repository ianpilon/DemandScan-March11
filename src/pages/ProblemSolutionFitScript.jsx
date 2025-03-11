import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ProblemSolutionFitScript = () => {
  const [customScripts, setCustomScripts] = useState([]);

  useEffect(() => {
    const savedScripts = JSON.parse(localStorage.getItem('customScripts') || '[]');
    setCustomScripts(savedScripts.map((script, index) => ({
      ...script,
      title: script.title || `Custom Script ${index + 1}`
    })));
  }, []);

  const handleTitleChange = (index, newTitle) => {
    const updatedScripts = customScripts.map((script, i) => 
      i === index ? { ...script, title: newTitle } : script
    );
    setCustomScripts(updatedScripts);
    localStorage.setItem('customScripts', JSON.stringify(updatedScripts));
  };

  const handleTitleSave = (index) => {
    // This function is called when the save button is clicked
    // We don't need to do anything here as the title is already saved in handleTitleChange
    // But you could add additional logic if needed
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Problem Solution Fit Script</h1>
      {customScripts.length === 0 ? (
        <p>No custom scripts have been created yet. Create one in the Interview Coach section.</p>
      ) : (
        customScripts.map((script, scriptIndex) => (
          <Card key={scriptIndex} className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Input
                value={script.title}
                onChange={(e) => handleTitleChange(scriptIndex, e.target.value)}
                className="font-semibold text-lg w-2/3"
              />
              <Button onClick={() => handleTitleSave(scriptIndex)} size="sm">
                Save Title
              </Button>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                {Object.entries(script).map(([moduleId, module]) => (
                  moduleId !== 'title' && (
                    <AccordionItem key={moduleId} value={moduleId}>
                      <AccordionTrigger>{module.title}</AccordionTrigger>
                      <AccordionContent>
                        <ol className="list-decimal pl-6">
                          {module.questions.map((question, questionIndex) => (
                            <li key={questionIndex} className="mb-2">{question}</li>
                          ))}
                        </ol>
                      </AccordionContent>
                    </AccordionItem>
                  )
                ))}
              </Accordion>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default ProblemSolutionFitScript;