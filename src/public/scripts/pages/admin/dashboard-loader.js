// Dashboard Loader - Simple JavaScript sin cosas extravagantes

const API_BASE = '/api/admin';

// Función simple para actualizar un elemento
function updateElement(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

// Formatear moneda simple
function formatMoney(amount) {
    return `Bs. ${amount.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Cargar estadísticas del dashboard
async function loadDashboardStats() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '../auth/login.html';
            return;
        }

        const response = await fetch(`${API_BASE}/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '../auth/login.html';
            }
            return;
        }

        const result = await response.json();
        const stats = result.data;

        // Actualizar tarjetas de stats
        updateElement('total-projects', stats.projects.total || 0);
        updateElement('total-amount', formatMoney(stats.donations.total_amount || 0));
        updateElement('total-users', stats.users.total || 0);
        updateElement('total-donations', stats.donations.total || 0);

        // Actualizar gráfico de proyectos
        updateProjectsChart(stats.projects);

        // Actualizar gráfico de usuarios
        updateUsersChart(stats.users);

        // Cargar categorías
        await loadCategories(token);

    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

// Actualizar gráfico de proyectos
function updateProjectsChart(projects) {
    const total = projects.total || 1;
    const chart = document.getElementById('projects-chart');
    if (!chart) return;

    // Publicados
    updateBar(chart, 0, projects.published || 0, total);
    // Pendientes
    updateBar(chart, 1, projects.pending || 0, total);
    // Borradores
    updateBar(chart, 2, projects.draft || 0, total);
    // Rechazados
    updateBar(chart, 3, projects.rejected || 0, total);
}

// Actualizar gráfico de usuarios
function updateUsersChart(users) {
    const total = users.total || 1;
    const chart = document.getElementById('users-chart');
    if (!chart) return;

    // Activos
    updateBar(chart, 0, users.active || 0, total);
    // Pendientes
    updateBar(chart, 1, users.pending || 0, total);
    // Suspendidos
    updateBar(chart, 2, users.suspended || 0, total);
    // Baneados
    updateBar(chart, 3, users.banned || 0, total);
}

// Actualizar barra individual
function updateBar(container, index, value, total) {
    const rows = container.querySelectorAll('.bar-row');
    if (!rows[index]) return;

    const bar = rows[index].querySelector('.bar-fill');
    const valueSpan = rows[index].querySelector('.bar-value');

    if (bar && valueSpan) {
        const percentage = total > 0 ? (value / total * 100) : 0;
        bar.style.width = percentage + '%';
        valueSpan.textContent = value;
    }
}

// Cargar categorías
async function loadCategories(token) {
    try {
        const response = await fetch(`${API_BASE}/categories`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) return;

        const result = await response.json();
        renderCategories(result.data.categories || []);

    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Renderizar categorías
function renderCategories(categories) {
    const container = document.getElementById('categories-list');
    if (!container) return;

    if (categories.length === 0) {
        container.innerHTML = '<p class="loading-text">No hay categorías disponibles</p>';
        return;
    }

    container.innerHTML = categories.map(cat => `
        <div class="category-item">
            <span class="category-name">${cat.name}</span>
            <span class="category-slug">${cat.slug}</span>
        </div>
    `).join('');
}

// Inicializar cuando carga la página
document.addEventListener('DOMContentLoaded', () => {
    loadDashboardStats();
});
