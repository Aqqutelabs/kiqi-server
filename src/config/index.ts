import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const config = {
  port: process.env.PORT || 8000,
  uploadDir: process.env.UPLOAD_DIR || 'uploads/',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE_MB || '5', 10) * 1024 * 1024, // Convert MB to Bytes
};

export default config;