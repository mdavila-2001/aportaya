/**
 * Script de validación para el modal de categorías
 * Maneja validaciones en tiempo real y mensajes de error
 */
(function () {
    'use strict';

    // === ELEMENTOS DEL DOM ===
    const form = document.getElementById('category-form');
    const nameInput = document.getElementById('category-name');
    const slugInput = document.getElementById('category-slug');
    const descriptionInput = document.getElementById('category-description');

    const nameError = document.getElementById('category_name_error_msg');
    const slugError = document.getElementById('category_slug_error_msg');
    const descriptionError = document.getElementById('category_description_error_msg');

    // === FUNCIONES DE VALIDACIÓN ===

    /**
     * Validar campo de nombre
     */
    function validateName() {
        const value = nameInput.value.trim();

        if (!value) {
            nameError.textContent = 'El nombre es requerido';
            nameInput.classList.add('input-error');
            return false;
        }

        if (value.length < 3) {
            nameError.textContent = 'El nombre debe tener al menos 3 caracteres';
            nameInput.classList.add('input-error');
            return false;
        }

        if (value.length > 100) {
            nameError.textContent = 'El nombre no puede exceder 100 caracteres';
            nameInput.classList.add('input-error');
            return false;
        }

        nameError.textContent = '';
        nameInput.classList.remove('input-error');
        return true;
    }

    /**
     * Validar campo de slug
     */
    function validateSlug() {
        const value = slugInput.value.trim();

        if (!value) {
            slugError.textContent = 'El slug es requerido';
            slugInput.classList.add('input-error');
            return false;
        }

        const slugPattern = /^[a-z0-9_-]+$/;
        if (!slugPattern.test(value)) {
            slugError.textContent = 'El slug solo puede contener letras minúsculas, números, guiones (-) y guiones bajos (_)';
            slugInput.classList.add('input-error');
            return false;
        }

        if (value.length < 2) {
            slugError.textContent = 'El slug debe tener al menos 2 caracteres';
            slugInput.classList.add('input-error');
            return false;
        }

        if (value.length > 100) {
            slugError.textContent = 'El slug no puede exceder 100 caracteres';
            slugInput.classList.add('input-error');
            return false;
        }

        slugError.textContent = '';
        slugInput.classList.remove('input-error');
        return true;
    }

    /**
     * Validar campo de descripción (opcional)
     */
    function validateDescription() {
        const value = descriptionInput.value.trim();

        if (value && value.length > 255) {
            descriptionError.textContent = 'La descripción no puede exceder 255 caracteres';
            descriptionInput.classList.add('input-error');
            return false;
        }

        descriptionError.textContent = '';
        descriptionInput.classList.remove('input-error');
        return true;
    }

    /**
     * Validar todo el formulario
     */
    function validateAll() {
        const isNameValid = validateName();
        const isSlugValid = validateSlug();
        const isDescValid = validateDescription();

        return isNameValid && isSlugValid && isDescValid;
    }

    /**
     * Limpiar todos los errores
     */
    function clearAllErrors() {
        nameError.textContent = '';
        slugError.textContent = '';
        descriptionError.textContent = '';

        nameInput.classList.remove('input-error');
        slugInput.classList.remove('input-error');
        descriptionInput.classList.remove('input-error');
    }

    /**
     * Mostrar error personalizado en un campo específico
     */
    function showCustomError(field, message) {
        const errorFields = {
            'name': { input: nameInput, error: nameError },
            'slug': { input: slugInput, error: slugError },
            'description': { input: descriptionInput, error: descriptionError }
        };

        if (errorFields[field]) {
            errorFields[field].error.textContent = message;
            errorFields[field].input.classList.add('input-error');
        }
    }

    /**
     * Auto-generar slug desde el nombre
     */
    function autoGenerateSlug() {
        const name = nameInput.value;
        const slug = name
            .toLowerCase()
            .replace(/[áàäâ]/g, 'a')
            .replace(/[éèëê]/g, 'e')
            .replace(/[íìïî]/g, 'i')
            .replace(/[óòöô]/g, 'o')
            .replace(/[úùüû]/g, 'u')
            .replace(/ñ/g, 'n')
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_|_$/g, '');

        return slug;
    }

    // === EVENT LISTENERS ===

    // Validar en blur (cuando el campo pierde el foco)
    nameInput.addEventListener('blur', validateName);
    slugInput.addEventListener('blur', validateSlug);
    descriptionInput.addEventListener('blur', validateDescription);

    // Limpiar errores cuando el usuario empieza a escribir
    nameInput.addEventListener('input', function () {
        if (nameError.textContent) {
            nameError.textContent = '';
            nameInput.classList.remove('input-error');
        }
    });

    slugInput.addEventListener('input', function () {
        if (slugError.textContent) {
            slugError.textContent = '';
            slugInput.classList.remove('input-error');
        }
    });

    descriptionInput.addEventListener('input', function () {
        if (descriptionError.textContent) {
            descriptionError.textContent = '';
            descriptionInput.classList.remove('input-error');
        }
    });

    // Auto-generar slug al escribir nombre (solo si el slug está vacío o no ha sido editado manualmente)
    let slugManuallyEdited = false;

    slugInput.addEventListener('focus', function () {
        slugManuallyEdited = true;
    });

    nameInput.addEventListener('input', function () {
        // Solo auto-generar si el usuario no ha tocado el slug
        if (!slugManuallyEdited || !slugInput.value) {
            const generatedSlug = autoGenerateSlug();
            slugInput.value = generatedSlug;
        }
    });

    // === EXPORTAR FUNCIONES PARA USO EXTERNO ===
    window.categoryModalValidator = {
        validateAll: validateAll,
        clearAllErrors: clearAllErrors,
        showCustomError: showCustomError,
        resetSlugGeneration: function () {
            slugManuallyEdited = false;
        }
    };

})();
