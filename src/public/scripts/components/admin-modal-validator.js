/**
 * Script de validación para el modal de administradores
 * Maneja validaciones en tiempo real y mensajes de error
 */
(function () {
    'use strict';

    // === ELEMENTOS DEL DOM ===
    const form = document.getElementById('admin-form');
    const emailInput = document.getElementById('admin-email');
    const firstNameInput = document.getElementById('admin-first-name');
    const middleNameInput = document.getElementById('admin-middle-name');
    const lastNameInput = document.getElementById('admin-last-name');
    const motherLastNameInput = document.getElementById('admin-mother-last-name');
    const passwordInput = document.getElementById('admin-password');
    const birthdateInput = document.getElementById('admin-birthdate');
    const genderInput = document.getElementById('admin-gender');

    const emailError = document.getElementById('admin_email_error_msg');
    const firstNameError = document.getElementById('admin_first_name_error_msg');
    const lastNameError = document.getElementById('admin_last_name_error_msg');
    const passwordError = document.getElementById('admin_password_error_msg');
    const birthdateError = document.getElementById('admin_birthdate_error_msg');
    const genderError = document.getElementById('admin_gender_error_msg');

    // Estado de edición
    let isEditMode = false;

    // === FUNCIONES DE VALIDACIÓN ===

    /**
     * Validar campo de email
     */
    function validateEmail() {
        const value = emailInput.value.trim();
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!value) {
            emailError.textContent = 'El correo electrónico es requerido';
            emailInput.classList.add('input-error');
            return false;
        }

        if (!emailPattern.test(value)) {
            emailError.textContent = 'El correo electrónico no es válido';
            emailInput.classList.add('input-error');
            return false;
        }

        emailError.textContent = '';
        emailInput.classList.remove('input-error');
        return true;
    }

    /**
     * Validar campo de nombre
     */
    function validateFirstName() {
        const value = firstNameInput.value.trim();

        if (!value) {
            firstNameError.textContent = 'El nombre es requerido';
            firstNameInput.classList.add('input-error');
            return false;
        }

        if (value.length < 2) {
            firstNameError.textContent = 'El nombre debe tener al menos 2 caracteres';
            firstNameInput.classList.add('input-error');
            return false;
        }

        if (value.length > 50) {
            firstNameError.textContent = 'El nombre no puede exceder 50 caracteres';
            firstNameInput.classList.add('input-error');
            return false;
        }

        firstNameError.textContent = '';
        firstNameInput.classList.remove('input-error');
        return true;
    }

    /**
     * Validar campo de apellido paterno
     */
    function validateLastName() {
        const value = lastNameInput.value.trim();

        if (!value) {
            lastNameError.textContent = 'El apellido paterno es requerido';
            lastNameInput.classList.add('input-error');
            return false;
        }

        if (value.length < 2) {
            lastNameError.textContent = 'El apellido debe tener al menos 2 caracteres';
            lastNameInput.classList.add('input-error');
            return false;
        }

        if (value.length > 50) {
            lastNameError.textContent = 'El apellido no puede exceder 50 caracteres';
            lastNameInput.classList.add('input-error');
            return false;
        }

        lastNameError.textContent = '';
        lastNameInput.classList.remove('input-error');
        return true;
    }

    /**
     * Validar campo de contraseña
     */
    function validatePassword() {
        // Si estamos en modo edición, la contraseña no es requerida
        if (isEditMode && !passwordInput.value) {
            passwordError.textContent = '';
            passwordInput.classList.remove('input-error');
            return true;
        }

        const value = passwordInput.value;

        if (!value) {
            passwordError.textContent = 'La contraseña es requerida';
            passwordInput.classList.add('input-error');
            return false;
        }

        if (value.length < 8) {
            passwordError.textContent = 'La contraseña debe tener al menos 8 caracteres';
            passwordInput.classList.add('input-error');
            return false;
        }

        if (value.length > 100) {
            passwordError.textContent = 'La contraseña no puede exceder 100 caracteres';
            passwordInput.classList.add('input-error');
            return false;
        }

        passwordError.textContent = '';
        passwordInput.classList.remove('input-error');
        return true;
    }

    /**
     * Validar fecha de nacimiento
     */
    function validateBirthdate() {
        const value = birthdateInput.value;

        if (!value) {
            birthdateError.textContent = 'La fecha de nacimiento es requerida';
            birthdateInput.classList.add('input-error');
            return false;
        }

        // Validar que sea mayor de edad (18 años)
        const birthDate = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        if (age < 18) {
            birthdateError.textContent = 'Debe ser mayor de 18 años';
            birthdateInput.classList.add('input-error');
            return false;
        }

        if (age > 120) {
            birthdateError.textContent = 'Fecha de nacimiento no válida';
            birthdateInput.classList.add('input-error');
            return false;
        }

        birthdateError.textContent = '';
        birthdateInput.classList.remove('input-error');
        return true;
    }

    /**
     * Validar género
     */
    function validateGender() {
        const value = genderInput.value;

        if (!value) {
            genderError.textContent = 'El género es requerido';
            genderInput.classList.add('input-error');
            return false;
        }

        genderError.textContent = '';
        genderInput.classList.remove('input-error');
        return true;
    }

    /**
     * Validar todo el formulario
     */
    function validateAll() {
        const isEmailValid = validateEmail();
        const isFirstNameValid = validateFirstName();
        const isLastNameValid = validateLastName();
        const isPasswordValid = validatePassword();
        const isBirthdateValid = validateBirthdate();
        const isGenderValid = validateGender();

        return isEmailValid && isFirstNameValid && isLastNameValid && isPasswordValid && isBirthdateValid && isGenderValid;
    }

    /**
     * Limpiar todos los errores
     */
    function clearAllErrors() {
        emailError.textContent = '';
        firstNameError.textContent = '';
        lastNameError.textContent = '';
        passwordError.textContent = '';
        birthdateError.textContent = '';
        genderError.textContent = '';

        emailInput.classList.remove('input-error');
        firstNameInput.classList.remove('input-error');
        lastNameInput.classList.remove('input-error');
        passwordInput.classList.remove('input-error');
        birthdateInput.classList.remove('input-error');
        genderInput.classList.remove('input-error');
    }

    /**
     * Mostrar error personalizado en un campo específico
     */
    function showCustomError(field, message) {
        const errorFields = {
            'email': { input: emailInput, error: emailError },
            'firstName': { input: firstNameInput, error: firstNameError },
            'lastName': { input: lastNameInput, error: lastNameError },
            'password': { input: passwordInput, error: passwordError },
            'birthdate': { input: birthdateInput, error: birthdateError },
            'gender': { input: genderInput, error: genderError }
        };

        if (errorFields[field]) {
            errorFields[field].error.textContent = message;
            errorFields[field].input.classList.add('input-error');
        }
    }

    /**
     * Establecer modo edición
     */
    function setEditMode(editing) {
        isEditMode = editing;
    }

    // === EVENT LISTENERS ===

    // Validar en blur (cuando el campo pierde el foco)
    emailInput.addEventListener('blur', validateEmail);
    firstNameInput.addEventListener('blur', validateFirstName);
    lastNameInput.addEventListener('blur', validateLastName);
    passwordInput.addEventListener('blur', validatePassword);
    birthdateInput.addEventListener('blur', validateBirthdate);
    genderInput.addEventListener('blur', validateGender);

    // Limpiar errores cuando el usuario empieza a escribir
    emailInput.addEventListener('input', function () {
        if (emailError.textContent) {
            emailError.textContent = '';
            emailInput.classList.remove('input-error');
        }
    });

    firstNameInput.addEventListener('input', function () {
        if (firstNameError.textContent) {
            firstNameError.textContent = '';
            firstNameInput.classList.remove('input-error');
        }
    });

    lastNameInput.addEventListener('input', function () {
        if (lastNameError.textContent) {
            lastNameError.textContent = '';
            lastNameInput.classList.remove('input-error');
        }
    });

    passwordInput.addEventListener('input', function () {
        if (passwordError.textContent) {
            passwordError.textContent = '';
            passwordInput.classList.remove('input-error');
        }
    });

    birthdateInput.addEventListener('change', function () {
        if (birthdateError.textContent) {
            birthdateError.textContent = '';
            birthdateInput.classList.remove('input-error');
        }
    });

    genderInput.addEventListener('change', function () {
        if (genderError.textContent) {
            genderError.textContent = '';
            genderInput.classList.remove('input-error');
        }
    });

    // === EXPORTAR FUNCIONES PARA USO EXTERNO ===
    window.adminModalValidator = {
        validateAll: validateAll,
        clearAllErrors: clearAllErrors,
        showCustomError: showCustomError,
        setEditMode: setEditMode
    };

})();
