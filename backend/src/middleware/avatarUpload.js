const multer = require('multer');

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!/^image\/(jpeg|png|webp|gif)$/i.test(file.mimetype)) {
      return cb(new Error('Разрешены только изображения JPEG, PNG, WebP или GIF'));
    }
    cb(null, true);
  }
});

module.exports = (req, res, next) => {
  upload.single('avatar')(req, res, (err) => {
    if (err?.code === 'LIMIT_FILE_SIZE') {
      return next(new Error('Файл слишком большой. Максимальный размер: 10 МБ'));
    }
    return next(err);
  });
};
