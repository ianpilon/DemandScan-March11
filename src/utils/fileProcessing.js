import mammoth from 'mammoth';

export const SUPPORTED_MIME_TYPES = {
  'text/plain': ['.txt'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/rtf': ['.rtf'],
  'application/rtf': ['.rtf'],
  'application/x-rtf': ['.rtf'],
  'text/richtext': ['.rtf']
};

export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export const validateFile = (file) => {
  // Check if file exists
  if (!file) {
    throw new Error('No file provided');
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large. Maximum size is 75MB. Current size: ${(file.size / 1024 / 1024).toFixed(1)}MB`);
  }

  // Check file type
  const isValidType = Object.entries(SUPPORTED_MIME_TYPES).some(([mimeType, extensions]) => {
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    return extensions.includes(fileExtension) || file.type === mimeType;
  });

  if (!isValidType) {
    throw new Error(`Unsupported file type. Supported formats: TXT, PDF, DOC, DOCX, RTF`);
  }

  return true;
};

export const extractTextFromTXT = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(new Error('Failed to read text file'));
    reader.readAsText(file);
  });
};

export const extractTextFromDOCX = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (error) {
    throw new Error('Failed to extract text from DOCX file');
  }
};

// For now, we'll handle PDFs as binary files like audio
// A more robust PDF processing solution will be implemented server-side

export const extractTextFromRTF = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        // Basic RTF to text conversion
        let text = e.target.result;
        // Remove RTF formatting
        text = text.replace(/[\\][\w-]+/g, ''); // Remove RTF commands
        text = text.replace(/[\\][\\\{\}]/g, ''); // Remove escaped characters
        text = text.replace(/[\{\}]/g, ''); // Remove braces
        text = text.replace(/\\par[d]?/g, '\n'); // Convert paragraphs to newlines
        text = text.trim();
        resolve(text);
      } catch (error) {
        reject(new Error('Failed to process RTF file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read RTF file'));
    reader.readAsText(file);
  });
};

export const extractTextFromPDF = async (file) => {
  try {
    if (!window.pdfjsLib) {
      throw new Error('PDF.js library not loaded. Please check your internet connection.');
    }

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Use the global pdfjsLib from the CDN
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    // Get total number of pages
    const totalPages = pdf.numPages;
    let fullText = '';

    // Extract text from each page
    for (let i = 1; i <= totalPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map(item => item.str)
        .join(' ');
      fullText += pageText + '\n\n';
    }

    return fullText.trim();
  } catch (error) {
    console.error('PDF processing error:', error);
    throw new Error('Failed to process PDF file. Please ensure the file is not corrupted or password protected.');
  }
};

export const processFile = async (file) => {
  try {
    validateFile(file);

    switch(file.type) {
      case 'text/plain':
        return await extractTextFromTXT(file);
      case 'application/pdf':
        return await extractTextFromPDF(file);
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return await extractTextFromDOCX(file);
      case 'text/rtf':
      case 'application/rtf':
      case 'application/x-rtf':
      case 'text/richtext':
        return await extractTextFromRTF(file);
      default:
        throw new Error(`Unsupported file type: ${file.type}`);
    }
  } catch (error) {
    throw error;
  }
};
