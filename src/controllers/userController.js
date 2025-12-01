const userRepository = require('../repositories/userRepository');

// GET /api/user/home - Dashboard unificado
const getUserHome = async (req, res) => {
    try {
        const userId = req.user.id;

        const dashboardData = await userRepository.getUserDashboardData(userId);

        if (!dashboardData.user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Formatear nombre completo
        const fullName = [
            dashboardData.user.first_name,
            dashboardData.user.middle_name,
            dashboardData.user.last_name,
            dashboardData.user.mother_last_name
        ].filter(Boolean).join(' ');

        res.json({
            success: true,
            data: {
                user: {
                    name: fullName,
                    email: dashboardData.user.email
                },
                projects: dashboardData.projects,
                activity: dashboardData.activity,
                recommended: dashboardData.recommended
            }
        });
    } catch (error) {
        console.error('Error getting user home:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener datos del dashboard'
        });
    }
};

module.exports = {
    getUserHome
};
