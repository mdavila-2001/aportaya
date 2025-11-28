const { verifyToken } = require('../utils/jwt');

const isAdmin = async (req, res, next) => {
    try {
        
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'No autenticado'
            });
        }

        
        const userRole = req.user.role;

        if (userRole !== 'Administrador') {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Se requieren permisos de administrador.'
            });
        }

        next();
    } catch (error) {
        console.error('Error en middleware isAdmin:', error);
        res.status(500).json({
            success: false,
            message: 'Error verificando permisos de administrador'
        });
    }
};

module.exports = {
    isAdmin
};
