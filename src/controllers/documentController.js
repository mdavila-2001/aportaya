const documentRepository = require('../repositories/documentRepository');
const fs = require('fs');
const path = require('path');

const uploadsPath = process.env.UPLOADS_PATH || 'uploads';
const uploadDirectory = path.isAbsolute(uploadsPath)
    ? uploadsPath
    : path.join(__dirname, '../../', uploadsPath);

exports.getDocumentById = async (req, res) => {
    const documentId = req.params.id;

    try {
        const document = await documentRepository.getDocumentById(documentId);

        if (!document) {
            return res.status(404).json({ error: 'Documento no encontrado' });
        }

        // Convert relative path from DB to absolute filesystem path
        let absolutePath = document.file_path;
        if (!path.isAbsolute(absolutePath)) {
            // If path starts with /uploads, replace with actual upload directory
            if (absolutePath.startsWith('/uploads')) {
                absolutePath = absolutePath.replace('/uploads', uploadDirectory);
            }
        }

        fs.readFile(absolutePath, (err, data) => {
            if (err) {
                console.error('Error al leer el archivo:', err);
                return res.status(404).json({ error: 'Archivo de documento no encontrado' });
            }

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="${document.file_name}"`);
            res.setHeader('Cache-Control', 'public, max-age=31536000');

            res.send(data);
        });

    } catch (error) {
        console.error('Error al obtener documento:', error);
        res.status(500).json({ error: 'Error al obtener el documento' });
    }
};

exports.uploadDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
        }

        const file = req.file;
        const fileName = file.filename;

        // Convert absolute path to relative path for database storage
        let relativePath = file.path;

        // Remove the base upload directory to get the relative path
        if (path.isAbsolute(uploadsPath)) {
            // If UPLOADS_PATH is absolute (e.g., /app/uploads), replace it with /uploads
            relativePath = file.path.replace(uploadsPath, '/uploads');
        } else {
            // If UPLOADS_PATH is relative (e.g., uploads), construct the path
            const pathParts = file.path.split(path.sep);
            const uploadsIndex = pathParts.indexOf('uploads');
            if (uploadsIndex !== -1) {
                relativePath = '/' + pathParts.slice(uploadsIndex).join('/');
            }
        }

        const documentType = req.body.documentType || 'proof';

        const documentId = await documentRepository.createDocument({
            fileName: fileName,
            filePath: relativePath,
            documentType: documentType,
            isTemporary: true
        });

        res.status(201).json({
            success: true,
            documentId: documentId,
            message: 'Documento subido exitosamente',
            data: {
                id: documentId,
                fileName: fileName,
                url: `/api/document/${documentId}`
            }
        });

    } catch (error) {
        console.error('Error al subir documento:', error);

        if (req.file && req.file.path) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Error al eliminar archivo:', err);
            });
        }

        res.status(500).json({ error: 'Error al subir el documento' });
    }
};

exports.deleteDocument = async (req, res) => {
    const documentId = req.params.id;

    try {
        const deletedDocument = await documentRepository.deleteDocument(documentId);

        if (!deletedDocument) {
            return res.status(404).json({ error: 'Documento no encontrado' });
        }

        fs.unlink(deletedDocument.file_path, (err) => {
            if (err) {
                console.error('Error al eliminar archivo físico:', err);
            }
        });

        res.status(200).json({
            success: true,
            message: 'Documento eliminado exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar documento:', error);
        res.status(500).json({ error: 'Error al eliminar el documento' });
    }
};

exports.cleanupOldDocuments = async (req, res) => {
    try {
        const hoursOld = req.body.hoursOld || 24;
        const deletedDocuments = await documentRepository.cleanupOldTemporaryDocuments(hoursOld);

        deletedDocuments.forEach(doc => {
            fs.unlink(doc.file_path, (err) => {
                if (err) {
                    console.error('Error al eliminar archivo físico:', err);
                }
            });
        });

        res.status(200).json({
            success: true,
            message: `${deletedDocuments.length} documentos temporales eliminados`,
            count: deletedDocuments.length
        });

    } catch (error) {
        console.error('Error en limpieza de documentos:', error);
        res.status(500).json({ error: 'Error en la limpieza de documentos' });
    }
};
