const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const imageController = require('../controllers/imageController');

const uploadsPath = process.env.UPLOADS_PATH || 'uploads';
const uploadDirectory = path.isAbsolute(uploadsPath)
    ? uploadsPath
    : path.join(__dirname, '../../', uploadsPath);

// Ensure subdirectories exist
const ensureDirectoryExists = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

// Create subdirectories on startup
ensureDirectoryExists(uploadDirectory);
ensureDirectoryExists(path.join(uploadDirectory, 'avatar'));
ensureDirectoryExists(path.join(uploadDirectory, 'projects'));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const imageType = req.body.imageType || req.query.imageType || 'general';
        let subDir = '';

        if (imageType === 'avatar' || imageType === 'profile') {
            subDir = 'avatar';
        } else if (imageType === 'project') {
            subDir = 'projects';
        }

        const finalPath = subDir ? path.join(uploadDirectory, subDir) : uploadDirectory;
        ensureDirectoryExists(finalPath);
        cb(null, finalPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, uniqueSuffix + extension);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes (JPEG, PNG, GIF, WEBP)'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

router.get('/:id', imageController.getImageById);
router.post('/', upload.single('file'), imageController.uploadImage);
router.delete('/:id', imageController.deleteImage);
router.post('/cleanup', imageController.cleanupOldImages);

module.exports = router;
