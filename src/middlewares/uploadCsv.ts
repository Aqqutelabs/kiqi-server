// Multer config for single file upload (csv)
import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({ storage });

export default upload;
