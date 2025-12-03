(function () {
    'use strict';

    const API_BASE_URL = '/api/admin';
    let currentEditingId = null;
    let categoriesData = [];
    let categoryToDelete = null;


    const tbody = document.getElementById('categories-tbody');
    const searchInput = document.getElementById('search-input');
    const btnCreate = document.getElementById('btn-create-category');
    const modal = document.getElementById('category-modal');
    const modalTitle = document.getElementById('modal-title');
    const categoryForm = document.getElementById('category-form');
    const btnCancel = document.getElementById('btn-cancel-modal');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnSave = document.getElementById('btn-save-category');
    const paginationInfo = document.getElementById('pagination-info');
    const deleteModal = document.getElementById('delete-confirm-modal');
    const btnConfirmDelete = document.getElementById('confirm-delete-btn');


    async function loadCategories() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '../auth/login.html';
                return;
            }

            const response = await fetch(`${API_BASE_URL}/categories`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem('token');
                    window.location.href = '../auth/login.html';
                    return;
                }
                throw new Error('Error al cargar categorías');
            }

            const result = await response.json();
            categoriesData = result.data.categories;
            renderCategories(categoriesData);
        } catch (error) {
            console.error('Error cargando categorías:', error);
            showError('Error al cargar las categorías');
        }
    }


    function renderCategories(categories) {
        tbody.innerHTML = '';

        categories.forEach(category => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="cell-name">${escapeHtml(category.name)}</td>
                <td class="cell-secondary">${escapeHtml(category.slug)}</td>
                <td class="cell-secondary">${escapeHtml(category.description || 'Sin descripción')}</td>
                <td>
                    <div class="table-actions">
                        <a href="#" class="table-link" data-action="edit" data-id="${category.id}">Editar</a>
                        <span class="table-link-separator">|</span>
                        <a href="#" class="table-link table-link-danger" data-action="delete" data-id="${category.id}">Eliminar</a>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });


        attachActionListeners();
    }


    function attachActionListeners() {
        const editButtons = document.querySelectorAll('[data-action="edit"]');
        const deleteButtons = document.querySelectorAll('[data-action="delete"]');

        editButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const id = btn.dataset.id;
                openEditModal(id);
            });
        });

        deleteButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const id = btn.dataset.id;
                openDeleteModal(id);
            });
        });
    }


    function openCreateModal() {
        currentEditingId = null;
        modalTitle.textContent = 'Nueva Categoría';
        categoryForm.reset();
        window.categoryModalValidator.clearAllErrors();
        window.categoryModalValidator.resetSlugGeneration();
        modal.showPopover();
    }


    function openEditModal(id) {
        const category = categoriesData.find(c => c.id === parseInt(id));
        if (!category) return;

        currentEditingId = id;
        modalTitle.textContent = 'Editar Categoría';
        document.getElementById('category-name').value = category.name;
        document.getElementById('category-slug').value = category.slug;
        document.getElementById('category-description').value = category.description || '';
        window.categoryModalValidator.clearAllErrors();
        modal.showPopover();
    }


    function closeModal() {
        modal.hidePopover();
        categoryForm.reset();
        window.categoryModalValidator.clearAllErrors();
        currentEditingId = null;
    }


    async function saveCategory(e) {
        e.preventDefault();


        if (!window.categoryModalValidator.validateAll()) {
            return;
        }

        const categoryData = {
            name: document.getElementById('category-name').value.trim(),
            slug: document.getElementById('category-slug').value.trim(),
            description: document.getElementById('category-description').value.trim()
        };

        try {
            const token = localStorage.getItem('token');
            const url = currentEditingId
                ? `${API_BASE_URL}/categories/${currentEditingId}`
                : `${API_BASE_URL}/categories`;

            const method = currentEditingId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(categoryData)
            });

            const result = await response.json();

            if (!response.ok) {
                if (result.message && result.message.includes('slug')) {
                    window.categoryModalValidator.showCustomError('slug', result.message);
                } else {
                    Notification.error(result.message || 'Error al guardar categoría');
                }
                return;
            }

            Notification.success(currentEditingId ? 'Categoría actualizada exitosamente' : 'Categoría creada exitosamente');
            closeModal();
            loadCategories();
        } catch (error) {
            console.error('Error guardando categoría:', error);
            Notification.error(error.message || 'Error al guardar la categoría');
        }
    }

    function openDeleteModal(id) {
        const category = categoriesData.find(c => c.id === parseInt(id));
        if (!category) return;

        categoryToDelete = id;
        if (deleteModal) {
            deleteModal.showPopover();
        }
    }


    async function deleteCategory() {
        if (!categoryToDelete) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/categories/${categoryToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Error al eliminar categoría');
            }

            Notification.success('Categoría eliminada exitosamente');
            loadCategories();
        } catch (error) {
            console.error('Error eliminando categoría:', error);
            Notification.error(error.message || 'Error al eliminar la categoría');
        } finally {
            categoryToDelete = null;
        }
    }


    function filterCategories() {
        const searchTerm = searchInput.value.toLowerCase().trim();

        if (!searchTerm) {
            renderCategories(categoriesData);
            return;
        }

        const filtered = categoriesData.filter(cat =>
            cat.name.toLowerCase().includes(searchTerm) ||
            cat.slug.toLowerCase().includes(searchTerm) ||
            (cat.description && cat.description.toLowerCase().includes(searchTerm))
        );

        renderCategories(filtered);
    }


    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }


    function showError(message) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: var(--spXL); color: var(--error);">
                    ${message}
                </td>
            </tr>
        `;
    }


    btnCreate.addEventListener('click', openCreateModal);
    btnCancel.addEventListener('click', closeModal);
    btnCloseModal.addEventListener('click', closeModal);
    btnSave.addEventListener('click', saveCategory);
    searchInput.addEventListener('input', filterCategories);

    if (btnConfirmDelete) {
        btnConfirmDelete.addEventListener('click', async () => {
            if (deleteModal) {
                deleteModal.hidePopover();
            }
            await deleteCategory();
        });
    }


    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });


    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadCategories);
    } else {
        loadCategories();
    }

})();
