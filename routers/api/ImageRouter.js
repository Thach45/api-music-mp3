const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const ImageController = require('../../controllers/ImageController');

const uploadsDir = path.join(__dirname, '../../uploads');
fs.ensureDirSync(uploadsDir);

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + unique + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed!'), false);
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

const router = express.Router();

router.post('/upload', upload.single('image'), ImageController.upload);
router.get('/', ImageController.list);
router.delete('/:filename', ImageController.delete);

module.exports = router; 