(function () {
    'use strict';

    const form = document.getElementById('edit-project-form');
    const titleInput = document.getElementById('project-title');
    const summaryInput = document.getElementById('project-summary');
    const descriptionInput = document.getElementById('project-description');
    const endDateInput = document.getElementById('project-end-date');
    const titleCounter = document.getElementById('title-counter');
    const summaryCounter = document.getElementById('summary-counter');
    const descriptionCounter = document.getElementById('description-counter');
    const loadingOverlay = document.getElementById('loading-overlay');

    let projectId = null;

    function getProjectIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    function updateCharCounter(input, counter) {
        counter.textContent = input.value.length;
    }
    async function loadProjectData() {
        projectId = getProjectIdFromUrl();

        if (!projectId) {
            showNotification('error', 'ID de proyecto no válido');
            setTimeout(() => {
                window.location.href = 'myProjects.html';
            }, 2000);
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '../../auth/login.html';
            return;
        }

        loadingOverlay.classList.add('active');

        try {
            const response = await fetch(`/api/user/projects/${projectId}`, {
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
                if (response.status === 403) {
                    showNotification('error', 'No tienes permiso para editar este proyecto');
                    setTimeout(() => {
                        window.location.href = 'myProjects.html';
                    }, 2000);
                    return;
                }
                if (response.status === 404) {
                    showNotification('error', 'Proyecto no encontrado');
                    setTimeout(() => {
                        window.location.href = 'myProjects.html';
                    }, 2000);
                    return;
                }
                throw new Error('Error al cargar el proyecto');
            }

            const result = await response.json();
            const project = result.data.project;

            titleInput.value = project.title || '';
            summaryInput.value = project.summary || '';
            descriptionInput.value = project.description || '';
            
            if (project.end_date) {
                const endDate = new Date(project.end_date);
                const formattedDate = endDate.toISOString().split('T')[0];
                endDateInput.value = formattedDate;
            }

            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            endDateInput.min = tomorrow.toISOString().split('T')[0];
            updateCharCounter(titleInput, titleCounter);
            updateCharCounter(summaryInput, summaryCounter);
            updateCharCounter(descriptionInput, descriptionCounter);

        } catch (error) {
            console.error('Error:', error);
            showNotification('error', 'Error al cargar el proyecto');
            setTimeout(() => {
                window.location.href = 'myProjects.html';
            }, 2000);
        } finally {
            loadingOverlay.classList.remove('active');
        }
    }

    titleInput.addEventListener('input', () => {
        updateCharCounter(titleInput, titleCounter);
    });

    summaryInput.addEventListener('input', () => {
        updateCharCounter(summaryInput, summaryCounter);
    });

    descriptionInput.addEventListener('input', () => {
        updateCharCounter(descriptionInput, descriptionCounter);
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = titleInput.value.trim();
        const summary = summaryInput.value.trim();
        const description = descriptionInput.value.trim();
        const endDate = endDateInput.value;

        if (!title) {
            showNotification('error', 'El nombre del proyecto es obligatorio');
            titleInput.focus();
            return;
        }

        if (title.length < 5) {
            showNotification('error', 'El nombre debe tener al menos 5 caracteres');
            titleInput.focus();
            return;
        }

        if (!summary) {
            showNotification('error', 'El resumen es obligatorio');
            summaryInput.focus();
            return;
        }

        if (summary.length < 10) {
            showNotification('error', 'El resumen debe tener al menos 10 caracteres');
            summaryInput.focus();
            return;
        }

        if (!description) {
            showNotification('error', 'La descripción es obligatoria');
            descriptionInput.focus();
            return;
        }

        if (description.length < 20) {
            showNotification('error', 'La descripción debe tener al menos 20 caracteres');
            descriptionInput.focus();
            return;
        }

        if (!endDate) {
            showNotification('error', 'La fecha límite es obligatoria');
            endDateInput.focus();
            return;
        }

        const selectedDate = new Date(endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate <= today) {
            showNotification('error', 'La fecha límite debe ser posterior a hoy');
            endDateInput.focus();
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '../../auth/login.html';
            return;
        }

        loadingOverlay.classList.add('active');

        try {
            const response = await fetch(`/api/user/projects/${projectId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title,
                    summary,
                    description,
                    endDate
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Error al actualizar el proyecto');
            }

            showNotification('success', '¡Proyecto actualizado exitosamente!');
            
            setTimeout(() => {
                window.location.href = 'myProjects.html';
            }, 1500);

        } catch (error) {
            console.error('Error:', error);
            showNotification('error', error.message || 'Error al actualizar el proyecto');
        } finally {
            loadingOverlay.classList.remove('active');
        }
    });

    function showNotification(type, message) {
        window.showNotification(type, message);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadProjectData);
    } else {
        loadProjectData();
    }

})();
