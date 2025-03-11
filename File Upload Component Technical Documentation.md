File Upload Component Technical Documentation

Overview
The FileUpload component is a versatile file input solution that supports multiple interaction methods (drag-and-drop, file browser, and direct text paste) while providing immediate feedback to users. It handles various document formats and includes error handling for unsupported file types and size limitations.

Component Architecture
The FileUpload component is built as a React functional component that accepts three props:

onContentChange: Function callback that receives the extracted text content
defaultValue: Optional initial text content (default: empty string)
isLoading: Optional boolean to disable interactions during processing (default: false)
Core Functionality
1. State Management
The component maintains several state variables:

isDragging: Tracks when a file is being dragged over the drop zone
error: Stores error messages for display to the user
hasContent: Indicates whether there is content in the textarea
dragCounter: A ref used to accurately track drag enter/leave events
2. File Type Handling
The component supports multiple document formats through a comprehensive list of MIME types:

Plain text (.txt)
PDF documents (.pdf)
Microsoft Word documents (.doc, .docx)
Rich Text Format (.rtf) with multiple MIME type variants
3. File Processing Methods
The component includes specialized functions for different file formats:

extractTextFromDOCX: Uses the mammoth library to extract text from Word documents
extractTextFromPDF: Extracts text from PDF files
extractTextFromTXT: Reads plain text files
extractTextFromRTF: Processes RTF documents
4. Interaction Handlers
Multiple event handlers manage the different ways users can interact with the component:

Drag and drop handlers: handleDrag, handleDragIn, handleDragOut, handleDrop
File selection: handleFileSelect for the file input dialog
Text area input: handleTextAreaChange for direct text entry
5. File Validation
The component implements validation to ensure files meet requirements:

File type validation against allowed MIME types
File size validation (maximum 75MB)
Implementation Details
Drag and Drop Implementation
The drag and drop system uses a counter-based approach to handle nested elements:

const handleDragIn = (e: React.DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  dragCounter.current += 1;
  if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
    setIsDragging(true);
  }
};
const handleDragOut = (e: React.DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  dragCounter.current -= 1;
  if (dragCounter.current === 0) {
    setIsDragging(false);
  }
};
File Processing Flow
When a file is dropped or selected:

The file type is validated against allowed MIME types
The file size is checked against the 75MB limit
Based on the file type, the appropriate extraction function is called
The extracted text is passed to the onContentChange callback
Any errors during this process are captured and displayed to the user
Direct Text Entry
The component includes a textarea that allows users to paste content directly:

const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  const content = e.target.value;
  setHasContent(!!content.trim());
  onContentChange(content);
};
Visual Feedback
The component provides visual feedback for different states:

Drag state: Border and background color change during drag operations
Loading state: Reduced opacity and disabled interactions
Error state: Red text message appears below the drop zone
UI Implementation
The component has two main UI sections:

A drag-and-drop zone with visual cues and a "Browse computer" button
A textarea for direct text entry or displaying file contents
The drag-and-drop zone includes:

An upload icon
Clear instructions for the user
A button to trigger the file browser dialog
Size and file type restrictions information
Complete Implementation Reference
To recreate this component, a developer would need to:

Install dependencies:

React for component framework
mammoth for DOCX processing
A PDF processing library
Create a component with the state variables and refs described above

Implement the file processing functions for each supported file type

Set up the drag and drop event handlers with proper counter management

Create the file validation logic for MIME types and size limits

Design a responsive UI with appropriate visual feedback states

Implement the direct text entry functionality

Wire everything together with proper error handling and callback integration

The result is a versatile file upload component that gracefully handles multiple interaction patterns and file types while providing clear feedback to users throughout the process.