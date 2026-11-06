// ========================================================================
// SW Service Desk v1.0 - Middleware de Upload Seguro de Ficheiros
// Empresa: SW Cloud Solutions
// ========================================================================

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import { ENV } from '../config/env.js';

const uploadDir = path.resolve(process.cwd(), ENV.UPLOADS_DIR);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Extensões estritamente proibidas (executáveis, scripts, etc.)
const FORBIDDEN_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.sh', '.bash', '.bin', '.js', '.ts', '.jsx', '.tsx',
  '.php', '.py', '.rb', '.pl', '.dll', '.so', '.dylib', '.scr', '.vbs', '.com',
  '.jar', '.war', '.pif', '.application', '.gadget', '.msi', '.msp',
]);

// Tipos MIME autorizados
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'text/plain',
  'text/csv',
  'application/zip',
  'application/x-zip-compressed',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/json',
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueId = crypto.randomBytes(16).toString('hex');
    cb(null, `${uniqueId}${ext}`);
  },
});

export const secureUpload = multer({
  storage,
  limits: {
    fileSize: ENV.MAX_FILE_SIZE_MB * 1024 * 1024, // Limite de 20MB
    files: 5, // Máximo de 5 ficheiros simultâneos
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (FORBIDDEN_EXTENSIONS.has(ext)) {
      return cb(new Error(`Extensão de ficheiro proibida por motivos de segurança: ${ext}`));
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error(`Tipo de ficheiro não suportado (${file.mimetype}). Apenas documentos, imagens e arquivos ZIP são permitidos.`));
    }

    cb(null, true);
  },
});
