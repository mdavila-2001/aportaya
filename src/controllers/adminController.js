const adminRepository = require('../repositories/adminRepository');

// ==================== ESTADÍSTICAS ====================

const getDashboardStats = async (req, res) => {
    try {
        const stats = await adminRepository.getStats();

        res.status(200).json({
            success: true,
            message: 'Estadísticas obtenidas exitosamente',
            data: {
                users: {
                    total: parseInt(stats.total_users),
                    active: parseInt(stats.active_users),
                    pending: parseInt(stats.pending_users),
                    suspended: parseInt(stats.suspended_users),
                    banned: parseInt(stats.banned_users)
                },
                projects: {
                    total: parseInt(stats.total_projects),
                    published: parseInt(stats.published_projects),
                    pending: parseInt(stats.pending_projects),
                    draft: parseInt(stats.draft_projects),
                    rejected: parseInt(stats.rejected_projects)
                },
                donations: {
                    total: parseInt(stats.total_donations),
                    total_amount: parseFloat(stats.total_donated)
                },
                categories: {
                    total: parseInt(stats.total_categories)
                }
            }
        });
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo estadísticas del dashboard'
        });
    }
};

// ==================== USUARIOS ====================

const getUsers = async (req, res) => {
    try {
        const { status, search, role, page = 1, limit = 10 } = req.query;

        const filters = {
            status,
            search,
            role,
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit)
        };

        const users = await adminRepository.getUsers(filters);

        res.status(200).json({
            success: true,
            message: 'Usuarios obtenidos exitosamente',
            data: {
                users: users.map(user => ({
                    id: user.id,
                    full_name: `${user.first_name} ${user.middle_name || ''} ${user.last_name} ${user.mother_last_name || ''}`.trim(),
                    email: user.email,
                    status: user.status,
                    role: user.role || 'Usuario',
                    registration_date: user.registration_date,
                    profile_image_url: user.profile_image_url
                })),
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: users.length
                }
            }
        });
    } catch (error) {
        console.error('Error obteniendo usuarios:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo lista de usuarios'
        });
    }
};

const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, reason } = req.body;
        const adminId = req.user.id;

        // Validar estado
        const validStatuses = ['active', 'suspended', 'banned', 'pending_verification'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Estado inválido'
            });
        }

        const updatedUser = await adminRepository.updateUserStatus(id, status, reason, adminId);

        res.status(200).json({
            success: true,
            message: 'Estado de usuario actualizado exitosamente',
            data: {
                user: {
                    id: updatedUser.id,
                    status: updatedUser.status
                }
            }
        });
    } catch (error) {
        console.error('Error actualizando estado de usuario:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error actualizando estado de usuario'
        });
    }
};

const getUserHistory = async (req, res) => {
    try {
        const { id } = req.params;

        const history = await adminRepository.getUserHistory(id);

        res.status(200).json({
            success: true,
            message: 'Historial obtenido exitosamente',
            data: {
                history: history
            }
        });
    } catch (error) {
        console.error('Error obteniendo historial:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo historial de usuario'
        });
    }
};

// ==================== ADMINISTRADORES ====================

const getAdministrators = async (req, res) => {
    try {
        const admins = await adminRepository.getAdministrators();

        res.status(200).json({
            success: true,
            message: 'Administradores obtenidos exitosamente',
            data: {
                administrators: admins.map(admin => ({
                    id: admin.id,
                    first_name: admin.first_name,
                    middle_name: admin.middle_name,
                    last_name: admin.last_name,
                    mother_last_name: admin.mother_last_name,
                    full_name: `${admin.first_name} ${admin.middle_name || ''} ${admin.last_name} ${admin.mother_last_name || ''}`.trim(),
                    email: admin.email,
                    gender: admin.gender,
                    birth_date: admin.birth_date,
                    status: admin.status,
                    registration_date: admin.registration_date,
                    profile_image_url: admin.profile_image_url
                }))
            }
        });
    } catch (error) {
        console.error('Error obteniendo administradores:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo lista de administradores'
        });
    }
};

const createAdministrator = async (req, res) => {
    try {
        const adminData = {
            firstName: req.body.firstName,
            middleName: req.body.middleName,
            lastName: req.body.lastName,
            motherLastName: req.body.motherLastName,
            email: req.body.email,
            password: req.body.password,
            gender: req.body.gender,
            birthDate: req.body.birthDate,
            profileImageId: req.body.profileImageId
        };

        const adminId = await adminRepository.createAdministrator(adminData);

        res.status(201).json({
            success: true,
            message: 'Administrador creado exitosamente',
            data: {
                id: adminId
            }
        });
    } catch (error) {
        console.error('Error creando administrador:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error creando administrador'
        });
    }
};

const updateAdministrator = async (req, res) => {
    try {
        const { id } = req.params;
        const adminData = {
            firstName: req.body.firstName,
            middleName: req.body.middleName,
            lastName: req.body.lastName,
            motherLastName: req.body.motherLastName,
            email: req.body.email,
            gender: req.body.gender,
            birthDate: req.body.birthDate,
            profileImageId: req.body.profileImageId,
            password: req.body.password // Optional
        };

        await adminRepository.updateAdministrator(id, adminData);

        res.status(200).json({
            success: true,
            message: 'Administrador actualizado exitosamente'
        });
    } catch (error) {
        console.error('Error actualizando administrador:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error actualizando administrador'
        });
    }
};

const deleteAdministrator = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que no se esté eliminando a sí mismo
        if (id === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'No puedes eliminar tu propia cuenta de administrador'
            });
        }

        await adminRepository.deleteAdministrator(id);

        res.status(200).json({
            success: true,
            message: 'Administrador eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error eliminando administrador:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error eliminando administrador'
        });
    }
};

module.exports = {
    getDashboardStats,
    getUsers,
    updateUserStatus,
    getUserHistory,
    getAdministrators,
    createAdministrator,
    updateAdministrator,
    deleteAdministrator
};
