async function loadUserHeader() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        globalThis.location.href = '/pages/auth/login.html';
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
                globalThis.location.href = '/pages/auth/login.html';
                return;
            }
            throw new Error('Error al cargar datos del usuario');
        }

        const result = await response.json();
        const user = result.data;

        const fullName = [
            user.first_name,
            user.middle_name,
            user.last_name,
            user.mother_last_name
        ].filter(Boolean).join(' ');

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

function setupLogout() {
    const logoutButton = document.querySelector('.logout-btn');
    if (logoutButton) {
        logoutButton.addEventListener('click', async (e) => {
            e.preventDefault();
            
            const token = localStorage.getItem('token');

            if (token) {
                try {
                    await fetch('/api/logout', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                } catch (error) {
                    console.error('Error al cerrar sesión:', error);
                    Notification.error({
                        message: 'Error al cerrar sesión',
                        duration: 3000
                    });
                }

                localStorage.removeItem('token');
                localStorage.removeItem('user');

                globalThis.location.href = '/pages/auth/login.html';
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    loadUserHeader();
    setupLogout();
});
