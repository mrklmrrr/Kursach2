const multer = require('multer');
const ApiError = require('../utils/ApiError');

let fileTypeFromBufferCompat = null;

async function getFileTypeFromBuffer(buffer) {
  if (!fileTypeFromBufferCompat) {
    const fileTypeModule = await import('file-type');
    fileTypeFromBufferCompat = fileTypeModule.fileTypeFromBuffer
      || (fileTypeModule.default && fileTypeModule.default.fileTypeFromBuffer);
  }
  if (typeof fileTypeFromBufferCompat !== 'function') {
    throw new ApiError(500, 'file-type detector is unavailable');
  }
  return fileTypeFromBufferCompat(buffer);
}

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  const isImage = file.mimetype.startsWith('image/');
  const isVideo = file.mimetype.startsWith('video/');
  if (!isImage && !isVideo) {
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
  if (!req.file || !req.file.buffer) {
    return next();
  }

  try {
    const slice = req.file.buffer.length > 4100 ? req.file.buffer.subarray(0, 4100) : req.file.buffer;
    const detectedType = await getFileTypeFromBuffer(slice);
    const validMime = detectedType && (detectedType.mime.startsWith('image/') || detectedType.mime.startsWith('video/'));
    if (!validMime) {
      return next(ApiError.badRequest('Файл не прошел проверку сигнатуры'));
    }
    return next();
  } catch {
    return next(ApiError.badRequest('Ошибка проверки загруженного файла'));
  }
}

module.exports = { chatUpload, validateUploadedFile };
