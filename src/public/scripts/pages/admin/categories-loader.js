(function () {
    'use strict';

    const API_BASE_URL = '/api/admin';
    let currentEditingId = null;
    let categoriesData = [];

    
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

        if (categories.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: var(--spXL); color: var(--text-light);">
                        No hay categorías registradas
                    </td>
                </tr>
            `;
            paginationInfo.textContent = 'Mostrando 0 de 0';
            return;
        }

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

        paginationInfo.textContent = `Mostrando ${categories.length} de ${categories.length}`;

        
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
                deleteCategory(id);
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
                    alert(result.message || 'Error al guardar categoría');
                }
                return;
            }

            closeModal();
            loadCategories();
        } catch (error) {
            console.error('Error guardando categoría:', error);
            alert(error.message || 'Error al guardar la categoría');
        }
    }

    
    async function deleteCategory(id) {
        const category = categoriesData.find(c => c.id === parseInt(id));
        if (!category) return;

        if (!confirm(`¿Estás seguro de eliminar la categoría "${category.name}"?\n\nEsta acción no se puede deshacer.`)) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
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

            alert(result.message);
            loadCategories();
        } catch (error) {
            console.error('Error eliminando categoría:', error);
            alert(error.message || 'Error al eliminar la categoría');
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
