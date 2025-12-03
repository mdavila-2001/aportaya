const projectRepository = require('../repositories/projectRepository');
const documentRepository = require('../repositories/documentRepository');

const createProject = async (req, res) => {
    try {
        const userId = req.user.id;

        const projectData = {
            title: req.body.title,
            summary: req.body.summary,
            description: req.body.description,
            financialGoal: req.body.financialGoal,
            endDate: req.body.endDate,
            categoryId: req.body.categoryId,
            location: req.body.location,
            coverImageId: req.body.coverImageId,
            videoUrl: req.body.videoUrl,
            proofDocumentId: req.body.proofDocumentId
        };

        const projectId = await projectRepository.createProject(projectData, userId);


        if (projectData.proofDocumentId) {
            await documentRepository.markDocumentAsPermanent(projectData.proofDocumentId);
        }

        res.status(201).json({
            success: true,
            message: 'Proyecto creado exitosamente',
            projectId: projectId
        });
    } catch (error) {
        console.error('Error al crear proyecto:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error al crear el proyecto'
        });
    }
};

const getProjects = async (req, res) => {
    try {
        const { searchBy, userId } = req.query;

        const categories = await projectRepository.getProjectCategories();

        const projects = await projectRepository.getProjects(searchBy, null);

        let favoritedProjectIds = [];
        const userIdToCheck = userId || (req.user ? req.user.id : null);

        if (userIdToCheck) {
            const favoriteRepository = require('../repositories/favoriteRepository');
            const projectIds = projects.map(p => p.id);
            if (projectIds.length > 0) {
                favoritedProjectIds = await favoriteRepository.checkIfFavorited(userIdToCheck, projectIds);
            }
        }

        res.status(200).json({
            message: 'Proyectos obtenidos exitosamente',
            extraData: {
                totalProjects: projects.length,
                categories: categories.map(category => ({
                    id: category.id,
                    name: category.name,
                })),
            },
            data: {
                projects: projects.map(project => ({
                    id: project.id,
                    title: project.title,
                    slug: project.slug,
                    category_id: project.category_id,
                    category_name: project.category_name,
                    goal_amount: project.goal_amount,
                    raised_amount: project.raised_amount,
                    description: project.description,
                    cover_image_url: project.cover_image_url,
                    is_favorite: favoritedProjectIds.includes(project.id)
                })),
            }
        });
    } catch (error) {
        console.error('Error obteniendo proyectos:', error);
        res.status(500).json({
            message: 'Error obteniendo proyectos',
            error: error.message,
        });
    }
};

const getProjectDetail = async (req, res) => {
    const { slug } = req.params;
    try {
        const project = await projectRepository.getProjectsBySLUG(slug);
        if (!project) {
            return res.status(404).json({
                message: 'Proyecto no encontrado'
            });
        }

        const categories = await projectRepository.getProjectCategories();

        const donors = await projectRepository.getProjectDonors(project.id);
        const comments = await projectRepository.getProjectComments(project.id);

        const userId = req.user?.id;
        const isOwner = userId && project.creator_id === userId;

        const updates = isOwner ? await projectRepository.getProjectUpdates(project.id) : [];

        res.status(200).json({
            message: 'Proyecto obtenido exitosamente',
            extraData: {
                categories: categories.map(category => ({
                    id: category.id,
                    name: category.name,
                })),
                is_owner: isOwner
            },
            data: {
                project: {
                    id: project.id,
                    title: project.title,
                    slug: project.slug,
                    category_name: project.category_name,
                    creator_name: project.creator_name,
                    creator_image: project.creator_image,
                    goal_amount: project.goal_amount,
                    raised_amount: project.raised_amount,
                    description: project.description,
                    cover_image_url: project.cover_image_url,
                    location: project.location,
                    start_date: project.start_date,
                    end_date: project.end_date
                },
                donors: donors.map(donor => ({
                    name: donor.donor_name,
                    avatar: donor.donor_avatar,
                    amount: donor.amount,
                    date: donor.created_at
                })),
                comments: comments.map(comment => ({
                    id: comment.id,
                    content: comment.content,
                    author_name: comment.author_name,
                    author_avatar: comment.author_avatar,
                    created_at: comment.created_at
                })),
                updates: updates.map(update => ({
                    id: update.id,
                    title: update.title,
                    content: update.content,
                    created_at: update.created_at
                }))
            }
        });
    } catch (error) {
        console.error('Error obteniendo proyecto:', error);
        res.status(500).json({
            message: error.message || 'Error al obtener el proyecto'
        });
    }
}

const createComment = async (req, res) => {
    const { slug } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    try {
        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'El contenido del comentario no puede estar vacío'
            });
        }

        if (content.length > 1000) {
            return res.status(400).json({
                success: false,
                message: 'El comentario no puede exceder 1000 caracteres'
            });
        }

        const project = await projectRepository.getProjectsBySLUG(slug);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Proyecto no encontrado'
            });
        }

        const comment = await projectRepository.createComment(project.id, userId, content.trim());

        res.status(201).json({
            success: true,
            message: 'Comentario creado exitosamente',
            data: {
                comment: {
                    id: comment.id,
                    content: comment.content,
                    author_name: comment.author_name,
                    author_avatar: comment.author_avatar,
                    created_at: comment.created_at
                }
            }
        });
    } catch (error) {
        console.error('Error creando comentario:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error al crear el comentario'
        });
    }
};

const getMyProjects = async (req, res) => {
    try {
        const userId = req.user.id;
        const projects = await projectRepository.getProjectsByCreator(userId);

        res.status(200).json({
            success: true,
            data: {
                projects
            }
        });
    } catch (error) {
        console.error('Error obteniendo mis proyectos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener tus proyectos'
        });
    }
};

const getProjectCategories = async (req, res) => {
    try {
        const categories = await projectRepository.getProjectCategories();

        res.json({
            success: true,
            categories: categories
        });
    } catch (error) {
        console.error('Error obteniendo categorías:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener categorías',
            error: error.message
        });
    }
};

const getProjectForEdit = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const project = await projectRepository.getProjectById(id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Proyecto no encontrado'
            });
        }

        if (project.creator_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para editar este proyecto'
            });
        }

        res.json({
            success: true,
            data: {
                project
            }
        });
    } catch (error) {
        console.error('Error obteniendo proyecto para edición:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el proyecto'
        });
    }
};

const updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { title, description, summary, endDate } = req.body;

        if (!title && !description && !summary && !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Debes proporcionar al menos un campo para actualizar'
            });
        }

        const project = await projectRepository.getProjectById(id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Proyecto no encontrado'
            });
        }

        if (project.creator_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para editar este proyecto'
            });
        }

        if (endDate) {
            const endDateObj = new Date(endDate);
            const now = new Date();

            if (endDateObj <= now) {
                return res.status(400).json({
                    success: false,
                    message: 'La fecha límite debe ser posterior a la fecha actual'
                });
            }
        }

        const updateData = {};
        if (title) updateData.title = title.trim();
        if (description) updateData.description = description.trim();
        if (summary) updateData.summary = summary.trim();
        if (endDate) updateData.endDate = endDate;

        const success = await projectRepository.updateProject(id, updateData);

        if (!success) {
            return res.status(500).json({
                success: false,
                message: 'Error al actualizar el proyecto'
            });
        }

        res.json({
            success: true,
            message: 'Proyecto actualizado exitosamente'
        });
    } catch (error) {
        console.error('Error actualizando proyecto:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error al actualizar el proyecto'
        });
    }
};

module.exports = {
    createProject,
    getProjects,
    getProjectDetail,
    createComment,
    getMyProjects,
    getProjectCategories,
    getProjectForEdit,
    updateProject
};
