const API_BASE_URL = '/api/projects';

// Obtener slug de la URL
const urlParams = new URLSearchParams(window.location.search);
const projectSlug = urlParams.get('slug');

if (!projectSlug) {
    window.location.href = 'projects.html';
}

// Función para calcular días restantes
function calculateDaysRemaining(endDate) {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
}

// Función para formatear fecha relativa
function formatRelativeTime(date) {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    return `Hace ${Math.floor(diffDays / 30)} meses`;
}

// Renderizar proyecto
function renderProject(project, isOwner) {
    document.getElementById('project-title').textContent = project.title;
    document.getElementById('breadcrumb-title').textContent = project.title;
    document.getElementById('project-meta').textContent =
        `${project.category_name} · Creado por ${project.creator_name}${project.location ? ' · ' + project.location : ''}`;
    document.getElementById('project-description').textContent = project.description;
    document.getElementById('project-cover').src = project.cover_image_url || '/images/placeholder-project.jpg';

    // Calcular progreso
    const percentage = Math.round((project.raised_amount / project.goal_amount) * 100);
    document.getElementById('funding-percentage').textContent = `${percentage}%`;
    document.getElementById('progress-fill').style.width = `${Math.min(percentage, 100)}%`;
    document.getElementById('funding-amount').textContent =
        `Bs. ${parseFloat(project.raised_amount).toLocaleString()} recaudados de Bs. ${parseFloat(project.goal_amount).toLocaleString()}`;

    // Días restantes
    const daysRemaining = calculateDaysRemaining(project.end_date);
    document.getElementById('days-remaining').textContent = daysRemaining;

    // Mostrar tab de actualizaciones solo para el dueño
    if (isOwner) {
        document.getElementById('updates-tab').style.display = 'block';
    }
}

// Renderizar donadores
function renderDonors(donors) {
    const donorsList = document.getElementById('donors-list');
    const backersCount = document.getElementById('backers-count');

    // Aquí deberías obtener el conteo real de todos los donadores, no solo los top 3
    backersCount.textContent = donors.length;

    if (donors.length === 0) {
        donorsList.innerHTML = '<li style="text-align: center; color: var(--text-light); padding: var(--spM);">No hay donadores aún</li>';
        return;
    }

    donorsList.innerHTML = donors.map(donor => `
        <li class="donor-item">
            <img class="donor-avatar" src="${donor.avatar || '/uploads/avatar/default.png'}" alt="${donor.name}">
            <div class="donor-info">
                <p class="donor-name">${donor.name}</p>
            </div>
            <div class="donor-amount">Bs. ${parseFloat(donor.amount).toLocaleString()}</div>
        </li>
    `).join('');
}

// Renderizar comentarios
function renderComments(comments) {
    const commentsList = document.getElementById('comments-list');
    const commentsCount = document.getElementById('comments-count');

    commentsCount.textContent = comments.length;

    if (comments.length === 0) {
        commentsList.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: var(--spXL);">No hay comentarios aún. ¡Sé el primero en comentar!</p>';
        return;
    }

    commentsList.innerHTML = comments.map(comment => `
        <div class="comment-item">
            <img class="user-avatar-sm" src="${comment.author_avatar || '/uploads/avatar/default.png'}" alt="${comment.author_name}">
            <div class="comment-content">
                <div class="comment-header">
                    <p class="comment-author">${comment.author_name}</p>
                    <p class="comment-date">${formatRelativeTime(comment.created_at)}</p>
                </div>
                <p class="comment-text">${comment.content}</p>
            </div>
        </div>
    `).join('');
}

// Renderizar actualizaciones
function renderUpdates(updates) {
    const updatesList = document.getElementById('updates-list');

    if (updates.length === 0) {
        updatesList.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: var(--spXL);">No hay actualizaciones aún</p>';
        return;
    }

    updatesList.innerHTML = updates.map(update => `
        <div class="comment-content" style="margin-bottom: var(--spL);">
            <div class="comment-header">
                <p class="comment-author">${update.title}</p>
                <p class="comment-date">${formatRelativeTime(update.created_at)}</p>
            </div>
            <p class="comment-text">${update.content}</p>
        </div>
    `).join('');
}

// Cargar avatar del usuario logueado
async function loadUserAvatar() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/user/home', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            const userAvatar = result.data.user.profile_image_url || '/uploads/avatar/admin.png';

            // Actualizar avatar en el formulario de comentarios
            const commentFormAvatar = document.querySelector('.comment-form .user-avatar-sm');
            if (commentFormAvatar) {
                commentFormAvatar.src = userAvatar;
            }
        }
    } catch (error) {
        console.error('Error cargando avatar del usuario:', error);
    }
}

// Cargar datos del proyecto
async function loadProjectDetail() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '../../auth/login.html';
            return;
        }

        const response = await fetch(`${API_BASE_URL}/${projectSlug}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                alert('Proyecto no encontrado');
                window.location.href = 'projects.html';
                return;
            }
            throw new Error('Error al cargar el proyecto');
        }

        const result = await response.json();
        const { project, donors, comments, updates } = result.data;
        const isOwner = result.extraData.is_owner;

        renderProject(project, isOwner);
        renderDonors(donors);
        renderComments(comments);
        renderUpdates(updates);

    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar los detalles del proyecto');
    }
}

// Manejo de tabs
function setupTabs() {
    const tabLinks = document.querySelectorAll('.tab-link');
    const contentSections = document.querySelectorAll('.content-section');

    tabLinks.forEach(link => {
        link.addEventListener('click', () => {
            const targetTab = link.dataset.tab;

            // Remover active de todos
            tabLinks.forEach(l => l.classList.remove('active'));
            contentSections.forEach(s => s.classList.remove('active'));

            // Activar seleccionado
            link.classList.add('active');
            document.getElementById(`${targetTab}-content`).classList.add('active');
        });
    });
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../../auth/login.html';
        return;
    }

    setupTabs();
    loadUserAvatar();
    loadProjectDetail();
});
