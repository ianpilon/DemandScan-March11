import React, { useState, useCallback, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { useDropzone } from 'react-dropzone';
import { UploadIcon, XIcon, AlertCircle, Loader2 } from 'lucide-react';
import { processFile, SUPPORTED_MIME_TYPES, MAX_FILE_SIZE } from '@/utils/fileProcessing';
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";

const FileUpload = ({ 
  onContentChange,
  defaultValue = '',
  isLoading = false
}) => {
  // State management
  const [state, setState] = useState({
    isDragging: false,
    error: null,
    hasContent: !!defaultValue,
    processing: false
  });
  const [content, setContent] = useState(defaultValue);
  const dragCounter = useRef(0);

  // Drag event handlers
  const handleDragIn = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setState(prev => ({ ...prev, isDragging: true }));
    }
  }, []);

  const handleDragOut = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setState(prev => ({ ...prev, isDragging: false }));
    }
  }, []);

  // File processing
  const handleFileProcessing = async (file) => {
    setState(prev => ({ ...prev, processing: true, error: null }));
    try {
      const result = await processFile(file);
      setContent(result);
      onContentChange(result);
      setState(prev => ({ 
        ...prev, 
        processing: false,
        hasContent: true 
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        processing: false, 
        error: error.message 
      }));
    }
  };

  // Dropzone configuration
  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles?.length > 0) {
        await handleFileProcessing(acceptedFiles[0]);
      }
    },
    onDragEnter: handleDragIn,
    onDragLeave: handleDragOut,
    accept: SUPPORTED_MIME_TYPES,
    maxSize: MAX_FILE_SIZE,
    disabled: isLoading || state.processing,
    noClick: true,
    noKeyboard: true,
    multiple: false
  });

  // Handle direct text input
  const handleTextAreaChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    setState(prev => ({ ...prev, hasContent: !!newContent.trim() }));
    onContentChange(newContent);
  };

  // Clear content
  const clearContent = () => {
    setContent('');
    setState(prev => ({ 
      ...prev, 
      hasContent: false,
      error: null 
    }));
    onContentChange('');
  };

  // Get dropzone styles based on state
  const getDropzoneStyles = () => {
    if (isLoading || state.processing) {
      return 'border-gray-300 bg-gray-50 cursor-not-allowed opacity-50';
    }
    if (state.isDragging) {
      return 'border-blue-400 bg-blue-50';
    }
    if (state.error) {
      return 'border-destructive bg-destructive/5';
    }
    if (state.hasContent) {
      return 'border-gray-300 text-gray-400';
    }
    return 'border-gray-300 hover:border-blue-500';
  };

  return (
    <div className="w-full space-y-4">
      {/* Error Alert */}
      {state.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {/* File Upload Zone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 
          transition-colors duration-200 ease-in-out
          ${getDropzoneStyles()}
        `}
      >
        <input {...getInputProps()} />
        <div className={`flex flex-col items-center justify-center text-center ${state.hasContent ? 'text-gray-400' : ''}`}>
          <UploadIcon className={`w-12 h-12 mb-4 ${state.hasContent ? 'text-gray-300' : 'text-gray-400'}`} />
          <p className="text-lg font-medium mb-2">
            {state.isDragging ? 'Drop the file here' : 'Drag and drop your file'}
          </p>
          <p className={`text-sm mb-4 ${state.hasContent ? 'text-gray-300' : 'text-gray-500'}`}>or</p>
          <Button
            type="button"
            variant="outline"
            disabled={isLoading || state.processing}
            className={`mb-4 ${state.hasContent ? "text-gray-400 border-gray-200 hover:bg-gray-50" : "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 hover:border-blue-300"}`}
            onClick={(e) => {
              e.stopPropagation();
              open();
            }}
          >
            {state.processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Browse computer'
            )}
          </Button>
          <div className={`text-sm ${state.hasContent ? 'text-gray-300' : 'text-gray-500'}`}>
            <p>Supported formats: TXT, PDF, DOC, DOCX, RTF</p>
            <p>Maximum file size: 75MB</p>
          </div>
        </div>
      </div>

      {/* Text Area */}
      <div className="relative">
        <Textarea
          value={content}
          onChange={handleTextAreaChange}
          placeholder="Or paste your text directly here..."
          className="min-h-[200px] resize-y"
          disabled={isLoading || state.processing}
        />
        {state.hasContent && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2"
            onClick={clearContent}
            disabled={isLoading || state.processing}
          >
            <XIcon className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Processing state is already shown in the button */}
    </div>
  );
};

export default FileUpload;
