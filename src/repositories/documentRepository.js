const { dbPool } = require('../config/dbConnection');

const createDocument = async (documentData) => {
    const query = `
        INSERT INTO files.document (file_name, file_path, document_type, is_temporary)
        VALUES ($1, $2, $3, $4)
        RETURNING id
    `;
    
    const values = [
        documentData.fileName,
        documentData.filePath,
        documentData.documentType || 'proof',
        documentData.isTemporary !== undefined ? documentData.isTemporary : true
    ];
    
    const result = await dbPool.query(query, values);
    return result.rows[0].id;
};

const getDocumentById = async (documentId) => {
    const query = 'SELECT * FROM files.document WHERE id = $1';
    const result = await dbPool.query(query, [documentId]);
    return result.rows[0];
};

const markDocumentAsPermanent = async (documentId) => {
    const query = 'UPDATE files.document SET is_temporary = FALSE WHERE id = $1';
    await dbPool.query(query, [documentId]);
};

const deleteDocument = async (documentId) => {
    const query = 'DELETE FROM files.document WHERE id = $1 RETURNING file_path';
    const result = await dbPool.query(query, [documentId]);
    return result.rows[0];
};

const cleanupOldTemporaryDocuments = async (hoursOld = 24) => {
    const query = `
        DELETE FROM files.document
        WHERE is_temporary = TRUE 
        AND uploaded_at < NOW() - INTERVAL '${hoursOld} hours'
        RETURNING file_path
    `;
    
    const result = await dbPool.query(query);
    return result.rows;
};

module.exports = {
    createDocument,
    getDocumentById,
    markDocumentAsPermanent,
    deleteDocument,
    cleanupOldTemporaryDocuments
};
