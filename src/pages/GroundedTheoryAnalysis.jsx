import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const GroundedTheoryAnalysis = () => {
  const [interviews, setInterviews] = useState([
    { name: '', date: '', time: '', script: '' },
    { name: '', date: '', time: '', script: '' },
    { name: '', date: '', time: '', script: '' },
    { name: '', date: '', time: '', script: '' },
    { name: '', date: '', time: '', script: '' },
  ]);

  const handleInterviewChange = (index, field, value) => {
    const updatedInterviews = [...interviews];
    updatedInterviews[index][field] = value;
    setInterviews(updatedInterviews);
  };

  const addInterview = () => {
    setInterviews([...interviews, { name: '', date: '', time: '', script: '' }]);
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Grounded Theory Analysis</h1>

      <Card>
        <CardHeader>
          <CardTitle>Create a New Grounded Theory Analysis Project</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Plan your interviews for this grounded theory analysis:</p>
          
          {interviews.map((interview, index) => (
            <div key={index} className="mb-6 p-4 border rounded">
              <h3 className="text-lg font-semibold mb-2">Interview {index + 1}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`name-${index}`}>Interviewee Name</Label>
                  <Input
                    id={`name-${index}`}
                    value={interview.name}
                    onChange={(e) => handleInterviewChange(index, 'name', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`date-${index}`}>Date</Label>
                  <Input
                    id={`date-${index}`}
                    type="date"
                    value={interview.date}
                    onChange={(e) => handleInterviewChange(index, 'date', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`time-${index}`}>Time</Label>
                  <Input
                    id={`time-${index}`}
                    type="time"
                    value={interview.time}
                    onChange={(e) => handleInterviewChange(index, 'time', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`script-${index}`}>Interview Script</Label>
                  <Select
                    value={interview.script}
                    onValueChange={(value) => handleInterviewChange(index, 'script', value)}
                  >
                    <SelectTrigger id={`script-${index}`}>
                      <SelectValue placeholder="Select a script" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default Script</SelectItem>
                      <SelectItem value="custom1">Custom Script 1</SelectItem>
                      <SelectItem value="custom2">Custom Script 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
          
          <Button onClick={addInterview} className="mt-4">Add Another Interview</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default GroundedTheoryAnalysis;