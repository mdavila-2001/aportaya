let profileUploader;

document.addEventListener('DOMContentLoaded', () => {
    initializeStars();

    profileUploader = new ImageUploader('profile-picture-input', '.profile-label');
});

async function signupUser() {
    for (const e of document.querySelectorAll('.error_msg')) {
        e.textContent = '';
        e.style.display = 'none';
    }

    const emailElement = document.getElementById('email');
    const passwordElement = document.getElementById('password');
    const confirmPasswordElement = document.getElementById('confirm-password');
    const firstNameElement = document.getElementById('first-name');
    const middleNameElement = document.getElementById('middle-name');
    const lastNameElement = document.getElementById('last-name');
    const motherLastNameElement = document.getElementById('mother-last-name');
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
    const middleName = middleNameElement.value;
    const lastName = lastNameElement.value;
    const motherLastName = motherLastNameElement.value;
    const birthdate = birthdateElement.value;
    const gender = genderElement.value;

    let isValid = true;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
        const emailError = document.getElementById('email_error_msg');
        emailError.textContent = 'Por favor, ingresa tu correo electrónico.';
        emailError.style.display = 'block';
        isValid = false;
    } else if (!emailRegex.test(email)) {
        const emailError = document.getElementById('email_error_msg');
        emailError.textContent = 'Por favor, ingresa un correo electrónico válido.';
        emailError.style.display = 'block';
        isValid = false;
    }

    if (!password) {
        const passwordError = document.getElementById('password_error_msg');
        passwordError.textContent = 'Por favor, ingresa tu contraseña.';
        passwordError.style.display = 'block';
        isValid = false;
    } else if (password.length < 8) {
        const passwordError = document.getElementById('password_error_msg');
        passwordError.textContent = 'La contraseña debe tener al menos 8 caracteres.';
        passwordError.style.display = 'block';
        isValid = false;
    }

    if (password !== confirmPassword) {
        const msg = document.getElementById('confirm_password_error_msg');
        msg.textContent = 'Las contraseñas no coinciden.';
        msg.style.display = 'block';
        isValid = false;
    }

    if (!firstName) {
        const firstNameError = document.getElementById('first_name_error_msg');
        firstNameError.textContent = 'Por favor, ingresa tu nombre.';
        firstNameError.style.display = 'block';
        isValid = false;
    }

    if (!lastName) {
        const lastNameError = document.getElementById('last_name_error_msg');
        lastNameError.textContent = 'Por favor, ingresa tu apellido.';
        lastNameError.style.display = 'block';
        isValid = false;
    }

    if (!birthdate) {
        const birthdateError = document.getElementById('birthdate_error_msg');
        birthdateError.textContent = 'Por favor, ingresa tu fecha de nacimiento.';
        birthdateError.style.display = 'block';
        isValid = false;
    } else if (new Date(birthdate).getTime() > Date.now()) {
        const birthdateError = document.getElementById('birthdate_error_msg');
        birthdateError.textContent = 'Por favor, ingresa una fecha de nacimiento válida.';
        birthdateError.style.display = 'block';
        isValid = false;
    }

    if (!gender) {
        const genderError = document.getElementById('gender_error_msg');
        genderError.textContent = 'Por favor, selecciona tu género';
        genderError.style.display = 'block';
        isValid = false;
    }
    
    if (!isValid) {
        return false;
    }
    
    console.log('Formulario válido - Iniciando proceso...');
    const btnSubmit = document.querySelector('.btn-submit');
    const originalText = btnSubmit.textContent;
    
    btnSubmit.textContent = 'Procesando...';
    btnSubmit.disabled = true;

    try {
        let uploadedImageID = null;
        if (profileUploader.hasFile()) {
            btnSubmit.textContent = 'Subiendo imagen...';
            uploadedImageID = await profileUploader.upload();

            if (!uploadedImageID) {
                console.warn('Error al subir la imagen de perfil.');
                Notification.warning('No se pudo subir la imagen de perfil. Subiendo sin imagen...');
            }
        }

        btnSubmit.textContent = 'Registrando...';

        const data = {
            "email": document.getElementById('email').value,
            "first-name": document.getElementById('first-name').value,
            "middle-name": document.getElementById('middle-name').value,
            "last-name": document.getElementById('last-name').value,
            "mother-last-name": document.getElementById('mother-last-name').value,
            "password": document.getElementById('password').value,
            "birthdate": document.getElementById('birthdate').value,
            "gender": document.getElementById('gender').value,
            "profile-image-id": uploadedImageID,
        };

        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Error al registrar el usuario.');
        }

        Notification.success('Registro exitoso. Por favor verifica tu correo electrónico.');

        setTimeout(() => {
            window.location.href = '/auth/login.html';
        }, 3000);
    } catch (error) {
        console.error('Error durante el registro:', error);
        Notification.error(error.message || 'Error al registrar el usuario.');
    } finally {
        btnSubmit.textContent = originalText;
        btnSubmit.disabled = false;
    }
    
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