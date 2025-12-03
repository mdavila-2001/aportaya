// User Projects Loader - Adaptado para usuario autenticado

const API_BASE_URL = '/api/projects';
let currentCategory = 'all';
let currentSearch = '';

// Crear tarjeta de proyecto (Reutilizable)
function createProjectCard(project) {
    const card = document.createElement('article');
    card.className = 'project-card';

    // Determinar icono de favorito
    const favoriteIcon = project.is_favorite ? 'favorite' : 'favorite_border';
    const favoriteLabel = project.is_favorite ? 'Quitar de favoritos' : 'Agregar a favoritos';

    // Calcular porcentaje
    const percentage = Math.round((project.raised_amount / project.goal_amount) * 100);
    const progressWidth = Math.min(percentage, 100);

    card.style.cursor = 'pointer';
    card.addEventListener('click', (e) => {
        if (!e.target.closest('.project-fav')) {
            window.location.href = `projectDetail.html?slug=${project.slug}`;
        }
    });

    card.innerHTML = `
        <div class="project-image-container">
            <img 
                src="${project.cover_image_url || '/images/placeholder-project.jpg'}" 
                alt="${project.title}"
                onerror="this.src='/images/placeholder-project.jpg'"
            />
            <button class="project-fav" aria-label="${favoriteLabel}" data-project-id="${project.id}">
                <span class="material-symbols-outlined">${favoriteIcon}</span>
            </button>
        </div>
        <div class="project-details">
            <h3 class="project-title">${project.title}</h3>
            <p class="project-description">${project.description}</p>
        </div>
        <div class="project-statistics">
            <div class="progress-info">
                <span class="goal-percentage">${percentage}%</span>
                <span class="raised-amount">Bs. ${parseFloat(project.raised_amount).toLocaleString()}</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progressWidth}%"></div>
            </div>
            <span class="project-goal">Meta: Bs. ${parseFloat(project.goal_amount).toLocaleString()}</span>
        </div>
    `;

    return card;
}

// Renderizar lista de proyectos
function renderProjects(projects) {
    const projectsGrid = document.querySelector('.projects-grid');

    if (!projectsGrid) {
        console.error('No se encontró el contenedor .projects-grid');
        return;
    }

    projectsGrid.innerHTML = '';

    if (projects.length === 0) {
        projectsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: var(--sp2XL); color: var(--text-light);">
                <span class="material-symbols-outlined" style="font-size: 48px; margin-bottom: 1rem;">search_off</span>
                <p>No se encontraron proyectos que coincidan con tu búsqueda.</p>
            </div>
        `;
        return;
    }

    projects.forEach(project => {
        const card = createProjectCard(project);
        projectsGrid.appendChild(card);
    });

    attachFavoriteListeners();
}

// Manejar clicks en favoritos
function attachFavoriteListeners() {
    const favoriteButtons = document.querySelectorAll('.project-fav');

    favoriteButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            e.stopPropagation(); // Evitar navegación a detalle
            const projectId = button.dataset.projectId;

            // Aquí iría la llamada al backend para togglear favorito
            // await toggleFavorite(projectId);

            // Por ahora simulación visual
            const icon = button.querySelector('.material-symbols-outlined');
            if (icon.textContent === 'favorite_border') {
                icon.textContent = 'favorite';
                button.setAttribute('aria-label', 'Quitar de favoritos');
            } else {
                icon.textContent = 'favorite_border';
                button.setAttribute('aria-label', 'Agregar a favoritos');
            }
            console.log(`Toggle favorito para proyecto ${projectId}`);
        });
    });
}

// Renderizar chips de categorías
function renderCategories(categories) {
    const categoryChips = document.querySelector('.category-chips');
    if (!categoryChips) return;

    // Mantener el chip "Todos" y limpiar el resto si es necesario, 
    // o reconstruir todo. Aquí reconstruimos para asegurar orden.
    categoryChips.innerHTML = '';

    // Chip "Todos"
    const allChip = createCategoryChip({ id: 'all', name: 'Todos' });
    if (currentCategory === 'all') allChip.classList.add('active'); // Usamos clase .active o atributo
    categoryChips.appendChild(allChip);

    categories.forEach(category => {
        const chip = createCategoryChip(category);
        if (currentCategory == category.id) chip.classList.add('active');
        categoryChips.appendChild(chip);
    });
}

function createCategoryChip(category) {
    const chip = document.createElement('button');
    chip.type = 'button';
    // Usamos las clases del sistema de diseño: chip chip-default
    // Si está activo, se le puede añadir una clase extra si el CSS lo soporta, o cambiar estilo
    chip.className = `chip chip-default ${currentCategory == category.id ? 'chip-active' : ''}`;
    chip.dataset.categoryId = category.id;
    chip.textContent = category.name;

    chip.addEventListener('click', () => {
        // Actualizar estado visual
        document.querySelectorAll('.category-chips .chip').forEach(c => c.classList.remove('chip-active'));
        chip.classList.add('chip-active');

        // Actualizar filtro y recargar
        currentCategory = category.id;
        fetchProjects();
    });

    return chip;
}

// Función principal para obtener proyectos
async function fetchProjects() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '../../auth/login.html';
            return;
        }

        const params = new URLSearchParams();
        if (currentSearch) params.append('searchBy', currentSearch);

        // El backend espera un objeto JSON en 'filterBy' para filtros complejos
        // O podemos adaptar el backend. Asumamos que el backend recibe query params directos o filterBy
        // Revisando projectController: const { searchBy, filterBy } = req.query;
        // const filters = filterBy ? JSON.parse(filterBy) : null;

        if (currentCategory && currentCategory !== 'all') {
            const filterObj = { category_id: currentCategory };
            params.append('filterBy', JSON.stringify(filterObj));
        }

        const url = `${API_BASE_URL}?${params.toString()}`;

        const response = await fetch(url, {
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
        const projects = result.data ? result.data.projects : [];
        const extraData = result.extraData || {};

        renderProjects(projects);

        // Renderizar categorías solo si es la primera carga o si no están renderizadas
        // Para evitar parpadeos, podemos verificar si ya hay chips (excepto "Todos")
        const chipsContainer = document.querySelector('.category-chips');
        if (chipsContainer && chipsContainer.children.length <= 1 && extraData.categories) {
            renderCategories(extraData.categories);
        }

    } catch (error) {
        console.error('Error:', error);
        const projectsGrid = document.querySelector('.projects-grid');
        if (projectsGrid) {
            projectsGrid.innerHTML = '<p class="error-message">Error al cargar los proyectos. Intenta nuevamente.</p>';
        }
    }
}

// Configurar búsqueda
function setupSearch() {
    const searchInput = document.getElementById('search-projects');
    let debounceTimer;

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                currentSearch = e.target.value;
                fetchProjects();
            }, 300);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../../auth/login.html';
        return;
    }

    setupSearch();
    fetchProjects();
});
