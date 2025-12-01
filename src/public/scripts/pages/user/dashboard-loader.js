// User Dashboard Loader - Simple con un solo endpoint

const API_BASE = '/api/user';

// Cargar todo el dashboard de una vez
async function loadUserDashboard() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '../auth/login.html';
            return;
        }

        const response = await fetch(`${API_BASE}/home`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '../auth/login.html';
            }
            return;
        }

        const result = await response.json();
        const data = result.data;

        // Actualizar bienvenida
        document.getElementById('welcome-title').textContent = `¡Hola, ${data.user.name}!`;
        document.getElementById('welcome-subtitle').textContent = 'Bienvenido a tu dashboard';

        // Renderizar secciones
        renderActiveProjects(data.projects || []);
        renderRecentActivity(data.activity || []);
        renderRecommendedProjects(data.recommended || []);

    } catch (error) {
        console.error('Error loading user dashboard:', error);
    }
}

// Renderizar proyectos activos
function renderActiveProjects(projects) {
    const container = document.getElementById('active-projects');

    if (projects.length === 0) {
        container.innerHTML = '<p class="loading-text">No tienes proyectos activos</p>';
        return;
    }

    container.innerHTML = projects.map(project => `
        <div class="project-card">
            <div class="project-card-image" style="background-image: url('${project.image_url || '/images/placeholder.jpg'}')"></div>
            <div class="project-card-content">
                <h3 class="project-card-title">${project.title}</h3>
                <p class="project-card-description">${project.description}</p>
                <div class="project-card-progress">
                    <div class="progress-info">
                        <span class="progress-amount">Bs. ${project.raised_amount || 0}</span>
                        <span class="progress-percentage">${calculatePercentage(project.raised_amount, project.financial_goal)}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${calculatePercentage(project.raised_amount, project.financial_goal)}%"></div>
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

// Renderizar actividad reciente
function renderRecentActivity(activities) {
    const container = document.getElementById('recent-activity');

    if (activities.length === 0) {
        container.innerHTML = '<p class="loading-text">No hay actividad reciente</p>';
        return;
    }

    container.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">
                <span class="material-symbols-outlined">volunteer_activism</span>
            </div>
            <div class="activity-content">
                <p class="activity-text">${activity.description}</p>
                <p class="activity-time">${formatTimeAgo(activity.created_at)}</p>
            </div>
        </div>
    `).join('');
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

// Renderizar proyectos recomendados
function renderRecommendedProjects(projects) {
    const container = document.getElementById('recommended-projects');

    if (projects.length === 0) {
        container.innerHTML = '<p class="loading-text">No hay recomendaciones disponibles</p>';
        return;
    }

    container.innerHTML = projects.map(project => `
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
