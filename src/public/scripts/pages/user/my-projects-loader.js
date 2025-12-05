(function () {
    'use strict';

    const API_BASE_URL = '/api/user/my-projects';
    const projectsGrid = document.getElementById('projects-grid');
    const emptyState = document.getElementById('empty-state');
    const observationsModal = document.getElementById('observations-modal');
    const resubmitBtn = document.getElementById('resubmit-btn');

    let currentProjectId = null;

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

        const percentage = Math.round((project.raised_amount / project.goal_amount) * 100);
        const progressWidth = Math.min(percentage, 100);

        const daysLeft = calculateDaysLeft(project.end_date);
        const daysText = daysLeft > 0 ? `${daysLeft} días restantes` : 'Finalizado';

        const statusInfo = getStatusInfo(project.status);

        // Botón de editar (solo visible en draft u observed)
        const editButton = ['draft', 'observed'].includes(project.status) ? `
            <a href="edit-project.html?id=${project.id}" class="btn btn-outline btn-sm">
                <span class="material-symbols-outlined" style="font-size: 18px;">edit</span>
                Editar
            </a>
        ` : '';

        // Botón especial para proyectos observados
        const observedButton = project.status === 'observed' ? `
            <button class="btn btn-warning btn-sm" data-action="view-observations" data-id="${project.id}" style="margin-left: 0.5rem;">
                <span class="material-symbols-outlined" style="font-size: 18px;">visibility</span>
                Ver Observaciones
            </button>
        ` : '';

        // Botón para enviar a aprobación (solo si es draft)
        const submitButton = project.status === 'draft' ? `
            <button class="btn btn-primary btn-sm" data-action="submit-approval" data-id="${project.id}" style="margin-left: 0.5rem;">
                <span class="material-symbols-outlined" style="font-size: 18px;">send</span>
                Enviar a Aprobación
            </button>
        ` : '';

        let campaignButtons = '';
        if (project.status === 'published') {
            if (project.campaign_status === 'not_started') {
                campaignButtons = `
                    <button class="btn btn-success btn-sm" data-action="start-campaign" data-id="${project.id}" style="margin-left: 0.5rem;">
                        <span class="material-symbols-outlined" style="font-size: 18px;">play_arrow</span>
                        Iniciar Campaña
                    </button>
                `;
            } else if (project.campaign_status === 'active') {
                campaignButtons = `
                    <button class="btn btn-warning btn-sm" data-action="pause-campaign" data-id="${project.id}" style="margin-left: 0.5rem;">
                        <span class="material-symbols-outlined" style="font-size: 18px;">pause</span>
                        Pausar
                    </button>
                    <button class="btn btn-danger btn-sm" data-action="finish-campaign" data-id="${project.id}" style="margin-left: 0.5rem;">
                        <span class="material-symbols-outlined" style="font-size: 18px;">stop</span>
                        Finalizar
                    </button>
                `;
            } else if (project.campaign_status === 'paused') {
                campaignButtons = `
                    <button class="btn btn-success btn-sm" data-action="resume-campaign" data-id="${project.id}" style="margin-left: 0.5rem;">
                        <span class="material-symbols-outlined" style="font-size: 18px;">play_arrow</span>
                        Reanudar
                    </button>
                `;
            }
        }

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
                    <div class="card-footer" style="margin-top: 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
                        <span class="days-left">${daysText}</span>
                        <div style="display: flex; gap: 0.5rem;">
                            ${editButton}
                            ${observedButton}
                            ${submitButton}
                            ${campaignButtons}
                        </div>
                    </div>
                </div>
            </div>
        `;

        return card;
    }

    async function showObservations(projectId) {
        try {
            currentProjectId = projectId;
            const token = localStorage.getItem('token');

            const response = await fetch(`/api/user/projects/${projectId}/observations`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Error al cargar observaciones');
            }

            const result = await response.json();
            const obs = result.data.observations;

            if (!obs) {
                document.getElementById('observation-reason').innerHTML = '<p>No se encontraron observaciones.</p>';
            } else {
                const date = new Date(obs.change_date).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                document.getElementById('observation-date').textContent = `Observado el ${date}`;
                document.getElementById('observation-admin').textContent = `Por: ${obs.admin_name || 'Administrador'}`;
                document.getElementById('observation-reason').innerHTML = `<strong>Motivo:</strong><br>${obs.reason || 'Sin motivo especificado'}`;
            }

            observationsModal?.showPopover();
        } catch (error) {
            console.error('Error:', error);
            Notification.error('Error al cargar las observaciones');
        }
    }

    async function resubmitProject() {
        if (!currentProjectId) return;

        try {
            const token = localStorage.getItem('token');

            const response = await fetch(`/api/user/projects/${currentProjectId}/resubmit`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Error al reenviar proyecto');
            }

            observationsModal?.hidePopover();

            if (typeof Notification !== 'undefined') {
                Notification.success('Proyecto reenviado a revisión exitosamente');
            } else {
                Notification.success('Proyecto reenviado a revisión exitosamente');
            }

            // Recargar proyectos
            setTimeout(() => loadMyProjects(), 1000);
        } catch (error) {
            console.error('Error:', error);
            if (typeof Notification !== 'undefined') {
                Notification.error(error.message);
            } else {
                Notification.error(error.message || 'Error al reenviar el proyecto');
            }
        }
    }

    // Event delegation para botones de observaciones y envío a aprobación
    projectsGrid?.addEventListener('click', async (e) => {
        const viewObsBtn = e.target.closest('[data-action="view-observations"]');
        if (viewObsBtn) {
            const projectId = viewObsBtn.dataset.id;
            await showObservations(projectId);
            document.getElementById('observations-modal').showPopover();
            return;
        }

        const submitBtn = e.target.closest('[data-action="submit-approval"]');
        if (submitBtn) {
            currentProjectId = submitBtn.dataset.id;
            document.getElementById('submit-approval-modal').showPopover();
            return;
        }

        // Campaign control buttons
        const startBtn = e.target.closest('[data-action="start-campaign"]');
        if (startBtn) {
            await updateCampaignStatus(startBtn.dataset.id, 'active', 'iniciar');
            return;
        }

        const pauseBtn = e.target.closest('[data-action="pause-campaign"]');
        if (pauseBtn) {
            await updateCampaignStatus(pauseBtn.dataset.id, 'paused', 'pausar');
            return;
        }

        const resumeBtn = e.target.closest('[data-action="resume-campaign"]');
        if (resumeBtn) {
            await updateCampaignStatus(resumeBtn.dataset.id, 'active', 'reanudar');
            return;
        }

        const finishBtn = e.target.closest('[data-action="finish-campaign"]');
        if (finishBtn) {
            if (confirm('¿Estás seguro de finalizar la campaña? Esta acción es irreversible.')) {
                await updateCampaignStatus(finishBtn.dataset.id, 'finished', 'finalizar');
            }
            return;
        }
    });

    // Actualizar estado de campaña
    async function updateCampaignStatus(projectId, newStatus, actionName) {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`/api/user/projects/${projectId}/campaign-status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message);

            Notification.success(`Campaña ${actionName === 'iniciar' ? 'iniciada' :
                actionName === 'pausar' ? 'pausada' :
                    actionName === 'reanudar' ? 'reanudada' : 'finalizada'} exitosamente`);
            loadMyProjects();
        } catch (error) {
            console.error('Error:', error);
            Notification.error(error.message || 'Error al actualizar estado de campaña');
        }
    }

    // Confirmar envío a aprobación
    const confirmSubmitBtn = document.getElementById('confirm-submit-btn');
    confirmSubmitBtn?.addEventListener('click', async () => {
        if (!currentProjectId) return;

        const token = localStorage.getItem('token');

        try {
            const response = await fetch(`/api/user/projects/${currentProjectId}/submit-for-approval`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            document.getElementById('submit-approval-modal').hidePopover();

            if (!response.ok) {
                throw new Error(result.message);
            }

            Notification.success('Proyecto enviado a revisión exitosamente');
            loadMyProjects();
        } catch (error) {
            console.error('Error:', error);
            Notification.error(error.message || 'Error al enviar el proyecto');
        }
    });

    // Botón reenviar
    resubmitBtn?.addEventListener('click', resubmitProject);

    function calculateDaysLeft(endDate) {
        const end = new Date(endDate);
        const now = new Date();
        const diffTime = end - now;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    function getStatusInfo(statusName) {

        const statusMap = {
            'draft': { text: 'Borrador', className: 'status-draft' },
            'in_review': { text: 'En Revisión', className: 'status-review' },
            'observed': { text: 'Observado', className: 'status-observed' },
            'published': { text: 'Publicado', className: 'status-published' },
            'rejected': { text: 'Rechazado', className: 'status-rejected' },
            'finished': { text: 'Finalizado', className: 'status-finished' }
        };

        const key = Object.keys(statusMap).find(k => k.toLowerCase() === statusName?.toLowerCase()) || 'draft';

        return statusMap[key] || { text: statusName, className: 'status-default' };
    }


    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadMyProjects);
    } else {
        loadMyProjects();
    }

})();
