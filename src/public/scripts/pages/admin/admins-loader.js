(function () {
    'use strict';

    const API_BASE_URL = '/api/admin';
    let currentAdmins = [];
    let profileImageUploader;

    function initializeModalEvents() {
        const modal = document.getElementById('add-admin-modal');
        if (modal) {
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

            const profileLabel = document.querySelector('.profile-label');
            if (profileLabel) {
                profileLabel.style.backgroundImage = '';
            }

            isEditing = false;
            editingAdminId = null;
            document.querySelector('.modal-title').textContent = 'Agregar Nuevo Administrador';
            document.getElementById('submit-admin-btn').textContent = 'Crear Administrador';

            const passwordContainer = document.getElementById('password-container');
            if (passwordContainer) {
                passwordContainer.style.display = 'flex';
                const passwordInput = document.getElementById('admin-password');
                if (passwordInput) {
                    passwordInput.required = true;
                    passwordInput.value = '';
                }
            }
        }
    }

    function populateForm(admin) {
        isEditing = true;
        editingAdminId = admin.id;

        document.querySelector('.modal-title').textContent = 'Editar Administrador';
        document.getElementById('submit-admin-btn').textContent = 'Guardar Cambios';

        document.getElementById('admin-email').value = admin.email;
        document.getElementById('admin-first-name').value = admin.firstName || admin.first_name;
        document.getElementById('admin-middle-name').value = admin.middleName || admin.middle_name || '';
        document.getElementById('admin-last-name').value = admin.lastName || admin.last_name;
        document.getElementById('admin-mother-last-name').value = admin.motherLastName || admin.mother_last_name || '';

        const birthDate = admin.birthDate || admin.birth_date;
        if (birthDate) {
            const date = new Date(birthDate);
            const formattedDate = date.toISOString().split('T')[0];
            document.getElementById('admin-birthdate').value = formattedDate;
        }

        const genderSelect = document.getElementById('admin-gender');
        if (genderSelect && admin.gender) {
            genderSelect.value = admin.gender;

            if (!genderSelect.value) {
                const genderMap = {
                    'male': 'M', 'Masculino': 'M', 'masculino': 'M', 'm': 'M',
                    'female': 'F', 'Femenino': 'F', 'femenino': 'F', 'f': 'F',
                    'other': 'O', 'Otro': 'O', 'otro': 'O', 'o': 'O',
                    'U': 'U', 'u': 'U'
                };
                const mappedValue = genderMap[admin.gender] || genderMap[admin.gender.toString().toLowerCase()];
                if (mappedValue) {
                    genderSelect.value = mappedValue;
                }
            }
        }

        const passwordContainer = document.getElementById('password-container');
        if (passwordContainer) {
            passwordContainer.style.display = 'none';
            const passwordInput = document.getElementById('admin-password');
            if (passwordInput) {
                passwordInput.required = false;
            }
        }

        const profileImageUrl = admin.profileImageUrl || admin.profile_image_url;
        if (profileImageUrl) {
            const profileLabel = document.querySelector('.profile-label');
            if (profileLabel) {
                profileLabel.style.backgroundImage = `url('${profileImageUrl}')`;
            }
        }
    }

    function clearErrorMessages() {
        const errorMessages = document.querySelectorAll('.error_msg');
        errorMessages.forEach(msg => msg.textContent = '');
    }

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
            'banned': 'status-cancelled',
            'deleted': 'status-inactive'
        };
        return statusMap[status] || 'status-pending';
    }

    function getStatusText(status) {
        const statusMap = {
            'active': 'Activo',
            'pending_verification': 'Pendiente',
            'suspended': 'Suspendido',
            'banned': 'Baneado',
            'deleted': 'Inactivo'
        };
        return statusMap[status] || status;
    }

    function getActionButtons(admin) {
        const activeAdminsCount = currentAdmins.filter(a => a.status === 'active').length;
        const canDelete = activeAdminsCount > 1 || admin.status !== 'active';

        let buttons = `
            <button class="table-link" style="background:none; border:none; padding:0; font:inherit; cursor:pointer;" commandfor="add-admin-modal" command="show-popover" data-action="edit" data-admin-id="${admin.id}">Editar</button>
        `;

        if (canDelete) {
            buttons += `
                <span class="table-link-separator">|</span>
                <a href="#" class="table-link table-link-danger" data-action="delete" data-admin-id="${admin.id}">Eliminar</a>
            `;
        } else {
            buttons += `
                <span class="table-link-separator">|</span>
                <span class="table-link" style="opacity: 0.5; cursor: not-allowed;" title="No se puede eliminar el último administrador activo">Eliminar</span>
            `;
        }

        return buttons;
    }

    let isEditing = false;
    let editingAdminId = null;

    async function saveAdministrator(formData) {
        try {
            const token = localStorage.getItem('token');
            const url = isEditing ? `${API_BASE_URL}/administrators/${editingAdminId}` : `${API_BASE_URL}/administrators`;
            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error al ${isEditing ? 'actualizar' : 'crear'} administrador`);
            }

            const result = await response.json();
            showSuccess(`Administrador ${isEditing ? 'actualizado' : 'creado'} exitosamente`);

            const modal = document.getElementById('add-admin-modal');
            if (modal) modal.hidePopover();

            loadAdministrators();

        } catch (error) {
            console.error(`Error ${isEditing ? 'actualizando' : 'creando'} administrador:`, error);
            showError(error.message || `Error al ${isEditing ? 'actualizar' : 'crear'} el administrador`);
        }
    }

    async function handleFormSubmit() {
        clearErrorMessages();

        const email = document.getElementById('admin-email').value.trim();
        const firstName = document.getElementById('admin-first-name').value.trim();
        const middleName = document.getElementById('admin-middle-name').value.trim();
        const lastName = document.getElementById('admin-last-name').value.trim();
        const motherLastName = document.getElementById('admin-mother-last-name').value.trim();
        const password = document.getElementById('admin-password').value;
        const birthDate = document.getElementById('admin-birthdate').value;
        const gender = document.getElementById('admin-gender').value;

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

        if (!isEditing && (!password || password.length < 8)) {
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

        let profileImageId = null;
        if (profileImageUploader && profileImageUploader.hasFile()) {
            profileImageId = await profileImageUploader.upload();
        }

        const adminData = {
            email,
            firstName,
            middleName,
            lastName,
            motherLastName,
            birthDate,
            gender,
            profileImageId
        };

        if (password) {
            adminData.password = password;
        }

        await saveAdministrator(adminData);
    }

    let adminToDelete = null;

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

    function populateForm(admin) {
        isEditing = true;
        editingAdminId = admin.id;

        document.querySelector('.modal-title').textContent = 'Editar Administrador';
        document.getElementById('submit-admin-btn').textContent = 'Guardar Cambios';

        
        document.getElementById('admin-email').value = admin.email;
        document.getElementById('admin-first-name').value = admin.firstName || admin.first_name;
        document.getElementById('admin-middle-name').value = admin.middleName || admin.middle_name || '';
        document.getElementById('admin-last-name').value = admin.lastName || admin.last_name;
        document.getElementById('admin-mother-last-name').value = admin.motherLastName || admin.mother_last_name || '';

        
        const birthDate = admin.birthDate || admin.birth_date;
        if (birthDate) {
            const date = new Date(birthDate);
            const formattedDate = date.toISOString().split('T')[0];
            document.getElementById('admin-birthdate').value = formattedDate;
        }

        
        const genderSelect = document.getElementById('admin-gender');
        if (genderSelect && admin.gender) {
            
            genderSelect.value = admin.gender;

            
            if (!genderSelect.value) {
                const genderMap = {
                    'male': 'M', 'Masculino': 'M', 'masculino': 'M', 'm': 'M',
                    'female': 'F', 'Femenino': 'F', 'femenino': 'F', 'f': 'F',
                    'other': 'O', 'Otro': 'O', 'otro': 'O', 'o': 'O',
                    'U': 'U', 'u': 'U'
                };
                
                const mappedValue = genderMap[admin.gender] || genderMap[admin.gender.toString().toLowerCase()];
                if (mappedValue) {
                    genderSelect.value = mappedValue;
                }
            }
        }

        
        const passwordContainer = document.getElementById('password-container');
        if (passwordContainer) {
            passwordContainer.style.display = 'none';
            const passwordInput = document.getElementById('admin-password');
            if (passwordInput) {
                passwordInput.required = false;
            }
        }

        
        const profileImageUrl = admin.profileImageUrl || admin.profile_image_url;
        if (profileImageUrl) {
            const profileLabel = document.querySelector('.profile-label');
            if (profileLabel) {
                profileLabel.style.backgroundImage = `url('${profileImageUrl}')`;
            }
        }
    }

    function attachEventListeners() {
        const submitButton = document.getElementById('submit-admin-btn');
        if (submitButton) {
            submitButton.addEventListener('click', handleFormSubmit);
        }

        const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', async () => {
                if (adminToDelete) {
                    const deleteModal = document.getElementById('delete-confirm-modal');
                    if (deleteModal) {
                        deleteModal.hidePopover();
                    }
                    await deleteAdministrator(adminToDelete);
                    adminToDelete = null;
                }
            });
        }

        document.addEventListener('click', async (e) => {
            const actionLink = e.target.closest('[data-action]');
            if (!actionLink) return;

            const action = actionLink.dataset.action;
            const adminId = actionLink.dataset.adminId;

            switch (action) {
                case 'edit':
                    const admin = currentAdmins.find(a => a.id == adminId);
                    if (admin) {
                        populateForm(admin);
                    } else {
                        console.error('Admin not found for ID:', adminId);
                    }
                    break;
                case 'delete':
                    e.preventDefault();
                    adminToDelete = adminId;
                    const deleteModal = document.getElementById('delete-confirm-modal');
                    if (deleteModal) {
                        deleteModal.showPopover();
                    }
                    break;
            }
        });

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

        const togglePassword = document.getElementById('toggle-password');
        const passwordInput = document.getElementById('admin-password');
        if (togglePassword && passwordInput) {
            togglePassword.addEventListener('change', () => {
                passwordInput.type = togglePassword.checked ? 'text' : 'password';
            });
        }
    }

    function showSuccess(message) {
        console.log('Success:', message);
        if (typeof Notification !== 'undefined') {
            Notification.success(message);
        } else {
            alert(message);
        }
    }

    function showError(message) {
        console.error('Error:', message);
        if (typeof Notification !== 'undefined') {
            Notification.error(message);
        } else {
            alert(message);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initializeModalEvents();
            loadAdministrators();
            attachEventListeners();

            profileImageUploader = new ImageUploader(
                'profile-picture-input',
                document.querySelector('.profile-label'),
                {
                    maxSize: 5 * 1024 * 1024,
                    endpoint: '/api/image',
                    imageType: 'avatar'
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
                imageType: 'avatar'
            }
        );
    }

})();
