const multer = require('multer');
const fs = require('fs');
const path = require('path');
let fileTypeFromFileCompat = null;

async function detectFileType(filePath) {
  if (!fileTypeFromFileCompat) {
    const fileTypeModule = await import('file-type');
    fileTypeFromFileCompat = fileTypeModule.fileTypeFromFile
      || (fileTypeModule.default && fileTypeModule.default.fileTypeFromFile);
  }

  if (typeof fileTypeFromFileCompat !== 'function') {
    const ApiError = require('../utils/ApiError');
    throw new ApiError(500, 'file-type detector is unavailable');
  }

  return fileTypeFromFileCompat(filePath);
}

const chatUploadDir = path.join(process.cwd(), 'uploads', 'chat');

if (!fs.existsSync(chatUploadDir)) {
  fs.mkdirSync(chatUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, chatUploadDir),
  filename: (req, file, cb) => {
    const safeOriginalName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safeOriginalName}`);
  }
});

function fileFilter(req, file, cb) {
  const isImage = file.mimetype.startsWith('image/');
  const isVideo = file.mimetype.startsWith('video/');
  if (!isImage && !isVideo) {
    const ApiError = require('../utils/ApiError');
    return cb(new ApiError(400, 'Разрешены только фото и видео'));
  }
  cb(null, true);
}

const chatUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024
  }
});

async function validateUploadedFile(req, res, next) {
  if (!req.file || !req.file.path) {
    return next();
  }

  try {
    const detectedType = await detectFileType(req.file.path);
    const validMime = detectedType && (detectedType.mime.startsWith('image/') || detectedType.mime.startsWith('video/'));
    if (!validMime) {
      fs.unlinkSync(req.file.path);
      return next(new Error('Файл не прошел проверку сигнатуры'));
    }
    return next();
  } catch (error) {
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return next(require('../utils/ApiError').badRequest('Ошибка проверки загруженного файла'));
  }
}

module.exports = { chatUpload, validateUploadedFile };
