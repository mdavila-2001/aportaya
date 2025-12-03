(function () {
    'use strict';

    const API_BASE_URL = '/api/admin';
    let projectsData = [];
    let currentFilter = 'all';
    let searchTerm = '';
    let searchTimeout = null;

    const projectsGrid = document.getElementById('projects-grid');
    const filterChips = document.querySelectorAll('[data-filter]');
    const searchInput = document.getElementById('search-input');

    async function loadProjects() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '../../auth/login.html';
                return;
            }

            let url = `${API_BASE_URL}/projects?`;
            if (searchTerm) {
                url += `searchBy=${encodeURIComponent(searchTerm)}&`;
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem('token');
                    window.location.href = '../../auth/login.html';
                    return;
                }
                throw new Error('Error al cargar proyectos');
            }

            const result = await response.json();
            projectsData = result.data.projects || [];
            renderProjects(projectsData);
        } catch (error) {
            console.error('Error cargando proyectos:', error);
            showError('Error al cargar los proyectos');
        }
    }

    function renderProjects(projects) {
        projectsGrid.innerHTML = '';

        const filtered = currentFilter === 'all'
            ? projects
            : projects.filter(p => p.approval_status === currentFilter);

        if (filtered.length === 0) {
            projectsGrid.innerHTML = '<p class="empty-message">No hay proyectos en esta categoría</p>';
            return;
        }

        filtered.forEach(project => {
            const card = createProjectCard(project);
            projectsGrid.appendChild(card);
        });
    }

    function createProjectCard(project) {
        const card = document.createElement('div');
        card.className = 'project-card';

        const statusText = getStatusText(project.approval_status);
        const imageUrl = project.cover_image_url || '/images/placeholder-project.jpg';

        card.innerHTML = `
            <div class="project-card-image" style="background-image: url('${escapeHtml(imageUrl)}')">
                <span class="project-status-badge status-${project.approval_status}">${statusText}</span>
            </div>
            <div class="project-card-content">
                <h3 class="project-card-title">${escapeHtml(project.title)}</h3>
                <p class="project-card-author">Por: ${escapeHtml(project.creator_name)}</p>
                <p class="project-card-date">Solicitado el ${formatDate(project.created_at)}</p>
                <div class="project-card-actions">
                    <button class="btn btn-primary btn-review" data-action="review" data-id="${project.id}">
                        Revisar Detalles
                    </button>
                    <button class="btn-icon btn-approve" data-action="approve" data-id="${project.id}" title="Aprobar">
                        <span class="material-symbols-outlined">check</span>
                    </button>
                    <button class="btn-icon btn-observe" data-action="observe" data-id="${project.id}" title="Observar">
                        <span class="material-symbols-outlined">visibility</span>
                    </button>
                    <button class="btn-icon btn-reject" data-action="reject" data-id="${project.id}" title="Rechazar">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
            </div>
        `;

        return card;
    }

    function getStatusText(status) {
        const statusMap = {
            'in_review': 'En Revisión',
            'observed': 'Observado',
            'rejected': 'Rechazado',
            'published': 'Activo',
            'draft': 'Borrador'
        };
        return statusMap[status] || status;
    }

    function formatDate(dateString) {
        if (!dateString) return 'Fecha desconocida';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function showError(message) {
        projectsGrid.innerHTML = `<p class="empty-message">${message}</p>`;
    }

    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            filterChips.forEach(c => c.classList.remove('chip-active'));
            chip.classList.add('chip-active');
            currentFilter = chip.dataset.filter;
            renderProjects(projectsData);
        });
    });

    projectsGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;

        const action = btn.dataset.action;
        const projectId = btn.dataset.id;

        switch (action) {
            case 'review':
                window.location.href = `projectMod.html?id=${projectId}`;
                break;
            case 'approve':
                currentProjectId = projectId;
                approveConfirmModal?.showPopover();
                break;
            case 'observe':
                currentProjectId = projectId;
                observeReasonTextarea.value = '';
                observeReasonError.textContent = '';
                observeConfirmModal?.showPopover();
                break;
            case 'reject':
                currentProjectId = projectId;
                rejectReasonTextarea.value = '';
                rejectReasonError.textContent = '';
                rejectConfirmModal?.showPopover();
                break;
        }
    });

    const approveConfirmModal = document.getElementById('approve-confirm-modal');
    const confirmApproveBtn = document.getElementById('confirm-approve-btn');
    let currentProjectId = null;

    confirmApproveBtn?.addEventListener('click', async () => {
        if (!currentProjectId) return;

        approveConfirmModal?.hidePopover();

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/projects/${currentProjectId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'published' })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Error al aprobar proyecto');
            }

            if (typeof Notification !== 'undefined') {
                Notification.success('Proyecto aprobado exitosamente');
            }

            loadProjects();
        } catch (error) {
            console.error(error);
            if (typeof Notification !== 'undefined') {
                Notification.error(error.message || 'Error al aprobar el proyecto');
            }
        } finally {
            currentProjectId = null;
        }
    });

    const observeConfirmModal = document.getElementById('observe-confirm-modal');
    const confirmObserveBtn = document.getElementById('confirm-observe-btn');
    const observeReasonTextarea = document.getElementById('observe-reason');
    const observeReasonError = document.getElementById('observe_reason_error');

    confirmObserveBtn?.addEventListener('click', async () => {
        const reason = observeReasonTextarea.value.trim();

        if (!reason) {
            observeReasonError.textContent = 'Debes ingresar un motivo';
            return;
        }

        if (reason.length < 10) {
            observeReasonError.textContent = 'El motivo debe tener al menos 10 caracteres';
            return;
        }

        if (!currentProjectId) return;

        observeConfirmModal?.hidePopover();

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/projects/${currentProjectId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'observed', reason })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Error al observar proyecto');
            }

            if (typeof Notification !== 'undefined') {
                Notification.success('Observaciones enviadas exitosamente');
            }

            loadProjects();
        } catch (error) {
            console.error(error);
            if (typeof Notification !== 'undefined') {
                Notification.error(error.message || 'Error al enviar observaciones');
            }
        } finally {
            currentProjectId = null;
        }
    });

    const rejectConfirmModal = document.getElementById('reject-confirm-modal');
    const confirmRejectBtn = document.getElementById('confirm-reject-btn');
    const rejectReasonTextarea = document.getElementById('reject-reason');
    const rejectReasonError = document.getElementById('reject_reason_error');

    confirmRejectBtn?.addEventListener('click', async () => {
        const reason = rejectReasonTextarea.value.trim();

        if (!reason) {
            rejectReasonError.textContent = 'Debes ingresar un motivo';
            return;
        }

        if (reason.length < 10) {
            rejectReasonError.textContent = 'El motivo debe tener al menos 10 caracteres';
            return;
        }

        if (!currentProjectId) return;

        rejectConfirmModal?.hidePopover();

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/projects/${currentProjectId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'rejected', reason })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Error al rechazar proyecto');
            }

            if (typeof Notification !== 'undefined') {
                Notification.success('Proyecto rechazado');
            }

            loadProjects();
        } catch (error) {
            console.error(error);
            if (typeof Notification !== 'undefined') {
                Notification.error(error.message || 'Error al rechazar el proyecto');
            }
        } finally {
            currentProjectId = null;
        }
    });

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                searchTerm = e.target.value.trim();
                loadProjects();
            }, 500);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadProjects);
    } else {
        loadProjects();
    }

})();
