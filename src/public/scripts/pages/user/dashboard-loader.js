// User Dashboard Loader - Simple JavaScript

const API_BASE = '/api/user';

// Cargar datos del dashboard
async function loadUserDashboard() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '../auth/login.html';
            return;
        }

        // Cargar info del usuario
        await loadUserInfo(token);

        // Cargar proyectos activos del usuario
        await loadActiveProjects(token);

        // Cargar actividad reciente
        await loadRecentActivity(token);

        // Cargar proyectos recomendados
        await loadRecommendedProjects(token);

    } catch (error) {
        console.error('Error loading user dashboard:', error);
    }
}

// Cargar información del usuario
async function loadUserInfo(token) {
    try {
        const response = await fetch(`${API_BASE}/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '../auth/login.html';
            }
            return;
        }

        const result = await response.json();
        const user = result.data;

        // Actualizar bienvenida
        document.getElementById('welcome-title').textContent = `¡Hola, ${user.name}!`;
        document.getElementById('welcome-subtitle').textContent = 'Bienvenido a tu dashboard';

    } catch (error) {
        console.error('Error loading user info:', error);
    }
}

// Cargar proyectos activos del usuario
async function loadActiveProjects(token) {
    try {
        const response = await fetch(`${API_BASE}/my-projects?status=active`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) return;

        const result = await response.json();
        renderActiveProjects(result.data.projects || []);

    } catch (error) {
        console.error('Error loading active projects:', error);
        document.getElementById('active-projects').innerHTML = '<p class="loading-text">Error al cargar proyectos</p>';
    }
}

// Renderizar proyectos activos
function renderActiveProjects(projects) {
    const container = document.getElementById('active-projects');

    if (projects.length === 0) {
        container.innerHTML = '<p class="loading-text">No tienes proyectos activos</p>';
        return;
    }

    container.innerHTML = projects.slice(0, 4).map(project => `
        <div class="project-card">
            <div class="project-card-image" style="background-image: url('${project.image_url || '/images/placeholder.jpg'}')"></div>
            <div class="project-card-content">
                <h3 class="project-card-title">${project.title}</h3>
                <p class="project-card-description">${project.description}</p>
                <div class="project-card-progress">
                    <div class="progress-info">
                        <span class="progress-amount">Bs. ${project.current_amount || 0}</span>
                        <span class="progress-percentage">${calculatePercentage(project.current_amount, project.goal_amount)}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${calculatePercentage(project.current_amount, project.goal_amount)}%"></div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Calcular porcentaje
function calculatePercentage(current, goal) {
    if (!goal || goal === 0) return 0;
    return Math.min(Math.round((current / goal) * 100), 100);
}

// Cargar actividad reciente
async function loadRecentActivity(token) {
    try {
        const response = await fetch(`${API_BASE}/activity/recent`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) return;

        const result = await response.json();
        renderRecentActivity(result.data.activities || []);

    } catch (error) {
        console.error('Error loading recent activity:', error);
        document.getElementById('recent-activity').innerHTML = '<p class="loading-text">Error al cargar actividad</p>';
    }
}

// Renderizar actividad reciente
function renderRecentActivity(activities) {
    const container = document.getElementById('recent-activity');

    if (activities.length === 0) {
        container.innerHTML = '<p class="loading-text">No hay actividad reciente</p>';
        return;
    }

    container.innerHTML = activities.slice(0, 5).map(activity => `
        <div class="activity-item">
            <div class="activity-icon">
                <span class="material-symbols-outlined">${getActivityIcon(activity.type)}</span>
            </div>
            <div class="activity-content">
                <p class="activity-text">${activity.description}</p>
                <p class="activity-time">${formatTimeAgo(activity.created_at)}</p>
            </div>
        </div>
    `).join('');
}

// Obtener ícono según tipo de actividad
function getActivityIcon(type) {
    const icons = {
        'donation': 'volunteer_activism',
        'comment': 'chat_bubble',
        'project_update': 'update',
        'approval': 'approval_delegation'
    };
    return icons[type] || 'notifications';
}

// Formatear tiempo relativo
function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'Hace unos segundos';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} minutos`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} horas`;
    return `Hace ${Math.floor(diff / 86400)} días`;
}

// Cargar proyectos recomendados
async function loadRecommendedProjects(token) {
    try {
        const response = await fetch(`${API_BASE}/projects/recommended`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) return;

        const result = await response.json();
        renderRecommendedProjects(result.data.projects || []);

    } catch (error) {
        console.error('Error loading recommended projects:', error);
        document.getElementById('recommended-projects').innerHTML = '<p class="loading-text">Error al cargar recomendaciones</p>';
    }
}

// Renderizar proyectos recomendados
function renderRecommendedProjects(projects) {
    const container = document.getElementById('recommended-projects');

    if (projects.length === 0) {
        container.innerHTML = '<p class="loading-text">No hay recomendaciones disponibles</p>';
        return;
    }

    container.innerHTML = projects.slice(0, 3).map(project => `
        <a href="../projects/details.html?id=${project.id}" class="recommendation-item">
            <div class="recommendation-image" style="background-image: url('${project.image_url || '/images/placeholder.jpg'}')"></div>
            <div class="recommendation-content">
                <h3 class="recommendation-title">${project.title}</h3>
                <p class="recommendation-description">${project.description}</p>
            </div>
        </a>
    `).join('');
}

// Inicializar cuando carga la página
document.addEventListener('DOMContentLoaded', () => {
    loadUserDashboard();
});
