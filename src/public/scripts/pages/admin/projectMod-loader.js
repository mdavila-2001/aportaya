(function () {
    'use strict';

    const API_BASE_URL = '/api/admin';
    let projectData = null;
    let projectImages = [];
    let currentImageIndex = 0;

    const projectTitle = document.getElementById('project-title');
    const projectAuthor = document.getElementById('project-author');
    const projectStatus = document.getElementById('project-status');
    const projectDate = document.getElementById('project-date');
    const contentTitle = document.getElementById('content-title');
    const contentDescription = document.getElementById('content-description');
    const metricGoal = document.getElementById('metric-goal');
    const metricCategory = document.getElementById('metric-category');
    const metricLocation = document.getElementById('metric-location');
    const historyList = document.getElementById('history-list');
    const carouselImage = document.getElementById('carousel-image');
    const carouselCounter = document.getElementById('carousel-counter');
    const carouselPrev = document.getElementById('carousel-prev');
    const carouselNext = document.getElementById('carousel-next');
    const documentPreview = document.getElementById('document-preview');
    const documentFrame = document.getElementById('document-frame');

    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');

    async function loadProject() {
        if (!projectId) {
            window.location.href = 'projects.html';
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '../../auth/login.html';
                return;
            }

            const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
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
                throw new Error('Error al cargar proyecto');
            }

            const result = await response.json();
            projectData = result.data.project;
            renderProject(projectData);
        } catch (error) {
            console.error('Error cargando proyecto:', error);
            Notification.error('Error al cargar el proyecto');
        }
    }

    function renderProject(project) {
        document.title = `${project.title} - Moderación`;

        projectTitle.textContent = project.title;
        contentTitle.textContent = project.title;

        projectAuthor.textContent = project.creator_name || 'Desconocido';

        const statusText = getStatusText(project.approval_status);
        projectStatus.textContent = statusText;
        projectStatus.className = `project-status-badge status-${project.approval_status}`;

        projectDate.textContent = formatDate(project.created_at);

        contentDescription.innerHTML = `<p>${escapeHtml(project.description || 'Sin descripción')}</p>`;

        metricGoal.textContent = `$${parseFloat(project.financial_goal).toLocaleString('es-ES')} USD`;
        metricCategory.textContent = project.category_name || 'Sin categoría';
        metricCategory.classList.add('text-white');
        metricLocation.textContent = project.location || 'No especificada';
        metricLocation.classList.add('text-white');

        setupCarousel(project);

        if (project.proof_document_url) {
            documentPreview.style.display = 'block';
            documentFrame.src = project.proof_document_url;
        }

        const actionButtons = document.querySelector('.action-buttons');
        if (actionButtons) {
            if (project.approval_status === 'in_review') {
                actionButtons.style.display = 'flex';
            } else {
                actionButtons.style.display = 'none';
            }
        }

        loadHistory(project.id);
    }

    function setupCarousel(project) {
        projectImages = project.cover_image_url ? [project.cover_image_url] : [];

        if (projectImages.length === 0) {
            projectImages = ['/images/placeholder-project.jpg'];
        }

        updateCarousel();
    }

    function updateCarousel() {
        if (projectImages.length > 0) {
            carouselImage.style.backgroundImage = `url('${projectImages[currentImageIndex]}')`;
            carouselCounter.textContent = `${currentImageIndex + 1} / ${projectImages.length}`;
        }

        if (projectImages.length <= 1) {
            carouselPrev.style.display = 'none';
            carouselNext.style.display = 'none';
        }
    }

    function prevImage() {
        currentImageIndex = (currentImageIndex - 1 + projectImages.length) % projectImages.length;
        updateCarousel();
    }

    function nextImage() {
        currentImageIndex = (currentImageIndex + 1) % projectImages.length;
        updateCarousel();
    }

    async function loadHistory(projectId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/projects/${projectId}/history`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Error al cargar historial');
            }

            const result = await response.json();
            const history = result.data.history;

            if (!history || history.length === 0) {
                historyList.innerHTML = '<p class="empty-history">No hay acciones registradas</p>';
                return;
            }

            historyList.innerHTML = history.map(item => {
                const dateFormatted = formatDate(item.change_date);
                const statusText = getStatusChangeText(item.old_status, item.new_status);
                const reasonHtml = item.reason ? `<p class="history-reason">${escapeHtml(item.reason)}</p>` : '';

                return `
                    <div class="history-item">
                        <div class="history-header">
                            <span class="history-status">${statusText}</span>
                            <span class="history-date">${dateFormatted}</span>
                        </div>
                        <p class="history-admin">Por: ${escapeHtml(item.changed_by_name || 'Sistema')}</p>
                        ${reasonHtml}
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Error cargando historial:', error);
            historyList.innerHTML = '<p class="empty-history">Error al cargar el historial</p>';
        }
    }

    function getStatusChangeText(oldStatus, newStatus) {
        const statusNames = {
            'draft': 'Borrador',
            'in_review': 'En Revisión',
            'observed': 'Observado',
            'rejected': 'Rechazado',
            'published': 'Publicado'
        };

        return `${statusNames[oldStatus] || oldStatus} → ${statusNames[newStatus] || newStatus}`;
    }

    function getStatusText(status) {
        const statusMap = {
            'in_review': 'En Revisión',
            'observed': 'Observado',
            'rejected': 'Rechazado',
            'published': 'Publicado',
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

    carouselPrev.addEventListener('click', prevImage);
    carouselNext.addEventListener('click', nextImage);

    const actionModal = document.getElementById('action-modal');
    const actionModalTitle = document.getElementById('action-modal-title');
    const actionModalMessage = document.getElementById('action-modal-message');
    const actionReason = document.getElementById('action-reason');
    const confirmActionBtn = document.getElementById('confirm-action-btn');

    let currentAction = null;

    const approveConfirmModal = document.getElementById('approve-confirm-modal');
    const confirmApproveBtn = document.getElementById('confirm-approve-btn');

    document.getElementById('btn-approve')?.addEventListener('click', () => {
        approveConfirmModal?.showPopover();
    });

    confirmApproveBtn?.addEventListener('click', () => {
        approveConfirmModal?.hidePopover();
        updateProjectStatus('published');
    });

    const observeConfirmModal = document.getElementById('observe-confirm-modal');
    const confirmObserveBtn = document.getElementById('confirm-observe-btn');
    const observeReasonTextarea = document.getElementById('observe-reason');
    const observeReasonError = document.getElementById('observe_reason_error');

    document.getElementById('btn-observe')?.addEventListener('click', () => {
        observeReasonTextarea.value = '';
        observeReasonError.textContent = '';
        observeConfirmModal?.showPopover();
    });

    confirmObserveBtn?.addEventListener('click', () => {
        const reason = observeReasonTextarea.value.trim();
        observeReasonError.style.display = 'none';

        if (!reason) {
            observeReasonError.textContent = 'Debes ingresar un motivo';
            observeReasonError.style.display = 'block';
            return;
        }

        if (reason.length < 10) {
            observeReasonError.textContent = 'El motivo debe tener al menos 10 caracteres';
            observeReasonError.style.display = 'block';
            return;
        }

        observeConfirmModal?.hidePopover();
        updateProjectStatus('observed', reason);
    });

    const rejectConfirmModal = document.getElementById('reject-confirm-modal');
    const confirmRejectBtn = document.getElementById('confirm-reject-btn');
    const rejectReasonTextarea = document.getElementById('reject-reason');
    const rejectReasonError = document.getElementById('reject_reason_error');

    document.getElementById('btn-reject')?.addEventListener('click', () => {
        rejectReasonTextarea.value = '';
        rejectReasonError.textContent = '';
        rejectConfirmModal?.showPopover();
    });

    confirmRejectBtn?.addEventListener('click', () => {
        const reason = rejectReasonTextarea.value.trim();
        rejectReasonError.style.display = 'none';

        if (!reason) {
            rejectReasonError.textContent = 'Debes ingresar un motivo';
            rejectReasonError.style.display = 'block';
            return;
        }

        if (reason.length < 10) {
            rejectReasonError.textContent = 'El motivo debe tener al menos 10 caracteres';
            rejectReasonError.style.display = 'block';
            return;
        }

        rejectConfirmModal?.hidePopover();
        updateProjectStatus('rejected', reason);
    });

    async function updateProjectStatus(status, reason = null) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/projects/${projectId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status, reason })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Error al actualizar estado');
            }

            Notification.success('Estado actualizado correctamente');
            setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
            console.error(error);
            Notification.error(error.message || 'Error al actualizar el estado');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadProject);
    } else {
        loadProject();
    }

})();
