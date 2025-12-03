(function () {
    'use strict';

    const API_BASE_URL = '/api/user/my-projects';
    const projectsGrid = document.getElementById('projects-grid');
    const emptyState = document.getElementById('empty-state');

    async function loadMyProjects() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '../../auth/login.html';
                return;
            }

            const response = await fetch(API_BASE_URL, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = '../../auth/login.html';
                    return;
                }
                throw new Error('Error al cargar proyectos');
            }

            const result = await response.json();
            const projects = result.data.projects;

            renderProjects(projects);
        } catch (error) {
            console.error('Error:', error);
            projectsGrid.innerHTML = '<p class="error-message">Error al cargar tus proyectos. Por favor intenta de nuevo.</p>';
        }
    }

    function renderProjects(projects) {
        projectsGrid.innerHTML = '';

        if (projects.length === 0) {
            projectsGrid.style.display = 'none';
            emptyState.style.display = 'flex';
            return;
        }

        projectsGrid.style.display = 'grid';
        emptyState.style.display = 'none';

        projects.forEach(project => {
            const card = createProjectCard(project);
            projectsGrid.appendChild(card);
        });
    }

    function createProjectCard(project) {
        const card = document.createElement('article');
        card.className = 'project-card';

        // Calcular porcentaje y días restantes
        const percentage = Math.round((project.raised_amount / project.goal_amount) * 100);
        const progressWidth = Math.min(percentage, 100);

        const daysLeft = calculateDaysLeft(project.end_date);
        const daysText = daysLeft > 0 ? `${daysLeft} días restantes` : 'Finalizado';

        // Determinar clase y texto del estado
        const statusInfo = getStatusInfo(project.status); // status viene como nombre (ej: 'Publicado') o ID?
        // El backend devuelve status_name en 'status'

        card.innerHTML = `
            <div class="project-image-container">
                <img 
                    src="${project.cover_image_url || '/images/placeholder-project.jpg'}" 
                    alt="${project.title}"
                    onerror="this.src='/images/placeholder-project.jpg'"
                />
                <div class="project-status-badge ${statusInfo.className}">
                    ${statusInfo.text}
                </div>
            </div>
            <div class="project-details">
                <h3 class="project-title">${project.title}</h3>
                <p class="project-description">${project.description}</p>
                
                <div class="project-statistics">
                    <div class="progress-info">
                        <span class="goal-percentage">${percentage}%</span>
                        <span class="raised-amount">$${parseFloat(project.raised_amount).toLocaleString()}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressWidth}%"></div>
                    </div>
                    <span class="project-goal">Meta: $${parseFloat(project.goal_amount).toLocaleString()}</span>
                    <div class="card-footer" style="margin-top: 1rem; display: flex; justify-content: space-between; align-items: center;">
                        <span class="days-left">${daysText}</span>
                        <a href="edit-project.html?id=${project.id}" class="btn btn-outline btn-sm">
                            <span class="material-symbols-outlined" style="font-size: 18px;">edit</span>
                            Editar
                        </a>
                    </div>
                </div>
            </div>
        `;

        return card;
    }

    function calculateDaysLeft(endDate) {
        const end = new Date(endDate);
        const now = new Date();
        const diffTime = end - now;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    function getStatusInfo(statusName) {
        // Mapear nombres de estado a clases y textos
        // statusName viene del backend (project_status.name)
        // Asumimos que viene en español o inglés según la DB.
        // Si viene 'published', 'draft', etc.

        // Revisando repository: s.name as status_name.
        // Si la tabla project_status tiene nombres en español o inglés.
        // Asumamos inglés por los constraints ('draft', 'published').

        const statusMap = {
            'draft': { text: 'Borrador', className: 'status-draft' },
            'in_review': { text: 'En Revisión', className: 'status-review' },
            'observed': { text: 'Observado', className: 'status-observed' },
            'published': { text: 'Publicado', className: 'status-published' },
            'rejected': { text: 'Rechazado', className: 'status-rejected' },
            'finished': { text: 'Finalizado', className: 'status-finished' }
        };

        // Normalizar entrada
        const key = Object.keys(statusMap).find(k => k.toLowerCase() === statusName?.toLowerCase()) || 'draft';

        // Si no coincide, devolver tal cual
        return statusMap[key] || { text: statusName, className: 'status-default' };
    }

    // Estilos CSS para los badges (inyectados dinámicamente o deberían ir en CSS)
    // Agregaremos estilos básicos aquí si no existen
    const style = document.createElement('style');
    style.textContent = `
        .project-status-badge {
            position: absolute;
            top: 1rem;
            right: 1rem;
            padding: 4px 12px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 700;
            color: white;
            backdrop-filter: blur(4px);
            z-index: 5;
        }
        .status-draft { background-color: rgba(107, 114, 128, 0.9); }
        .status-review { background-color: rgba(245, 158, 11, 0.9); }
        .status-observed { background-color: rgba(249, 115, 22, 0.9); }
        .status-published { background-color: rgba(34, 197, 94, 0.9); }
        .status-rejected { background-color: rgba(239, 68, 68, 0.9); }
        .status-finished { background-color: rgba(59, 130, 246, 0.9); }
        
        .btn-sm { padding: 4px 12px; font-size: 14px; }
    `;
    document.head.appendChild(style);

    // Inicializar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadMyProjects);
    } else {
        loadMyProjects();
    }

})();
