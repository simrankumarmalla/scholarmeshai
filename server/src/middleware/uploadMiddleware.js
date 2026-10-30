import multer from 'multer';
import path from 'path';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.txt', '.md'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext) || file.mimetype === 'application/pdf' || file.mimetype === 'text/plain' || file.mimetype === 'text/markdown') {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file format. Please upload a .pdf, .txt, or .md document.'));
  }
};

export const uploadSingle = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 Megabytes
  },
  fileFilter
}).single('document');

export default uploadSingle;
