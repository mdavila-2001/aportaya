function createProjectCard(project) {
    const card = document.createElement('article');
    card.className = 'project-card';

    const favoriteIcon = project.is_favorite ? 'favorite' : 'favorite_border';

    const percentage = Math.round((project.raised_amount / project.goal_amount) * 100);

    card.style.cursor = 'pointer';
    card.addEventListener('click', (e) => {
        if (!e.target.closest('.project-fav')) {
            const identifier = project.slug || project.id;
            window.location.href = `details.html?slug=${identifier}`;
        }
    });

    card.innerHTML = `
        <div class="project-image-container">
            <img 
                src="${project.cover_image_url}" 
                alt="${project.title}"
                onerror="this.src='../../images/placeholder-project.jpg'"
            />
            <button class="project-fav" aria-label="${project.is_favorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}" data-project-id="${project.id}">
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
                <span class="raised-amount">$${project.raised_amount.toLocaleString()}</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${percentage}%"></div>
            </div>
            <span class="project-goal">Meta: $${project.goal_amount.toLocaleString()}</span>
        </div>
    `;

    return card;
}

function renderProjects(projects) {
    const projectsGrid = document.querySelector('.projects-grid');

    if (!projectsGrid) {
        console.error('No se encontró el contenedor de proyectos');
        return;
    }

    projectsGrid.innerHTML = '';

    if (projects.length === 0) {
        projectsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: var(--sp2XL); color: var(--text-light);">
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

function attachFavoriteListeners() {
    const favoriteButtons = document.querySelectorAll('.project-fav');

    favoriteButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const icon = button.querySelector('.material-symbols-outlined');

            
            if (icon.textContent === 'favorite_border') {
                icon.textContent = 'favorite';
                button.setAttribute('aria-label', 'Quitar de favoritos');
            } else {
                icon.textContent = 'favorite_border';
                button.setAttribute('aria-label', 'Agregar a favoritos');
            }

            const projectId = button.dataset.projectId;
            console.log(`Toggle favorito para proyecto ${projectId}`);
        });
    });
}

function renderCategories(categories) {
    const categoryChips = document.querySelector('.category-chips');

    if (!categoryChips) return;

    categoryChips.innerHTML = '';

    categories.forEach(category => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'chip';
        chip.setAttribute('aria-pressed', 'false');
        chip.dataset.categoryId = category.id;
        chip.textContent = category.name;

        
        chip.addEventListener('click', () => {
            const isPressed = chip.getAttribute('aria-pressed') === 'true';
            chip.setAttribute('aria-pressed', !isPressed);

            console.log(`Filtrar por categoría: ${category.name}`);
        });

        categoryChips.appendChild(chip);
    });
}

async function loadProjects() {
    await fetchProjects();
}

async function fetchProjects(searchBy = '') {
    try {
        let url = '/api/projects';
        const params = new URLSearchParams();
        
        if (searchBy) {
            params.append('searchBy', searchBy);
        }

        if (params.toString()) {
            url += `?${params.toString()}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Error al cargar los proyectos');
        }
        const result = await response.json();
        
        
        const projects = result.data ? result.data.projects : [];
        const extraData = result.extraData || {};

        renderProjects(projects);
        
        if (extraData.categories) {
            renderCategories(extraData.categories);
        }

        if (extraData) {
            updateExtraInfo(extraData);
        }
    } catch (error) {
        console.error('Error al obtener proyectos:', error);
        showErrorMessage();
    }
}

function updateExtraInfo(extraData) {
    
    if (extraData.totalProjects !== undefined) {
         console.log(`Total proyectos: ${extraData.totalProjects}`);
    }
}

function showErrorMessage() {
    const projectsGrid = document.querySelector('.projects-grid');

    if (projectsGrid) {
        projectsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: var(--sp2XL); color: var(--text-light);">
                <p>Error al cargar los proyectos. Por favor, intenta de nuevo más tarde.</p>
            </div>
        `;
    }
}

function setupSearch() {
    const searchInput = document.getElementById('search-projects');
    const searchForm = document.querySelector('.sidebar-search');
    let debounceTimer;

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                fetchProjects(e.target.value);
            }, 300); 
        });
    }

    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (searchInput) {
                fetchProjects(searchInput.value);
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchProjects(); 
    setupSearch();   
});
