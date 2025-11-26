const { dbPool } = require('../config/dbConnection');

const checkPermissions = async (userId, moduleName, abilityName) => {
    try {
        const query = "SELECT roles.check_user_permission($1, $2, $3) AS has_permission";
        const result = await dbPool.query(query, [userId, moduleName, abilityName]);

        return result.rows[0].has_permission === true;
    } catch (error) {
        throw new Error('Error al verificar permisos: ' + error.message);
        return false;
    }
}

module.exports = {
    checkPermissions
}