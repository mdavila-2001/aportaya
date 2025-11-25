(function () {
    'use strict';

    const API_BASE_URL = '/api/admin';
    let currentPage = 1;
    let currentFilters = {};

    async function loadUsers(page = 1, filters = {}) {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                window.location.href = '../../auth/login.html';
                return;
            }

            // Construir query params
            const params = new URLSearchParams({
                page: page,
                limit: 10,
                ...filters
            });

            const response = await fetch(`${API_BASE_URL}/users?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem('authToken');
                    window.location.href = '../../auth/login.html';
                    return;
                }
                throw new Error('Error al cargar usuarios');
            }

            const result = await response.json();
            renderUsers(result.data.users);
            updatePagination(result.data.pagination);

        } catch (error) {
            console.error('Error cargando usuarios:', error);
            showError('Error al cargar la lista de usuarios');
        }
    }

    function renderUsers(users) {
        const tbody = document.querySelector('.table tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: var(--spXL);">
                        No se encontraron usuarios
                    </td>
                </tr>
            `;
            return;
        }

        users.forEach(user => {
            const row = createUserRow(user);
            tbody.appendChild(row);
        });
    }

    function createUserRow(user) {
        const tr = document.createElement('tr');

        const statusClass = getStatusClass(user.status);
        const statusText = getStatusText(user.status);

        tr.innerHTML = `
            <td class="cell-name">${user.full_name}</td>
            <td class="cell-secondary">${user.email}</td>
            <td>
                <span class="status-badge ${statusClass}">${statusText}</span>
            </td>
            <td>
                <div class="table-actions">
                    ${getActionButtons(user)}
                </div>
            </td>
        `;

        return tr;
    }

    function getStatusClass(status) {
        const statusMap = {
            'active': 'status-active',
            'pending_verification': 'status-pending',
            'suspended': 'status-inactive',
            'banned': 'status-cancelled'
        };
        return statusMap[status] || 'status-pending';
    }

    function getStatusText(status) {
        const statusMap = {
            'active': 'Activo',
            'pending_verification': 'Pendiente',
            'suspended': 'Suspendido',
            'banned': 'Baneado'
        };
        return statusMap[status] || status;
    }

    function getActionButtons(user) {
        let buttons = '';

        if (user.status === 'active') {
            buttons += `
                <a href="#" class="table-link table-link-warning" data-action="suspend" data-user-id="${user.id}">Suspender</a>
                <span class="table-link-separator">|</span>
                <a href="#" class="table-link table-link-danger" data-action="ban" data-user-id="${user.id}">Banear</a>
            `;
        } else if (user.status === 'suspended' || user.status === 'banned') {
            buttons += `
                <a href="#" class="table-link table-link-success" data-action="activate" data-user-id="${user.id}">Activar</a>
            `;
        } else if (user.status === 'pending_verification') {
            buttons += `
                <a href="#" class="table-link table-link-success" data-action="activate" data-user-id="${user.id}">Activar</a>
            `;
        }

        buttons += `
            <span class="table-link-separator">|</span>
            <a href="#" class="table-link" data-action="history" data-user-id="${user.id}">Historial</a>
        `;

        return buttons;
    }

    async function changeUserStatus(userId, newStatus, reason = null) {
        try {
            const token = localStorage.getItem('authToken');

            const response = await fetch(`${API_BASE_URL}/users/${userId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus, reason })
            });

            if (!response.ok) {
                throw new Error('Error al cambiar estado del usuario');
            }

            const result = await response.json();
            showSuccess('Estado del usuario actualizado exitosamente');

            // Recargar la lista
            loadUsers(currentPage, currentFilters);

        } catch (error) {
            console.error('Error cambiando estado:', error);
            showError('Error al cambiar el estado del usuario');
        }
    }

    function updatePagination(pagination) {
        const paginationInfo = document.querySelector('.table-pagination-info');
        if (paginationInfo) {
            const start = (pagination.page - 1) * pagination.limit + 1;
            const end = Math.min(start + pagination.limit - 1, pagination.total);
            paginationInfo.innerHTML = `
                Mostrando <span>${start}-${end}</span> de <span>${pagination.total}</span>
            `;
        }
    }

    function attachEventListeners() {
        // Event delegation para las acciones de la tabla
        document.addEventListener('click', async (e) => {
            const actionLink = e.target.closest('[data-action]');
            if (!actionLink) return;

            e.preventDefault();

            const action = actionLink.dataset.action;
            const userId = actionLink.dataset.userId;

            switch (action) {
                case 'activate':
                    await changeUserStatus(userId, 'active', 'Activado por administrador');
                    break;
                case 'suspend':
                    const suspendReason = prompt('Razón de la suspensión:');
                    if (suspendReason) {
                        await changeUserStatus(userId, 'suspended', suspendReason);
                    }
                    break;
                case 'ban':
                    const banReason = prompt('Razón del baneo:');
                    if (banReason && confirm('¿Estás seguro de banear a este usuario?')) {
                        await changeUserStatus(userId, 'banned', banReason);
                    }
                    break;
                case 'history':
                    await showUserHistory(userId);
                    break;
            }
        });

        // Búsqueda
        const searchInput = document.querySelector('.table-search input');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    currentFilters.search = e.target.value;
                    currentPage = 1;
                    loadUsers(currentPage, currentFilters);
                }, 500);
            });
        }
    }

    async function showUserHistory(userId) {
        try {
            const token = localStorage.getItem('authToken');

            const response = await fetch(`${API_BASE_URL}/users/${userId}/history`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Error al cargar historial');
            }

            const result = await response.json();
            displayHistory(result.data.history);

        } catch (error) {
            console.error('Error cargando historial:', error);
            showError('Error al cargar el historial del usuario');
        }
    }

    function displayHistory(history) {
        // TODO: Implementar modal o vista para mostrar historial
        console.log('Historial:', history);
        alert('Historial del usuario:\n' + JSON.stringify(history, null, 2));
    }

    function showSuccess(message) {
        // TODO: Implementar sistema de notificaciones
        console.log('Success:', message);
    }

    function showError(message) {
        // TODO: Implementar sistema de notificaciones
        console.error('Error:', message);
    }

    // Inicializar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            loadUsers();
            attachEventListeners();
        });
    } else {
        loadUsers();
        attachEventListeners();
    }

})();
