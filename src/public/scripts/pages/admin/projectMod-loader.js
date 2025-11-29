(function () {
    'use strict';

    const API_BASE_URL = '/api/admin';
    let projectData = null;
    let projectImages = [];
    let currentImageIndex = 0;

    // DOM elements
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

    // Get project ID from URL
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
        // Cambiar el título del documento
        document.title = `${project.title} - Moderación`;

        // Títulos
        projectTitle.textContent = project.title;
        contentTitle.textContent = project.title;

        // Autor
        projectAuthor.textContent = project.creator_name || 'Desconocido';

        // Estado
        const statusText = getStatusText(project.approval_status);
        projectStatus.textContent = statusText;
        projectStatus.className = `project-status-badge status-${project.approval_status}`;

        // Fecha
        projectDate.textContent = formatDate(project.created_at);

        // Descripción
        contentDescription.innerHTML = `<p>${escapeHtml(project.description || 'Sin descripción')}</p>`;

        // Métricas
        metricGoal.textContent = `$${parseFloat(project.financial_goal).toLocaleString('es-ES')} USD`;
        metricCategory.textContent = project.category_name || 'Sin categoría';
        metricCategory.classList.add('text-white');
        metricLocation.textContent = project.location || 'No especificada';
        metricLocation.classList.add('text-white');

        // Imágenes
        setupCarousel(project);

        // Documento
        if (project.proof_document_url) {
            documentPreview.style.display = 'block';
            documentFrame.src = project.proof_document_url;
        }

        // Mostrar botones de acción solo si está en revisión
        const actionButtons = document.querySelector('.action-buttons');
        if (actionButtons) {
            if (project.approval_status === 'in_review') {
                actionButtons.style.display = 'flex';
            } else {
                actionButtons.style.display = 'none';
            }
        }

        // Historial (placeholder por ahora)
        loadHistory(project.id);
    }

    function setupCarousel(project) {
        // Por ahora solo mostrar la imagen de portada
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

        // Mostrar/ocultar botones si solo hay una imagen
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
        // Placeholder - posteriormente cargar desde el backend
        historyList.innerHTML = '<p class="empty-history">No hay acciones registradas</p>';
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

    // Event listeners
    carouselPrev.addEventListener('click', prevImage);
    carouselNext.addEventListener('click', nextImage);

    // Action buttons (placeholder)
    document.getElementById('btn-approve')?.addEventListener('click', () => {
        console.log('Aprobar proyecto:', projectId);
        Notification.success('Funcionalidad de aprobación en desarrollo');
    });

    document.getElementById('btn-observe')?.addEventListener('click', () => {
        console.log('Observar proyecto:', projectId);
        Notification.success('Funcionalidad de observación en desarrollo');
    });

    document.getElementById('btn-reject')?.addEventListener('click', () => {
        console.log('Rechazar proyecto:', projectId);
        Notification.success('Funcionalidad de rechazo en desarrollo');
    });

    // Load project on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadProject);
    } else {
        loadProject();
    }

})();
