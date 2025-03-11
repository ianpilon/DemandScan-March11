import express from 'express';
import multer from 'multer';
import cors from 'cors';
import PDFParser from 'pdf2json';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 4000;

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
  },
});

app.use(cors());
app.use(express.json());

// PDF processing endpoint
app.post('/api/process-pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'File must be a PDF' });
    }

    const pdfParser = new PDFParser();

    const parsePromise = new Promise((resolve, reject) => {
      pdfParser.on('pdfParser_dataReady', (pdfData) => {
        resolve(pdfData);
      });
      pdfParser.on('pdfParser_dataError', (error) => {
        reject(error);
      });
    });

    pdfParser.parseBuffer(req.file.buffer);
    const pdfData = await parsePromise;
    
    // Convert PDF data to text, handling special characters
    const text = decodeURIComponent(pdfData.Pages
      .map(page => page.Texts
        .map(text => text.R
          .map(r => r.T)
          .join(' '))
        .join(' '))
      .join('\n'));
    
    return res.json({
      text,
      numPages: pdfData.Pages.length,
      info: pdfData.Meta
    });
  } catch (error) {
    console.error('PDF processing error:', error);
    return res.status(500).json({ error: 'Failed to process PDF file' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
