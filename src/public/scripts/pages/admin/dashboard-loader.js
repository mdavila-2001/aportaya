(function () {
    'use strict';

    const API_BASE_URL = '/api/admin';

    async function loadDashboardStats() {
        try {
            const token = localStorage.getItem('token');
            console.log('Token encontrado:', token ? 'Sí' : 'No');

            if (!token) {
                console.error('No hay token, redirigiendo al login');
                window.location.href = '../auth/login.html';
                return;
            }

            console.log('Haciendo petición a /api/admin/stats...');
            const response = await fetch(`${API_BASE_URL}/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Respuesta recibida:', response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error en la respuesta:', errorText);

                if (response.status === 401 || response.status === 403) {
                    console.error('No autorizado, redirigiendo al login');
                    localStorage.removeItem('token');
                    window.location.href = '../auth/login.html';
                    return;
                }
                throw new Error('Error al cargar estadísticas: ' + response.status);
            }

            const result = await response.json();
            const stats = result.data;

            // Update stat cards
            updateStat('total-users', stats.users.total);
            updateStat('active-users', stats.users.active);
            updateStat('pending-users', stats.users.pending);
            updateStat('suspended-users', stats.users.suspended);

            updateStat('total-projects', stats.projects.total);
            updateStat('published-projects', stats.projects.published);
            updateStat('pending-projects', stats.projects.pending);
            updateStat('draft-projects', stats.projects.draft);

            updateStat('total-donations', stats.donations.total);
            updateStat('total-donated', formatCurrency(stats.donations.total_amount));

            updateStat('total-categories', stats.categories.total);

            // Update charts
            updateProjectsChart(stats.projects);
            updateUsersChart(stats.users);

            // Load categories
            await loadCategories(token);

        } catch (error) {
            console.error('Error cargando estadísticas:', error);
            showError('Error al cargar las estadísticas del dashboard');
        }
    }

    function updateStat(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    function formatCurrency(amount) {
        return new Intl.NumberFormat('es-BO', {
            style: 'currency',
            currency: 'BOB'
        }).format(amount);
    }

    function updateProjectsChart(projectsData) {
        const totalProjects = projectsData.total || 1;
        updateBar('projects-chart', 0, projectsData.published, totalProjects);
        updateBar('projects-chart', 1, projectsData.pending, totalProjects);
        updateBar('projects-chart', 2, projectsData.draft, totalProjects);
        updateBar('projects-chart', 3, projectsData.rejected, totalProjects);
    }

    function updateUsersChart(usersData) {
        const totalUsers = usersData.total || 1;
        updateBar('users-chart', 0, usersData.active, totalUsers);
        updateBar('users-chart', 1, usersData.pending, totalUsers);
        updateBar('users-chart', 2, usersData.suspended, totalUsers);
        updateBar('users-chart', 3, usersData.banned, totalUsers);
    }

    function updateBar(chartId, index, value, total) {
        const chart = document.getElementById(chartId);
        if (!chart) return;

        const barItems = chart.querySelectorAll('.bar-item');
        if (!barItems[index]) return;

        const bar = barItems[index].querySelector('.bar');
        const valueSpan = barItems[index].querySelector('.bar-value');

        if (bar && valueSpan) {
            const percentage = total > 0 ? (value / total) * 100 : 0;
            bar.style.width = `${percentage}%`;
            valueSpan.textContent = value;
        }
    }

    async function loadCategories(token) {
        try {
            const response = await fetch(`${API_BASE_URL}/categories`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Error al cargar categorías');
            }

            const result = await response.json();
            renderCategories(result.data.categories);

        } catch (error) {
            console.error('Error cargando categorías:', error);
            const categoriesList = document.getElementById('categories-list');
            if (categoriesList) {
                categoriesList.innerHTML = '<p class="loading-msg">Error al cargar categorías</p>';
            }
        }
    }

    function renderCategories(categories) {
        const categoriesList = document.getElementById('categories-list');
        if (!categoriesList) return;

        if (categories.length === 0) {
            categoriesList.innerHTML = '<p class="loading-msg">No hay categorías disponibles</p>';
            return;
        }

        categoriesList.innerHTML = '';

        categories.forEach(category => {
            const item = document.createElement('div');
            item.className = 'category-item';

            const nameDiv = document.createElement('div');
            const name = document.createElement('span');
            name.className = 'category-name';
            name.textContent = category.name;
            nameDiv.appendChild(name);

            const slug = document.createElement('span');
            slug.className = 'category-slug';
            slug.textContent = category.slug;

            item.appendChild(nameDiv);
            item.appendChild(slug);

            categoriesList.appendChild(item);
        });
    }

    function showError(message) {
        console.error(message);
    }

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadDashboardStats);
    } else {
        loadDashboardStats();
    }

})();
