// Elementos del DOM
const projectsGrid = document.getElementById('projects-grid');
const loadingContainer = document.getElementById('loading');
const emptyState = document.getElementById('empty-state');

// Cargar favoritos
async function loadFavorites() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/user/favorites', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            renderProjects(data.data.projects);
        } else {
            showError('Error al cargar favoritos');
        }
    } catch (error) {
        console.error('Error loading favorites:', error);
        showError('Error al cargar favoritos');
    } finally {
        loadingContainer.style.display = 'none';
    }
}

// Renderizar proyectos
function renderProjects(projects) {
    if (projects.length === 0) {
        emptyState.style.display = 'flex';
        return;
    }

    projectsGrid.innerHTML = '';

    projects.forEach(project => {
        const card = createProjectCard(project);
        projectsGrid.appendChild(card);
    });

    // Attach listeners para favoritos
    attachFavoriteListeners();
}

// Crear card de proyecto
function createProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'project-card';
    card.style.cursor = 'pointer';

    const progress = ((project.raised_amount / project.financial_goal) * 100).toFixed(0);
    const daysLeft = calculateDaysLeft(project.end_date);

    card.innerHTML = `
        <div class="project-image-container">
            <img src="${project.cover_image_url || '/images/placeholder-project.jpg'}" 
                 alt="${project.title}" 
                 class="project-image">
            <button class="project-fav" data-project-id="${project.id}" aria-label="Quitar de favoritos">
                <span class="material-symbols-outlined filled">favorite</span>
            </button>
        </div>
        <div class="project-content">
            <div class="project-category">
                <span class="category-chip">${project.category_name}</span>
            </div>
            <h3 class="project-title">${project.title}</h3>
            <p class="project-description">${project.summary || 'Sin descripción'}</p>
            <div class="project-creator">
                <span class="material-symbols-outlined">person</span>
                <span>por ${project.creator_name}</span>
            </div>
            <div class="project-stats">
                <div class="stat">
                    <span class="stat-value">Bs. ${parseFloat(project.raised_amount).toLocaleString()}</span>
                    <span class="stat-label">recaudados de Bs. ${parseFloat(project.financial_goal).toLocaleString()}</span>
                </div>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
            <div class="project-footer">
                <div class="footer-stat">
                    <span class="material-symbols-outlined">schedule</span>
                    <span>${daysLeft} días restantes</span>
                </div>
                <div class="footer-stat">
                    <span class="material-symbols-outlined">location_on</span>
                    <span>${project.location || 'Bolivia'}</span>
                </div>
            </div>
        </div>
    `;

    // Click en card para ir a detalle
    card.addEventListener('click', (e) => {
        if (!e.target.closest('.project-fav')) {
            window.location.href = `projectDetail.html?slug=${project.slug}`;
        }
    });

    return card;
}

// Calcular días restantes
function calculateDaysLeft(endDate) {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
}

// Manejar clicks en favoritos
function attachFavoriteListeners() {
    const favoriteButtons = document.querySelectorAll('.project-fav');

    favoriteButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            e.stopPropagation();
            const projectId = button.dataset.projectId;

            await toggleFavorite(projectId, button);
        });
    });
}

// Toggle de favorito
async function toggleFavorite(projectId, button) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/user/favorites/${projectId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success) {
            // Si se removió de favoritos, quitar del DOM
            if (!data.data.is_favorited) {
                const card = button.closest('.project-card');
                card.style.opacity = '0';
                card.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    card.remove();
                    // Verificar si quedaron proyectos
                    const remainingCards = projectsGrid.querySelectorAll('.project-card');
                    if (remainingCards.length === 0) {
                        emptyState.style.display = 'flex';
                    }
                }, 300);
            }
        } else {
            console.error('Error:', data.message);
        }
    } catch (error) {
        console.error('Error toggling favorite:', error);
        alert('Error al actualizar favoritos');
    }
}

// Mostrar error
function showError(message) {
    projectsGrid.innerHTML = `
        <div class="error-state">
            <span class="material-symbols-outlined">error</span>
            <p>${message}</p>
        </div>
    `;
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../../auth/login.html';
        return;
    }

    loadFavorites();
});
