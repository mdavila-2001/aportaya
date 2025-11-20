const { verifyToken } = require('../utils/jwt');
const { checkPermissions } = require('../utils/auth');


const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Acceso denegado. No se proporcionó el token.' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(401).json({ message: 'Token inválido o expirado.' });
    }

    req.user = decoded;
    next();
};

const requirePermission = (moduleName, abilityName) => async (req, res, next) => {
    if (!req.user?.id) {
        return res.status(401).json({ message: 'Usuario no autenticado para verificar permisos.' });
    }

    const hasPermission = await checkPermissions(req.user.id, moduleName, abilityName);

    if (!hasPermission) {
        return res.status(403).json({ message: 'No tienes permisos suficientes para esta acción.' });
    }

    next();
};

module.exports = {
    authenticate,
    requirePermission
};