const { verifyToken } = require('../utils/jwt');
const { checkPermissions } = require('../utils/auth');


const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ success: false, message: 'Acceso denegado. No se proporcionó el token.' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(401).json({ success: false, message: 'Token inválido o expirado.' });
    }

    req.user = decoded;
    next();
};

const _ensureUserFromHeader = (req) => {
    if (req.user && req.user.id) return req.user;
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return null;
    return verifyToken(token);
};

const requirePermission = (moduleName, abilityName) => async (req, res, next) => {
    try {
        const user = _ensureUserFromHeader(req);
        if (!user || !user.id) {
            return res.status(401).json({ success: false, message: 'Usuario no autenticado para verificar permisos.' });
        }

        req.user = req.user || user;

        const hasPermission = await checkPermissions(req.user.id, moduleName, abilityName);

        if (!hasPermission) {
            return res.status(403).json({ success: false, message: 'No tienes permisos suficientes para esta acción.' });
        }

        next();
    } catch (error) {
        console.error('Error en requirePermission middleware:', error);
        res.status(500).json({ success: false, message: 'Error verificando permisos.' });
    }
};

const requireRoles = (allowedRoles) => (req, res, next) => {
    try {
        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

        const user = _ensureUserFromHeader(req);
        if (!user || !user.id) {
            return res.status(401).json({ success: false, message: 'No autenticado.' });
        }

        req.user = req.user || user;

        const userRole = req.user.role;
        if (!roles.includes(userRole)) {
            return res.status(403).json({ success: false, message: 'Acceso denegado. Rol insuficiente.' });
        }

        next();
    } catch (error) {
        console.error('Error en requireRoles middleware:', error);
        res.status(500).json({ success: false, message: 'Error verificando rol.' });
    }
};

module.exports = {
    authenticate,
    requirePermission,
    requireRoles
};