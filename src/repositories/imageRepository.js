const { dbPool } = require('../config/dbConnection');

const getImageById = async (id) => {
    const query = `
        SELECT id, file_name, file_path, alt_text, is_temporary, uploaded_at
        FROM files.image
        WHERE id = $1
    `;
    
    const result = await dbPool.query(query, [id]);
    
    if (result.rows.length === 0) {
        return null;
    }
    
    return result.rows[0];
};

const createImage = async ({ fileName, filePath, altText = null, isTemporary = true }) => {
    const query = `
        SELECT files.create_image($1, $2, $3, $4) as image_id
    `;
    
    const result = await dbPool.query(query, [fileName, filePath, altText, isTemporary]);
    
    return result.rows[0].image_id;
};

const markImageAsPermanent = async (id) => {
    const query = `
        SELECT files.mark_image_as_permanent($1) as success
    `;
    
    const result = await dbPool.query(query, [id]);
    
    return result.rows[0].success;
};

const markImageAsTemporary = async (id) => {
    const query = `
        SELECT files.mark_image_as_temporary($1) as success
    `;
    
    const result = await dbPool.query(query, [id]);
    
    return result.rows[0].success;
};

const deleteOldTemporaryImages = async (daysOld = 7) => {
    const query = `
        SELECT * FROM files.cleanup_old_temporary_images($1)
    `;
    
    const result = await dbPool.query(query, [daysOld]);
    
    return result.rows;
};

module.exports = {
    getImageById,
    createImage,
    markImageAsPermanent,
    markImageAsTemporary,
    deleteOldTemporaryImages
};
