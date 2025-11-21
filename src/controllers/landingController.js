const landingService = require('../services/landingService');

const getPublicLandingData = async (req, res) => {
    try {
        const categories = await landingService.getLandingProjectCategories();
        const projects = await landingService.getLandingDashboardProjects();
        res.status(200).json(
            {
                message: "¡Bienvenido a AportaYa!",
                tagline: "Descubre proyectos y apoya a quienes lo necesitan.",
                extraData: {
                    categories: categories.map((category) => ({
                        id: category.id,
                        name: category.name,
                        description: category.description,
                    })),
                },
                data: {
                    projects: projects.map((project) => ({
                        id: project.id,
                        title: project.title,
                        description: project.summary,
                        category_id: project.category_id,
                        category: {
                            id: project.category_id,
                            name: project.category_name,
                        },
                        goal_amount: project.amount_goal,
                        raised_amount: project.amount_collected,
                        cover_image_url: project.cover_image_url,
                    })),
                },
            }
        );
    } catch (error) {
        console.error('Error llamando a los datos:', error);
        res.status(500).json({ error: 'Error llamando a los datos' });
    }
}

module.exports = {
    getPublicLandingData,
};