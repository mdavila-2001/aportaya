// Validation functions following login/signup pattern

function clearErrorMessages() {
    document.querySelectorAll('.error_msg').forEach(el => el.textContent = '');
}

function validateTitle() {
    const title = document.getElementById('title').value.trim();
    const errorEl = document.getElementById('title_error_msg');

    if (!title) {
        errorEl.textContent = 'El título es obligatorio.';
        return false;
    }

    if (title.length < 5) {
        errorEl.textContent = 'El título debe tener al menos 5 caracteres.';
        return false;
    }

    errorEl.textContent = '';
    return true;
}

function validateFinancialGoal() {
    const goal = document.getElementById('financial-goal').value;
    const errorEl = document.getElementById('financial_goal_error_msg');

    if (!goal) {
        errorEl.textContent = 'La meta financiera es obligatoria.';
        return false;
    }

    const goalNum = parseFloat(goal);
    if (goalNum < 100) {
        errorEl.textContent = 'La meta debe ser al menos Bs. 100.';
        return false;
    }

    errorEl.textContent = '';
    return true;
}

function validateCategory() {
    const category = document.getElementById('category').value;
    const errorEl = document.getElementById('category_error_msg');

    if (!category) {
        errorEl.textContent = 'Debes seleccionar una categoría.';
        return false;
    }

    errorEl.textContent = '';
    return true;
}

function validateLocation() {
    const location = document.getElementById('location').value.trim();
    const errorEl = document.getElementById('location_error_msg');

    if (!location) {
        errorEl.textContent = 'La ubicación es obligatoria.';
        return false;
    }

    errorEl.textContent = '';
    return true;
}

function validateDescription() {
    const description = document.getElementById('description').value.trim();
    const errorEl = document.getElementById('description_error_msg');

    if (!description) {
        errorEl.textContent = 'La descripción es obligatoria.';
        return false;
    }

    if (description.length < 50) {
        errorEl.textContent = 'La descripción debe tener al menos 50 caracteres.';
        return false;
    }

    errorEl.textContent = '';
    return true;
}

function validateCoverImage() {
    const errorEl = document.getElementById('cover_image_error_msg');

    if (!coverImageUploader.hasFile()) {
        errorEl.textContent = 'La imagen de portada es obligatoria.';
        return false;
    }

    errorEl.textContent = '';
    return true;
}

function validateEndDate() {
    const endDate = document.getElementById('end-date').value;
    const errorEl = document.getElementById('end_date_error_msg');

    if (!endDate) {
        errorEl.textContent = 'La fecha de finalización es obligatoria.';
        return false;
    }

    const selectedDate = new Date(endDate);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    if (selectedDate < tomorrow) {
        errorEl.textContent = 'La fecha debe ser futura.';
        return false;
    }

    errorEl.textContent = '';
    return true;
}

function validateTerms() {
    const terms = document.getElementById('terms').checked;
    const errorEl = document.getElementById('terms_error_msg');

    if (!terms) {
        errorEl.textContent = 'Debes aceptar los términos y condiciones.';
        return false;
    }

    errorEl.textContent = '';
    return true;
}

// Updated validateStep function
function validateStepFields(step) {
    clearErrorMessages();
    let isValid = true;

    if (step === 1) {
        isValid = validateTitle() && isValid;
        isValid = validateFinancialGoal() && isValid;
        isValid = validateCategory() && isValid;
        isValid = validateLocation() && isValid;
    }

    if (step === 2) {
        isValid = validateDescription() && isValid;
        isValid = validateCoverImage() && isValid;
    }

    if (step === 3) {
        isValid = validateEndDate() && isValid;
        isValid = validateTerms() && isValid;
    }

    return isValid;
}
