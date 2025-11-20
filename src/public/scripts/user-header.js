async function loadUserHeader() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        window.location.href = '/pages/auth/login.html';
        return;
    }

    try {
        const response = await fetch('/api/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/pages/auth/login.html';
                return;
            }
            throw new Error('Error al cargar datos del usuario');
        }

        const result = await response.json();
        const user = result.data;

        // Construir nombre completo
        const fullName = [
            user.first_name,
            user.middle_name,
            user.last_name,
            user.mother_last_name
        ].filter(Boolean).join(' ');

        // Actualizar elementos del header
        const userNameElement = document.querySelector('.user-name');
        const userAvatarElement = document.querySelector('.user-avatar');

        if (userNameElement) {
            userNameElement.textContent = fullName;
        }

        if (userAvatarElement && user.profile_image_url) {
            userAvatarElement.src = user.profile_image_url;
            userAvatarElement.alt = fullName;
        }

    } catch (error) {
        console.error('Error al cargar información del usuario:', error);
    }
}

// Cargar automáticamente cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', loadUserHeader);
