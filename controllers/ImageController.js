const path = require('path');
const fs = require('fs-extra');

const uploadsDir = path.join(__dirname, '../../uploads');

exports.upload = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No image file provided' });
  }
  res.json({
    success: true,
    data: {
      filename: req.file.filename,
      url: `/uploads/${req.file.filename}`,
      size: req.file.size,
      mimetype: req.file.mimetype
    }
  });
};

exports.list = async (req, res) => {
  try {
    const files = await fs.readdir(uploadsDir);
    const images = files.filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file));
    res.json({
      success: true,
      data: images.map(filename => ({
        filename,
        url: `/uploads/${filename}`
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get images' });
  }
};

exports.delete = async (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, filename);
  if (await fs.pathExists(filePath)) {
    await fs.remove(filePath);
    res.json({ success: true, message: 'Image deleted' });
  } else {
    res.status(404).json({ success: false, error: 'Image not found' });
  }
}; 