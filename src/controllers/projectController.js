const projectService = require('../services/projectService');
const documentRepository = require('../repositories/documentRepository');

const createProject = async (req, res) => {
    try {
        const userId = req.user.id; // Del middleware de autenticación
        
        const projectData = {
            title: req.body.title,
            description: req.body.description,
            financialGoal: req.body.financialGoal,
            endDate: req.body.endDate,
            categoryId: req.body.categoryId,
            location: req.body.location,
            coverImageId: req.body.coverImageId,
            videoUrl: req.body.videoUrl,
            proofDocumentId: req.body.proofDocumentId
        };

        const projectId = await projectService.createProject(projectData, userId);
        
        // Si hay documento de prueba, marcarlo como permanente
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
        const projects = await projectService.getProjects();
        res.status(200).json({
            message: 'Proyectos obtenidos exitosamente',
            extraData: {
                totalProjects: projects.length,
                categories: projects.map(project => ({
                    id: project.category_id,
                    name: project.name,
                })),
            },
            data: {
                projects: projects.map(project => ({
                    id: project.id,
                    title: project.title,
                    category_id: project.category_id,
                    category_name: project.name,
                    goal_amount: project.financial_goal,
                    raised_amount: project.raised_amount,
                    description: project.description,
                    cover_image_url: project.cover_image_url,
                })),
            }
        });
    } catch (error) {
        console.error('Error al obtener proyectos:', error);
        res.status(500).json({
            message: 'Error al obtener los proyectos'
        });
    }
};

module.exports = {
    createProject,
    getProjects
};
