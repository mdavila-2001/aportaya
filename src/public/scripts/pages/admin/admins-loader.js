(function () {
    'use strict';

    const API_BASE_URL = '/api/admin';
    let currentAdmins = [];
    let profileImageUploader;

    function initializeModalEvents() {
        const modal = document.getElementById('add-admin-modal');
        if (modal) {
            // Reset form when modal closes (popover toggle event)
            modal.addEventListener('toggle', (event) => {
                if (event.newState === 'closed') {
                    resetForm();
                }
            });
        }
    }

    function closeModal() {
        const modal = document.getElementById('add-admin-modal');
        if (modal) {
            modal.hidePopover();
        }
    }

    function resetForm() {
        const form = document.getElementById('admin-form');
        if (form) {
            form.reset();
            clearErrorMessages();

            // Reset profile picture preview
            const profileLabel = document.querySelector('.profile-label');
            if (profileLabel) {
                profileLabel.style.backgroundImage = '';
            }
        }
    }

    function clearErrorMessages() {
        const errorMessages = document.querySelectorAll('.error_msg');
        errorMessages.forEach(msg => msg.textContent = '');
    }

    // ==================== LOAD ADMINISTRATORS ====================

    async function loadAdministrators() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '../../auth/login.html';
                return;
            }

            const response = await fetch(`${API_BASE_URL}/administrators`, {
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
                throw new Error('Error al cargar administradores');
            }

            const result = await response.json();
            currentAdmins = result.data.administrators;
            renderAdministrators(currentAdmins);

        } catch (error) {
            console.error('Error cargando administradores:', error);
            showError('Error al cargar la lista de administradores');
        }
    }

    function renderAdministrators(admins) {
        const tbody = document.querySelector('.table tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (admins.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: var(--spXL);">
                        No se encontraron administradores
                    </td>
                </tr>
            `;
            return;
        }

        admins.forEach(admin => {
            const row = createAdminRow(admin);
            tbody.appendChild(row);
        });
    }

    function createAdminRow(admin) {
        const tr = document.createElement('tr');

        const statusClass = getStatusClass(admin.status);
        const statusText = getStatusText(admin.status);

        tr.innerHTML = `
            <td class="cell-name">${admin.full_name}</td>
            <td class="cell-secondary">${admin.email}</td>
            <td>
                <span class="status-badge ${statusClass}">${statusText}</span>
            </td>
            <td>
                <div class="table-actions">
                    ${getActionButtons(admin)}
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

    function getActionButtons(admin) {
        const activeAdminsCount = currentAdmins.filter(a => a.status === 'active').length;
        const canDelete = activeAdminsCount > 1 || admin.status !== 'active';

        let buttons = '';

        if (canDelete) {
            buttons += `
                <a href="#" class="table-link table-link-danger" data-action="delete" data-admin-id="${admin.id}">Eliminar</a>
            `;
        } else {
            buttons += `
                <span class="table-link" style="opacity: 0.5; cursor: not-allowed;" title="No se puede eliminar el último administrador activo">Eliminar</span>
            `;
        }

        return buttons;
    }

    // ==================== CREATE ADMINISTRATOR ====================

    async function createAdministrator(formData) {
        try {
            const token = localStorage.getItem('token');

            const response = await fetch(`${API_BASE_URL}/administrators`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al crear administrador');
            }

            const result = await response.json();
            showSuccess('Administrador creado exitosamente');
            closeModal();
            loadAdministrators();

        } catch (error) {
            console.error('Error creando administrador:', error);
            showError(error.message || 'Error al crear el administrador');
        }
    }

    async function handleFormSubmit() {
        clearErrorMessages();

        // Get form values
        const email = document.getElementById('admin-email').value.trim();
        const firstName = document.getElementById('admin-first-name').value.trim();
        const middleName = document.getElementById('admin-middle-name').value.trim();
        const lastName = document.getElementById('admin-last-name').value.trim();
        const motherLastName = document.getElementById('admin-mother-last-name').value.trim();
        const password = document.getElementById('admin-password').value;
        const birthDate = document.getElementById('admin-birthdate').value;
        const gender = document.getElementById('admin-gender').value;

        // Validate
        let hasErrors = false;

        if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            document.getElementById('admin_email_error_msg').textContent = 'Correo electrónico inválido';
            hasErrors = true;
        }

        if (!firstName) {
            document.getElementById('admin_first_name_error_msg').textContent = 'El nombre es requerido';
            hasErrors = true;
        }

        if (!lastName) {
            document.getElementById('admin_last_name_error_msg').textContent = 'El apellido es requerido';
            hasErrors = true;
        }

        if (!password || password.length < 8) {
            document.getElementById('admin_password_error_msg').textContent = 'La contraseña debe tener al menos 8 caracteres';
            hasErrors = true;
        }

        if (!birthDate) {
            document.getElementById('admin_birthdate_error_msg').textContent = 'La fecha de nacimiento es requerida';
            hasErrors = true;
        }

        if (!gender) {
            document.getElementById('admin_gender_error_msg').textContent = 'El género es requerido';
            hasErrors = true;
        }

        if (hasErrors) {
            return;
        }

        // Upload profile image if exists
        let profileImageId = null;
        if (profileImageUploader && profileImageUploader.hasFile()) {
            profileImageId = await profileImageUploader.upload();
        }

        // Prepare data
        const adminData = {
            email,
            firstName,
            middleName,
            lastName,
            motherLastName,
            password,
            birthDate,
            gender,
            profileImageId
        };

        await createAdministrator(adminData);
    }

    // ==================== DELETE ADMINISTRATOR ====================

    async function deleteAdministrator(adminId) {
        try {
            const token = localStorage.getItem('token');

            const response = await fetch(`${API_BASE_URL}/administrators/${adminId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al eliminar administrador');
            }

            const result = await response.json();
            showSuccess('Administrador eliminado exitosamente');
            loadAdministrators();

        } catch (error) {
            console.error('Error eliminando administrador:', error);
            showError(error.message || 'Error al eliminar el administrador');
        }
    }

    // ==================== EVENT LISTENERS ====================

    function attachEventListeners() {
        // Form submit
        const submitButton = document.getElementById('submit-admin-btn');
        if (submitButton) {
            submitButton.addEventListener('click', handleFormSubmit);
        }

        // Table actions (delete)
        document.addEventListener('click', async (e) => {
            const actionLink = e.target.closest('[data-action]');
            if (!actionLink) return;

            e.preventDefault();

            const action = actionLink.dataset.action;
            const adminId = actionLink.dataset.adminId;

            switch (action) {
                case 'delete':
                    if (confirm('¿Estás seguro de eliminar este administrador? Esta acción no se puede deshacer.')) {
                        await deleteAdministrator(adminId);
                    }
                    break;
            }
        });

        // Search
        const searchInput = document.querySelector('.table-search input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();

                const filteredAdmins = currentAdmins.filter(admin => {
                    const fullName = admin.full_name.toLowerCase();
                    const email = admin.email.toLowerCase();
                    return fullName.includes(searchTerm) || email.includes(searchTerm);
                });

                renderAdministrators(filteredAdmins);
            });
        }

        // Password toggle
        const togglePassword = document.getElementById('toggle-password');
        const passwordInput = document.getElementById('admin-password');
        if (togglePassword && passwordInput) {
            togglePassword.addEventListener('change', () => {
                passwordInput.type = togglePassword.checked ? 'text' : 'password';
            });
        }
    }

    // ==================== UTILITIES ====================

    function showSuccess(message) {
        console.log('Success:', message);
        alert(message);
    }

    function showError(message) {
        console.error('Error:', message);
        alert(message);
    }

    // ==================== INITIALIZATION ====================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initializeModalEvents();
            loadAdministrators();
            attachEventListeners();

            // Initialize image uploader
            profileImageUploader = new ImageUploader(
                'profile-picture-input',
                document.querySelector('.profile-label'),
                {
                    maxSize: 5 * 1024 * 1024,
                    endpoint: '/api/image',
                    imageType: 'profile'
                }
            );
        });
    } else {
        initializeModalEvents();
        loadAdministrators();
        attachEventListeners();

        profileImageUploader = new ImageUploader(
            'profile-picture-input',
            document.querySelector('.profile-label'),
            {
                maxSize: 5 * 1024 * 1024,
                endpoint: '/api/image',
                imageType: 'profile'
            }
        );
    }

})();
