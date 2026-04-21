const multer = require('multer');
const path = require('path');
const fs = require('fs');

const dir = path.join(process.cwd(), 'uploads', 'avatars');
fs.mkdirSync(dir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, dir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safe = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext) ? ext : '.jpg';
    cb(null, `u${req.userId}-${Date.now()}${safe}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!/^image\/(jpeg|png|webp|gif)$/i.test(file.mimetype)) {
      return cb(new Error('Разрешены только изображения JPEG, PNG, WebP или GIF'));
    }
    cb(null, true);
  }
});

module.exports = upload.single('avatar');
