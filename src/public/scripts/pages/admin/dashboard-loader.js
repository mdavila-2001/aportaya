(function () {
    'use strict';

    const API_BASE_URL = '/api/admin/stats';

    async function loadDashboardStats() {
        try {
            const token = localStorage.getItem('authToken');
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
                    localStorage.removeItem('authToken');
                    window.location.href = '../auth/login.html';
                    return;
                }
                throw new Error('Error al cargar estadísticas: ' + response.status);
            }

            const result = await response.json();
            const stats = result.data;

            // Actualizar estadísticas de usuarios
            updateStat('total-users', stats.users.total);
            updateStat('active-users', stats.users.active);
            updateStat('pending-users', stats.users.pending);
            updateStat('suspended-users', stats.users.suspended);

            // Actualizar estadísticas de proyectos
            updateStat('total-projects', stats.projects.total);
            updateStat('published-projects', stats.projects.published);
            updateStat('pending-projects', stats.projects.pending);
            updateStat('draft-projects', stats.projects.draft);

            // Actualizar estadísticas de donaciones
            updateStat('total-donations', stats.donations.total);
            updateStat('total-donated', formatCurrency(stats.donations.total_amount));

            // Actualizar categorías
            updateStat('total-categories', stats.categories.total);

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

    function showError(message) {
        // TODO: Implementar sistema de notificaciones
        console.error(message);
    }

    // Cargar estadísticas al cargar la página
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadDashboardStats);
    } else {
        loadDashboardStats();
    }

})();
