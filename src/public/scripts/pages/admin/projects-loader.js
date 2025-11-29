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
                console.log('Approve project:', projectId);
                break;
            case 'observe':
                console.log('Observe project:', projectId);
                break;
            case 'reject':
                console.log('Reject project:', projectId);
                break;
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
