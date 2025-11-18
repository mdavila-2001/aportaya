async function signupUser() {
    for (const e of document.querySelectorAll('.error_msg')) {
        e.textContent = '';
    }

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const firstName = document.getElementById('first-name').value;
    const lastName = document.getElementById('last-name').value;
    const birthdate = document.getElementById('birthdate').value;
    const gender = document.getElementById('gender').value;

    let isValid = true;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
        document.getElementById('email_error_msg').textContent = 'Por favor, ingresa tu correo electrónico.';
        isValid = false;
    } else if (!emailRegex.test(email)) {
        document.getElementById('email_error_msg').textContent = 'Por favor, ingresa un correo electrónico válido.';
        isValid = false;
    }

    if (!password) {
        document.getElementById('password_error_msg').textContent = 'Por favor, ingresa tu contraseña.';
        isValid = false;
    } else if (password.length < 8) {
        document.getElementById('password_error_msg').textContent = 'La contraseña debe tener al menos 8 caracteres.';
        isValid = false;
    }

    if (password !== confirmPassword) {
        const msg = document.getElementById('confirm_password_error_msg');
        msg.textContent = 'Las contraseñas no coinciden.';
        msg.style.display = 'block';
        isValid = false;
    }

    if (!firstName) {
        document.getElementById('first_name_error_msg').textContent = 'Por favor, ingresa tu nombre.';
        isValid = false;
    }

    if (!lastName) {
        document.getElementById('last_name_error_msg').textContent = 'Por favor, ingresa tu apellido.';
        isValid = false;
    }

    if (!birthdate) {
        document.getElementById('birthdate_error_msg').textContent = 'Por favor, ingresa tu fecha de nacimiento.';
        isValid = false;
    } else if (new Date(birthdate).getTime() > new Date().now()) {
        document.getElementById('birthdate_error_msg').textContent = 'Por favor, ingresa una fecha de nacimiento válida.';
        isValid = false;
    }

    if (!gender) {
        document.getElementById('gender_error_msg').textContent = 'Por favor, selecciona tu género';
        isValid = false;
    }

    return isValid;
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