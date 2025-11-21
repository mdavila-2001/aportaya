const { dbPool } = require('../config/dbConnection');

const getLandingProjectCategories = async () => {
    try {
        const sql = `
            --SELECT * FROM projects.top_project_categories
            SELECT
                *
            FROM 
                projects.category c
            LIMIT 5;
        `;
        const { rows } = await dbPool.query(sql);
        return rows;
    } catch (error) {
        console.error('Error llamando a las categorias:', error);
        throw error;
    }
}

const getLandingDashboardProjects = async () => {
    try {
        const query = `
            SELECT * FROM projects.dashboard_projects
        `;
        const { rows } = await dbPool.query(query);
        return rows;
    } catch (error) {
        console.error('Error llamando a los datos:', error);
        throw error;
    }
};

module.exports = {
    getLandingProjectCategories,
    getLandingDashboardProjects
}