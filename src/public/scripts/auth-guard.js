/**
 * Auth Guard - Protege rutas según el rol del usuario
 * Incluir este script en todas las páginas que requieran autenticación
 */

async function checkAuth(requiredRole = null) {
    const token = localStorage.getItem('token');
    
    if (!token) {
        redirectToLogin();
        return false;
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
                redirectToLogin();
                return false;
            }
            throw new Error('Error verificando autenticación');
        }

        const data = await response.json();
        const userRole = data.data.role;

        // Si se requiere un rol específico, validarlo
        if (requiredRole && userRole !== requiredRole) {
            // Redirigir según el rol real del usuario
            if (userRole === 'Administrador') {
                window.location.href = '/pages/admin/dashboard.html';
            } else {
                window.location.href = '/pages/user/dashboard.html';
            }
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error en verificación de autenticación:', error);
        localStorage.removeItem('token');
        redirectToLogin();
        return false;
    }
}

function redirectToLogin() {
    window.location.href = '/pages/auth/login.html';
}

// Función para proteger página de admin
async function requireAdmin() {
    return await checkAuth('Administrador');
}

// Función para proteger página de usuario
async function requireUser() {
    return await checkAuth('Usuario');
}

// Función para solo verificar login (cualquier rol)
async function requireAuth() {
    return await checkAuth();
}
