const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const documentController = require('../controllers/documentController');

const uploadsPath = process.env.UPLOADS_PATH || 'uploads';
const uploadDirectory = path.isAbsolute(uploadsPath) 
    ? uploadsPath 
    : path.join(__dirname, '../../', uploadsPath);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Determinar el subdirectorio según el tipo de documento
        const documentType = req.body.documentType || req.query.documentType || 'general';
        let subDir = 'documents';
        
        if (documentType === 'proof') {
            subDir = 'documents/proof';
        }
        
        const finalPath = path.join(uploadDirectory, subDir);
        cb(null, finalPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, uniqueSuffix + extension);
    }
});

const fileFilter = (req, file, cb) => {
    // Solo permitir PDFs
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Tipo de archivo no permitido. Solo se permiten archivos PDF'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB máximo para PDFs
    }
});

router.get('/:id', documentController.getDocumentById);
router.post('/', upload.single('file'), documentController.uploadDocument);
router.delete('/:id', documentController.deleteDocument);
router.post('/cleanup', documentController.cleanupOldDocuments);

module.exports = router;
