const API_BASE_URL = '/api/projects';

const urlParams = new URLSearchParams(window.location.search);
const projectSlug = urlParams.get('slug');

if (!projectSlug) {
    window.location.href = 'projects.html';
}

function calculateDaysRemaining(endDate) {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
}

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

function renderProject(project, isOwner) {
    document.getElementById('project-title').textContent = project.title;
    document.getElementById('breadcrumb-title').textContent = project.title;
    document.getElementById('project-meta').textContent =
        `${project.category_name} · Creado por ${project.creator_name}${project.location ? ' · ' + project.location : ''}`;
    document.getElementById('project-description').textContent = project.description;
    document.getElementById('project-cover').src = project.cover_image_url || '/images/placeholder-project.jpg';

    const percentage = Math.round((project.raised_amount / project.goal_amount) * 100);
    document.getElementById('funding-percentage').textContent = `${percentage}%`;
    document.getElementById('progress-fill').style.width = `${Math.min(percentage, 100)}%`;
    document.getElementById('funding-amount').textContent =
        `Bs. ${parseFloat(project.raised_amount).toLocaleString()} recaudados de Bs. ${parseFloat(project.goal_amount).toLocaleString()}`;

    const daysRemaining = calculateDaysRemaining(project.end_date);
    document.getElementById('days-remaining').textContent = daysRemaining;

    if (isOwner) {
        document.getElementById('updates-tab').style.display = 'block';
    }

    document.title = `${project.title} - AportaYa`;
}

function renderDonors(donors) {
    const donorsList = document.getElementById('donors-list');
    const backersCount = document.getElementById('backers-count');

    backersCount.textContent = donors.length;

    if (donors.length === 0) {
        donorsList.innerHTML = '<li style="text-align: center; color: var(--text-light); padding: var(--spM);">No hay donadores aún</li>';
        return;
    }

    donorsList.innerHTML = donors.map(donor => `
        <li class="donor-item">
            <img class="donor-avatar" src="${donor.avatar || '/uploads/avatar/blank/no_photo.png'}" alt="${donor.name}">
            <div class="donor-info">
                <p class="donor-name">${donor.name}</p>
            </div>
            <div class="donor-amount">Bs. ${parseFloat(donor.amount).toLocaleString()}</div>
        </li>
    `).join('');
}

function renderComments(comments) {
    const commentsList = document.getElementById('comments-list');
    const commentsCount = document.getElementById('comments-count');

    commentsCount.textContent = comments.length;

    if (comments.length === 0) {
        commentsList.innerHTML = `
            <div class="empty-state">
                <p>No hay comentarios aún. ¡Sé el primero en comentar!</p>
            </div>
        `;
        return;
    }

    commentsList.innerHTML = comments.map(comment => `
        <div class="comment-item">
            <img class="comment-avatar" src="${comment.author_avatar || '/uploads/avatar/blank/no_photo.png'}" alt="${comment.author_name}">
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

function renderUpdates(updates) {
    const updatesList = document.getElementById('updates-list');

    if (updates.length === 0) {
        updatesList.innerHTML = `
            <div class="empty-state">
                <p>No hay actualizaciones aún</p>
            </div>
        `;
        return;
    }

    updatesList.innerHTML = updates.map(update => `
        <div class="comment-content" style="margin-bottom: 1.5rem;">
            <div class="comment-header">
                <p class="comment-author">${update.title}</p>
                <p class="comment-date">${formatRelativeTime(update.created_at)}</p>
            </div>
            <p class="comment-text">${update.content}</p>
        </div>
    `).join('');
}

async function loadUserAvatar() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            const userAvatar = result.data.profile_image_url || '/uploads/avatar/blank/no_photo.png';

            const commentFormAvatar = document.querySelector('.comment-form .comment-avatar');
            if (commentFormAvatar) {
                commentFormAvatar.src = userAvatar;
            }
        }
    } catch (error) {
        console.error('Error cargando avatar del usuario:', error);
    }
}

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

async function submitComment() {
    const textarea = document.getElementById('new-comment');
    const submitButton = document.getElementById('submit-comment');
    const content = textarea.value.trim();

    if (!content) {
        alert('Por favor escribe un comentario');
        return;
    }

    if (content.length > 1000) {
        alert('El comentario no puede exceder 1000 caracteres');
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');

    if (!slug) {
        alert('Error: No se pudo identificar el proyecto');
        return;
    }

    try {
        submitButton.disabled = true;
        submitButton.textContent = 'Enviando...';

        const token = localStorage.getItem('token');
        const response = await fetch(`/api/projects/${slug}/comments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content })
        });

        const result = await response.json();

        if (response.ok) {
            textarea.value = '';

            const comment = result.data.comment;
            const commentsList = document.getElementById('comments-list');
            const commentsCount = document.getElementById('comments-count');

            const emptyState = commentsList.querySelector('.empty-state');
            if (emptyState) {
                emptyState.remove();
            }

            const commentHTML = `
                <div class="comment-item">
                    <img class="comment-avatar" src="${comment.author_avatar || '/uploads/avatar/blank/no_photo.png'}" alt="${comment.author_name}">
                    <div class="comment-content">
                        <div class="comment-header">
                            <p class="comment-author">${comment.author_name}</p>
                            <p class="comment-date">Justo ahora</p>
                        </div>
                        <p class="comment-text">${comment.content}</p>
                    </div>
                </div>
            `;

            commentsList.insertAdjacentHTML('afterbegin', commentHTML);

            const currentCount = parseInt(commentsCount.textContent);
            commentsCount.textContent = currentCount + 1;

        } else {
            alert(result.message || 'Error al enviar el comentario');
        }
    } catch (error) {
        console.error('Error enviando comentario:', error);
        alert('Error al enviar el comentario. Por favor intenta de nuevo.');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Comentar';
    }
}

function setupTabs() {
    const tabLinks = document.querySelectorAll('.tab-link');
    const contentSections = document.querySelectorAll('.content-section');

    tabLinks.forEach(link => {
        link.addEventListener('click', () => {
            const targetTab = link.dataset.tab;

            tabLinks.forEach(l => l.classList.remove('active'));
            contentSections.forEach(s => s.classList.remove('active'));

            link.classList.add('active');
            document.getElementById(`${targetTab}-content`).classList.add('active');
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../../auth/login.html';
        return;
    }

    setupTabs();
    loadUserAvatar();
    loadProjectDetail();

    const submitCommentBtn = document.getElementById('submit-comment');
    if (submitCommentBtn) {
        submitCommentBtn.addEventListener('click', submitComment);
    }
});
