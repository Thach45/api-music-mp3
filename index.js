const path = require('path')
const express = require("express")
const app = express()
const cors = require("cors")
const multer = require('multer')
const sharp = require('sharp')
const fs = require('fs-extra')
const port = process.env.PORT || 3000

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads')
fs.ensureDirSync(uploadsDir)

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir)
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed!'), false)
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
})

// Page Home
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, '/index.html'))
})

// Image Demo Page
app.get("/image-demo", (req, res) => {
  res.sendFile(path.join(__dirname, '/image-demo.html'))
})

// ZingMp3Router
const ZingMp3Router = require("./routers/api/ZingRouter")
app.use("/api", cors(), ZingMp3Router)

const ImageRouter = require('./routers/api/ImageRouter');
app.use('/api/images', ImageRouter);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// GET all images
app.get('/api/images', async (req, res) => {
  try {
    const files = await fs.readdir(uploadsDir)
    const images = files.filter(file => {
      const ext = path.extname(file).toLowerCase()
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)
    })
    
    const imageList = images.map(file => ({
      filename: file,
      url: `/uploads/${file}`,
      size: fs.statSync(path.join(uploadsDir, file)).size,
      uploadedAt: fs.statSync(path.join(uploadsDir, file)).mtime
    }))
    
    res.json({
      success: true,
      data: imageList
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get images'
    })
  }
})

// GET single image by filename
app.get('/api/images/:filename', (req, res) => {
  const filename = req.params.filename
  const imagePath = path.join(uploadsDir, filename)
  
  if (fs.existsSync(imagePath)) {
    res.sendFile(imagePath)
  } else {
    res.status(404).json({
      success: false,
      error: 'Image not found'
    })
  }
})

// POST upload single image
app.post('/api/images/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      })
    }

    const imageInfo = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
      size: req.file.size,
      mimetype: req.file.mimetype
    }

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: imageInfo
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to upload image'
    })
  }
})

// POST upload multiple images
app.post('/api/images/upload-multiple', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No image files provided'
      })
    }

    const uploadedImages = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      url: `/uploads/${file.filename}`,
      size: file.size,
      mimetype: file.mimetype
    }))

    res.json({
      success: true,
      message: `${uploadedImages.length} images uploaded successfully`,
      data: uploadedImages
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to upload images'
    })
  }
})

// DELETE image
app.delete('/api/images/:filename', async (req, res) => {
  try {
    const filename = req.params.filename
    const imagePath = path.join(uploadsDir, filename)
    
    if (fs.existsSync(imagePath)) {
      await fs.remove(imagePath)
      res.json({
        success: true,
        message: 'Image deleted successfully'
      })
    } else {
      res.status(404).json({
        success: false,
        error: 'Image not found'
      })
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete image'
    })
  }
})

// Image processing endpoint (resize, format conversion)
app.post('/api/images/process', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      })
    }

    const { width, height, format = 'jpeg', quality = 80 } = req.body
    const inputPath = req.file.path
    const outputFilename = `processed-${req.file.filename}`
    const outputPath = path.join(uploadsDir, outputFilename)

    let sharpInstance = sharp(inputPath)

    // Resize if width or height provided
    if (width || height) {
      sharpInstance = sharpInstance.resize(
        width ? parseInt(width) : undefined,
        height ? parseInt(height) : undefined,
        { fit: 'inside', withoutEnlargement: true }
      )
    }

    // Convert format and set quality
    await sharpInstance
      .toFormat(format, { quality: parseInt(quality) })
      .toFile(outputPath)

    const processedImageInfo = {
      filename: outputFilename,
      originalName: req.file.originalname,
      url: `/uploads/${outputFilename}`,
      size: fs.statSync(outputPath).size,
      format: format,
      width: width,
      height: height
    }

    res.json({
      success: true,
      message: 'Image processed successfully',
      data: processedImageInfo
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to process image'
    })
  }
})

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 10MB'
      })
    }
  }
  
  res.status(500).json({
    success: false,
    error: error.message || 'Something went wrong'
  })
})

// Page Error
app.get("*", (req, res) => {
  res.send("Nhập Sai Đường Dẫn! Vui Lòng Nhập Lại >.<")
});

app.listen(port, () => {
  console.log(`Start server listen at http://localhost:${port}`)
  console.log(`Image upload server ready at http://localhost:${port}/api/images`)
});
