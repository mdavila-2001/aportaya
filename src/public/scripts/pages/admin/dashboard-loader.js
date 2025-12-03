const API_BASE = '/api/admin';

function updateElement(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function formatMoney(amount) {
    return `Bs. ${amount.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
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

        updateElement('total-projects', stats.projects.total || 0);
        updateElement('total-amount', formatMoney(stats.donations.total_amount || 0));
        updateElement('total-users', stats.users.total || 0);
        updateElement('total-donations', stats.donations.total || 0);

        updateProjectsChart(stats.projects);
        updateUsersChart(stats.users);

        await loadCategories(token);

    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

function updateProjectsChart(projects) {
    const total = projects.total || 1;
    const chart = document.getElementById('projects-chart');
    if (!chart) return;

    updateBar(chart, 0, projects.published || 0, total);
    updateBar(chart, 1, projects.pending || 0, total);
    updateBar(chart, 2, projects.draft || 0, total);
    updateBar(chart, 3, projects.rejected || 0, total);
}

function updateUsersChart(users) {
    const total = users.total || 1;
    const chart = document.getElementById('users-chart');
    if (!chart) return;

    updateBar(chart, 0, users.active || 0, total);
    updateBar(chart, 1, users.pending || 0, total);
    updateBar(chart, 2, users.suspended || 0, total);
    updateBar(chart, 3, users.banned || 0, total);
}
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

document.addEventListener('DOMContentLoaded', () => {
    loadDashboardStats();
});
