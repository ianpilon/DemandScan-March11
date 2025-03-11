import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const ApiKeyInput = ({ onApiKeySubmit, initialValue = '' }) => {
  const [apiKey, setApiKey] = useState(initialValue);
  const [isActive, setIsActive] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [savedKey, setSavedKey] = useState(initialValue);


  useEffect(() => {
    const hasKey = Boolean(initialValue.trim());
    setIsActive(hasKey);
    setApiKey(initialValue);
    setSavedKey(initialValue);
  }, [initialValue]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onApiKeySubmit(apiKey.trim());
      setIsActive(true);
      setIsEditing(false);
      setSavedKey(apiKey.trim());
    }
  };

  const handleDelete = () => {
    onApiKeySubmit('');
    setIsActive(false);
    setApiKey('');
    setSavedKey('');
    setIsEditing(false);
    toast.success("LLM API key removed successfully");
  };

  const handleKeyChange = (e) => {
    const newKey = e.target.value;
    setApiKey(newKey);
    setIsEditing(newKey !== savedKey);
    setIsActive(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          type="password"
          value={apiKey}
          onChange={handleKeyChange}
          placeholder="Enter your LLM API key"
          className="flex-grow"
        />
        {isActive && !isEditing ? (
          <>
            <Button variant="secondary" disabled>
              Saved
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
            >
              Delete API Key
            </Button>
          </>
        ) : (
          <Button 
            type="submit" 
            onClick={handleSubmit}
            disabled={!apiKey.trim() || apiKey.trim() === savedKey}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            Save API Key
          </Button>
        )}
      </div>
      {isActive && !isEditing && (
        <Badge variant="success" className="bg-green-500 hover:bg-green-600">
          API Key is Active
        </Badge>
      )}
    </div>
  );
};

export default ApiKeyInput;