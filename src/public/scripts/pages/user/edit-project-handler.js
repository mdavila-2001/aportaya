(function () {
    'use strict';

    const form = document.getElementById('edit-project-form');
    const titleInput = document.getElementById('project-title');
    const summaryInput = document.getElementById('project-summary');
    const descriptionInput = document.getElementById('project-description');
    const endDateInput = document.getElementById('project-end-date');
    const financialGoalInput = document.getElementById('project-financial-goal');
    const categorySelect = document.getElementById('project-category');
    const locationInput = document.getElementById('project-location');
    const videoInput = document.getElementById('project-video');

    const titleCounter = document.getElementById('title-counter');
    const summaryCounter = document.getElementById('summary-counter');
    const descriptionCounter = document.getElementById('description-counter');

    const coverImageInput = document.getElementById('cover-image-input');
    const coverImageIdInput = document.getElementById('cover-image-id');
    const changeCoverBtn = document.getElementById('change-cover-btn');
    const currentCoverPreview = document.getElementById('current-cover-preview');

    const proofDocumentInput = document.getElementById('proof-document-input');
    const proofDocumentIdInput = document.getElementById('proof-document-id');
    const changeDocumentBtn = document.getElementById('change-document-btn');
    const currentDocumentPreview = document.getElementById('current-document-preview');

    const loadingOverlay = document.getElementById('loading-overlay');

    let projectId = null;
    let currentProject = null;

    function getProjectIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    function updateCharCounter(input, counter) {
        counter.textContent = input.value.length;
    }

    async function loadCategories() {
        try {
            const response = await fetch('/api/projects/categories');
            const result = await response.json();

            if (result.success && result.categories) {
                categorySelect.innerHTML = '<option value="">Selecciona una categoría</option>';
                result.categories.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat.id;
                    option.textContent = cat.name;
                    categorySelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error cargando categorías:', error);
        }
    }

    async function loadProjectData() {
        projectId = getProjectIdFromUrl();

        if (!projectId) {
            Notification.error('ID de proyecto no válido');
            setTimeout(() => window.location.href = 'myProjects.html', 2000);
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '../../auth/login.html';
            return;
        }

        loadingOverlay.classList.add('active');

        try {
            await loadCategories();

            const response = await fetch(`/api/user/projects/${projectId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401) window.location.href = '../../auth/login.html';
                if (response.status === 403) {
                    Notification.error('No tienes permiso para editar este proyecto');
                    setTimeout(() => window.location.href = 'myProjects.html', 2000);
                }
                if (response.status === 404) {
                    Notification.error('Este campo es requerido');
                    setTimeout(() => window.location.href = 'myProjects.html', 2000);
                }
                throw new Error('Error al cargar el proyecto');
            }

            const result = await response.json();
            currentProject = result.data.project;

            // Verificar si es editable
            if (!['draft', 'observed'].includes(currentProject.approval_status)) {
                Notification.error('Solo puedes editar proyectos en estado Borrador u Observado');
                setTimeout(() => window.location.href = 'myProjects.html', 2500);
                return;
            }

            // Cargar datos básicos
            titleInput.value = currentProject.title || '';
            summaryInput.value = currentProject.summary || '';
            descriptionInput.value = currentProject.description || '';
            financialGoalInput.value = currentProject.financial_goal || '';
            locationInput.value = currentProject.location || '';
            videoInput.value = currentProject.video_url || '';

            if (currentProject.end_date) {
                const endDate = new Date(currentProject.end_date);
                endDateInput.value = endDate.toISOString().split('T')[0];
            }

            if (currentProject.category_id) {
                categorySelect.value = currentProject.category_id;
            }

            coverImageIdInput.value = currentProject.cover_image_id || '';
            proofDocumentIdInput.value = currentProject.proof_document_id || '';

            // Mostrar preview de imagen actual
            if (currentProject.cover_image_url) {
                currentCoverPreview.innerHTML = `
                    <img src="${currentProject.cover_image_url}" alt="Portada actual" 
                         style="max-width: 200px; border-radius: 8px;">
                `;
            }

            // Mostrar preview de documento actual
            if (currentProject.proof_document_name) {
                currentDocumentPreview.innerHTML = `
                    <p style="color: #666;">📄 ${currentProject.proof_document_name}</p>
                `;
            }

            // Aplicar restricciones
            applyFieldRestrictions();

            // Set min date
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            endDateInput.min = tomorrow.toISOString().split('T')[0];

            // Update counters
            updateCharCounter(titleInput, titleCounter);
            updateCharCounter(summaryInput, summaryCounter);
            updateCharCounter(descriptionInput, descriptionCounter);

        } catch (error) {
            console.error('Error:', error);
            Notification.error('Error al cargar el proyecto');
            setTimeout(() => window.location.href = 'myProjects.html', 2000);
        } finally {
            loadingOverlay.classList.remove('active');
        }
    }

    function applyFieldRestrictions() {
        // Meta financiera: solo editable si no hay donaciones
        if (currentProject.raised_amount > 0) {
            financialGoalInput.disabled = true;
            document.getElementById('financial-goal-hint').textContent =
                'No puedes cambiar la meta porque ya hay donaciones';
            document.getElementById('financial-goal-hint').style.color = '#f97316';
        }
    }

    // Event listeners para contadores
    titleInput.addEventListener('input', () => updateCharCounter(titleInput, titleCounter));
    summaryInput.addEventListener('input', () => updateCharCounter(summaryInput, summaryCounter));
    descriptionInput.addEventListener('input', () => updateCharCounter(descriptionInput, descriptionCounter));

    // Subida de imagen de portada
    changeCoverBtn.addEventListener('click', () => coverImageInput.click());

    coverImageInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            Notification.error('Por favor selecciona una categoría');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            Notification.error('La imagen no debe superar 5MB');
            return;
        }

        loadingOverlay.classList.add('active');

        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('image', file);

            const response = await fetch('/api/upload/image', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const result = await response.json();

            if (!response.ok) throw new Error(result.message);

            coverImageIdInput.value = result.data.imageId;
            currentCoverPreview.innerHTML = `
                <img src="${result.data.url}" alt="Nueva portada" 
                     style="max-width: 200px; border-radius: 8px;">
            `;
            Notification.success('Imagen cargada exitosamente');
        } catch (error) {
            console.error('Error:', error);
            Notification.error('Error al subir la imagen');
        } finally {
            loadingOverlay.classList.remove('active');
        }
    });

    // Subida de documento
    changeDocumentBtn.addEventListener('click', () => proofDocumentInput.click());

    proofDocumentInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            Notification.error('El documento no debe superar 10MB');
            return;
        }

        loadingOverlay.classList.add('active');

        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('document', file);

            const response = await fetch('/api/upload/document', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const result = await response.json();

            if (!response.ok) throw new Error(result.message);

            proofDocumentIdInput.value = result.data.documentId;
            currentDocumentPreview.innerHTML = `<p style="color: #666;">📄 ${file.name}</p>`;
            Notification.success('Documento cargado exitosamente');
        } catch (error) {
            console.error('Error:', error);
            Notification.error('Por favor carga el documento de prueba');
        } finally {
            loadingOverlay.classList.remove('active');
        }
    });

    // Submit form
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = titleInput.value.trim();
        const summary = summaryInput.value.trim();
        const description = descriptionInput.value.trim();
        const endDate = endDateInput.value;
        const financialGoal = financialGoalInput.value;
        const categoryId = categorySelect.value;
        const location = locationInput.value.trim();
        const videoUrl = videoInput.value.trim();

        // Validaciones básicas
        if (!title || title.length < 5) {
            Notification.error('El título debe tener al menos 5 caracteres');
            titleInput.focus();
            return;
        }

        if (!summary || summary.length < 10) {
            Notification.error('El resumen debe tener al menos 10 caracteres');
            summaryInput.focus();
            return;
        }

        if (!description || description.length < 20) {
            Notification.error('La descripción debe tener al menos 20 caracteres');
            descriptionInput.focus();
            return;
        }

        if (!endDate) {
            Notification.error('La fecha límite es obligatoria');
            endDateInput.focus();
            return;
        }

        if (!financialGoal || parseFloat(financialGoal) < 100) {
            Notification.error('La meta financiera debe ser al menos Bs. 100');
            financialGoalInput.focus();
            return;
        }

        if (!categoryId) {
            Notification.error('Debes seleccionar una categoría');
            categorySelect.focus();
            return;
        }

        if (!location) {
            Notification.error('La ubicación es requerida');
            locationInput.focus();
            return;
        }

        const selectedDate = new Date(endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate <= today) {
            Notification.error('La fecha límite debe ser posterior a hoy');
            endDateInput.focus();
            return;
        }

        const token = localStorage.getItem('token');
        loadingOverlay.classList.add('active');

        try {
            const updateData = {
                title,
                summary,
                description,
                endDate,
                categoryId,
                location
            };

            // Solo incluir meta financiera si cambió y es permitido
            if (currentProject.raised_amount === 0) {
                updateData.financialGoal = parseFloat(financialGoal);
            }

            // Video (puede ser vacío)
            if (videoUrl !== currentProject.video_url) {
                updateData.videoUrl = videoUrl || null;
            }

            // IDs de archivos solo si cambiaron
            const newCoverId = coverImageIdInput.value;
            if (newCoverId && newCoverId !== currentProject.cover_image_id) {
                updateData.coverImageId = newCoverId;
            }

            const newDocId = proofDocumentIdInput.value;
            if (newDocId && newDocId !== currentProject.proof_document_id) {
                updateData.proofDocumentId = newDocId;
            }

            const response = await fetch(`/api/user/projects/${projectId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Error al actualizar el proyecto');
            }

            Notification.success('Proyecto actualizado exitosamente');

            setTimeout(() => {
                window.location.href = 'myProjects.html';
            }, 1500);

        } catch (error) {
            console.error('Error:', error);
            Notification.error(error.message || 'Error al cargar datos del proyecto');
        } finally {
            loadingOverlay.classList.remove('active');
        }
    });



    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadProjectData);
    } else {
        loadProjectData();
    }

})();
