const imageRepository = require('../repositories/imageRepository');
const fs = require('fs');
const path = require('path');

const uploadsPath = process.env.UPLOADS_PATH || 'uploads';
const uploadDirectory = path.isAbsolute(uploadsPath) 
    ? uploadsPath 
    : path.join(__dirname, '../../', uploadsPath);

const getMimeType = (fileName) => {
    const extension = path.extname(fileName.toLowerCase());
    switch (extension) {
        case '.jpg':
        case '.jpeg':
            return 'image/jpeg';
        case '.png':
            return 'image/png';
        case '.gif':
            return 'image/gif';
        case '.webp':
            return 'image/webp';
        case '.svg':
            return 'image/svg+xml';
        default:
            return 'image/jpeg';
    }
};

exports.getImageById = async (req, res) => {
    const imageId = req.params.id;
    
    try {
        const image = await imageRepository.getImageById(imageId);
        
        if (!image) {
            return res.status(404).json({ error: 'Imagen no encontrada' });
        }
        
        fs.readFile(image.file_path, (err, data) => {
            if (err) {
                console.error('Error al leer el archivo:', err);
                return res.status(404).json({ error: 'Archivo de imagen no encontrado' });
            }
            
            const contentType = getMimeType(image.file_name);
            res.setHeader('Content-Type', contentType);
            res.setHeader('Cache-Control', 'public, max-age=31536000');
            
            res.send(data);
        });
        
    } catch (error) {
        console.error('Error al obtener imagen:', error);
        res.status(500).json({ error: 'Error al obtener la imagen' });
    }
};

exports.uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
        }
        
        const file = req.file;
        const fileName = file.filename;
        const filePath = file.path;
        const altText = req.body.altText || null;
        
        const imageId = await imageRepository.createImage({
            fileName: fileName,
            filePath: filePath,
            altText: altText,
            isTemporary: true
        });
        
        res.status(201).json({
            success: true,
            imageId: imageId,
            message: 'Imagen subida exitosamente',
            data: {
                id: imageId,
                fileName: fileName,
                url: `/api/image/${imageId}`
            }
        });
        
    } catch (error) {
        console.error('Error al subir imagen:', error);
        
        if (req.file && req.file.path) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Error al eliminar archivo:', err);
            });
        }
        
        res.status(500).json({ error: 'Error al subir la imagen' });
    }
};

exports.deleteImage = async (req, res) => {
    const imageId = req.params.id;
    
    try {
        const success = await imageRepository.markImageAsTemporary(imageId);
        
        if (!success) {
            return res.status(404).json({ error: 'Imagen no encontrada' });
        }
        
        res.json({
            success: true,
            message: 'Imagen marcada para eliminación'
        });
        
    } catch (error) {
        console.error('Error al eliminar imagen:', error);
        res.status(500).json({ error: 'Error al eliminar la imagen' });
    }
};

exports.cleanupOldImages = async (req, res) => {
    try {
        const daysOld = req.body.daysOld || 7;
    
        const deletedImages = await imageRepository.deleteOldTemporaryImages(daysOld);
        
        let deletedCount = 0;
        for (const image of deletedImages) {
            try {
                fs.unlinkSync(image.file_path);
                deletedCount++;
            } catch (err) {
                console.error(`Error al eliminar archivo ${image.file_path}:`, err);
            }
        }
        
        res.json({
            success: true,
            message: 'Limpieza completada',
            deletedCount: deletedCount,
            totalProcessed: deletedImages.length
        });
        
    } catch (error) {
        console.error('Error en limpieza de imágenes:', error);
        res.status(500).json({ error: 'Error al limpiar imágenes' });
    }
};
