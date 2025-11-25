const projectRepository = require('../repositories/projectRepository');
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

        const projectId = await projectRepository.createProject(projectData, userId);
        
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
        const { searchBy, filterBy } = req.query;
        
        const filters = filterBy ? JSON.parse(filterBy) : null;

        const categories = await projectRepository.getProjectCategories();

        const projects = await projectRepository.getProjects(searchBy, filters); // Pasar los parámetros al servicio

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
        const project = await projectRepository.getProjectDetail(slug);
        if (!project) {
            return res.status(404).json({
                message: 'Proyecto no encontrado'
            });
        }
        res.status(200).json({
            message: 'Proyecto obtenido exitosamente',
            data: project
        });
    } catch (error) {
        console.error('Error obteniendo proyecto:', error);
        res.status(500).json({
            message: error.message || 'Error al obtener el proyecto'
        });
    }
}

module.exports = {
    createProject,
    getProjects,
    getProjectDetail
};
