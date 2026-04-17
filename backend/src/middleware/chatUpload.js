const multer = require('multer');
const fs = require('fs');
const path = require('path');

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
    return cb(new Error('Разрешены только фото и видео'));
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

module.exports = { chatUpload };
