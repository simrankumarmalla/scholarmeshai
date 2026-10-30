import pdf from 'pdf-parse/lib/pdf-parse.js';

export async function extractTextFromUpload(fileBuffer, originalFilename, mimeType) {
  if (!fileBuffer || fileBuffer.length === 0) {
    throw new Error('Empty file buffer provided');
  }

  const filename = (originalFilename || '').toLowerCase();

  try {
    if (filename.endsWith('.pdf') || mimeType === 'application/pdf') {
      const data = await pdf(fileBuffer);
      const text = data.text ? data.text.trim() : '';
      if (!text || text.length < 20) {
        throw new Error('Could not extract readable text from PDF. The document may be scanned or empty.');
      }
      const wordCount = text.split(/\s+/).filter(Boolean).length;
      return { text, wordCount };
    }

    // Handle .txt, .md, or other text types
    const text = fileBuffer.toString('utf-8').trim();
    if (!text) {
      throw new Error('Text document contains no readable text');
    }
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    return { text, wordCount };
  } catch (error) {
    console.error('[pdfParserService] Extraction error:', error.message);
    throw new Error(`Document parsing failed: ${error.message}`);
  }
}

export default {
  extractTextFromUpload
};
