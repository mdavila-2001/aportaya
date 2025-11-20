function clearErrorMessages() {
    for (const e of document.querySelectorAll('.error_msg')) {
        e.textContent = '';
    }
}

function validateEmail(email) {
    if (!email) {
        document.getElementById('email_error_msg').textContent = 'Por favor, ingresa tu correo electrónico.';
        return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        document.getElementById('email_error_msg').textContent = 'Por favor, ingresa un correo electrónico válido.';
        return false;
    }
    
    return true;
}

function validatePassword(password) {
    if (!password) {
        document.getElementById('password_error_msg').textContent = 'Por favor, ingresa tu contraseña.';
        return false;
    }
    return true;
}

async function getUserRoleAndRedirect(token) {
    const meResponse = await fetch('/api/me', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (meResponse.ok) {
        const meData = await meResponse.json();
        const userRole = meData.data.role;
        
        const redirectUrl = userRole === 'Administrador' 
            ? '/pages/admin/users/admins.html' 
            : '/pages/user/dashboard.html';
        
        globalThis.location.href = redirectUrl;
    } else {
        globalThis.location.href = '/pages/user/dashboard.html';
    }
}

async function loginUser() {
    clearErrorMessages();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
        return;
    }

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
            localStorage.setItem('token', data.data.auth_token);
            await getUserRoleAndRedirect(data.data.auth_token);
        } else {
            document.getElementById('password_error_msg').textContent = data.message || 'Credenciales incorrectas.';
        }
    } catch (error) {
        console.error('Error during login:', error);
        document.getElementById('password_error_msg').textContent = 'Error al conectar con el servidor.';
    }
}

function initializeStars() {
    const stars = document.querySelectorAll('.star');
    
    const randomRange = (min, max) => {
        return Math.random() * (max - min) + min;
    };
    
    for (const star of stars) {
        const tailLength = randomRange(5, 7.5).toFixed(2);
        const topOffset = randomRange(-20, 100).toFixed(2);
        const leftOffset = randomRange(0, 100).toFixed(2);
        const fallDuration = randomRange(6, 12).toFixed(2);
        const fallDelay = randomRange(0, 10).toFixed(2);
        
        star.style.setProperty('--star-tail-length', `${tailLength}em`);
        star.style.setProperty('--top-offset', `${topOffset}vh`);
        star.style.setProperty('--left-offset', `${leftOffset}vw`);
        star.style.setProperty('--fall-duration', `${fallDuration}s`);
        star.style.setProperty('--fall-delay', `${fallDelay}s`);
        star.style.setProperty('--tail-fade-duration', `${fallDuration}s`);
    };
}

document.addEventListener('DOMContentLoaded', initializeStars);