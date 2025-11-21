async function signupUser() {
    for (const e of document.querySelectorAll('.error_msg')) {
        e.textContent = '';
    }

    const emailElement = document.getElementById('email');
    const passwordElement = document.getElementById('password');
    const confirmPasswordElement = document.getElementById('confirm-password');
    const firstNameElement = document.getElementById('first-name');
    const lastNameElement = document.getElementById('last-name');
    const birthdateElement = document.getElementById('birthdate');
    const genderElement = document.getElementById('gender');

    if (!emailElement || !passwordElement || !confirmPasswordElement || 
        !firstNameElement || !lastNameElement || !birthdateElement || !genderElement) {
        console.error('Error: No se encontraron todos los elementos del formulario');
        return false;
    }

    const email = emailElement.value;
    const password = passwordElement.value;
    const confirmPassword = confirmPasswordElement.value;
    const firstName = firstNameElement.value;
    const lastName = lastNameElement.value;
    const birthdate = birthdateElement.value;
    const gender = genderElement.value;

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
    
    if (!isValid) {
        return false;
    }
    console.log('Formulario válido - Listo para enviar');
    return true;
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

const profileInput = document.getElementById('profile-picture-input');
const profileLabel = document.querySelector('.profile-label');

if (profileInput && profileLabel) {
    profileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('Por favor, selecciona un archivo de imagen válido.');
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) {
                alert('La imagen no debe superar los 5MB.');
                return;
            }
            
            const url = URL.createObjectURL(file);
            
            profileLabel.style.backgroundImage = `url(${url})`;
            profileLabel.style.backgroundSize = 'cover';
            profileLabel.style.backgroundPosition = 'center';
            
            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 100);
        }
    });
}

document.addEventListener('DOMContentLoaded', initializeStars);