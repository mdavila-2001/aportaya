let coverImageUploader;
let proofDocumentUploader;
let currentStep = 1;
const totalSteps = 3;

const formData = {
    step1: {},
    step2: {},
    step3: {}
};

document.addEventListener('DOMContentLoaded', async () => {
    coverImageUploader = new ImageUploader('cover-image-input', '#cover-preview', {
        imageType: 'project'
    });

    proofDocumentUploader = new DocumentUploader('proof-document-input', '#proof-file-name', {
        documentType: 'proof'
    });

    await loadCategories();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('end-date').min = tomorrow.toISOString().split('T')[0];

    document.getElementById('btn-prev').addEventListener('click', prevStep);
    document.getElementById('btn-next').addEventListener('click', nextStep);
    document.getElementById('create-project-form').addEventListener('submit', handleSubmit);

    document.getElementById('cover-preview').addEventListener('click', () => {
        document.getElementById('cover-image-input').click();
    });

    document.getElementById('upload-doc-btn').addEventListener('click', () => {
        document.getElementById('proof-document-input').click();
    });

    ['title', 'financial-goal', 'category', 'location'].forEach(id => {
        document.getElementById(id).addEventListener('input', updateSummary);
        document.getElementById(id).addEventListener('change', updateSummary);
    });

    updateProgress();
});

async function loadCategories() {
    try {
        const response = await fetch('/api/projects/categories');
        const data = await response.json();

        if (data.success && data.categories) {
            const select = document.getElementById('category');
            data.categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.name;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

function validateStep(step) {
    return validateStepFields(step);
}

function nextStep() {
    if (!validateStep(currentStep)) {
        return;
    }

    saveStepData(currentStep);

    if (currentStep < totalSteps) {
        currentStep++;
        showStep(currentStep);
        updateProgress();
        updateNavButtons();

        window.scrollTo({ top: 0, behavior: 'smooth' });

        if (currentStep === 3) {
            updateSummary();
        }
    }
}

function prevStep() {
    if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
        updateProgress();
        updateNavButtons();

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function showStep(step) {
    document.querySelectorAll('.form-step').forEach(el => {
        el.classList.remove('active');
    });

    document.querySelector(`.form-step[data-step="${step}"]`).classList.add('active');

    document.querySelectorAll('.step-item').forEach((el, index) => {
        const stepNum = index + 1;
        el.classList.remove('active', 'completed');

        if (stepNum === step) {
            el.classList.add('active');
        } else if (stepNum < step) {
            el.classList.add('completed');
        }
    });
}

function updateProgress() {
    const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;
    document.getElementById('progress-fill').style.width = `${progress}%`;
}

function updateNavButtons() {
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const btnSubmit = document.getElementById('btn-submit');

    btnPrev.disabled = currentStep === 1;

    if (currentStep === totalSteps) {
        btnNext.style.display = 'none';
        btnSubmit.style.display = 'flex';
    } else {
        btnNext.style.display = 'flex';
        btnSubmit.style.display = 'none';
    }
}

function saveStepData(step) {
    const stepElement = document.querySelector(`.form-step[data-step="${step}"]`);
    const inputs = stepElement.querySelectorAll('input, select, textarea');

    inputs.forEach(input => {
        if (input.type === 'checkbox') {
            formData[`step${step}`][input.id] = input.checked;
        } else {
            formData[`step${step}`][input.id] = input.value;
        }
    });
}

function updateSummary() {
    document.getElementById('summary-title').textContent =
        document.getElementById('title').value || '-';

    const goal = document.getElementById('financial-goal').value;
    document.getElementById('summary-goal').textContent =
        goal ? `Bs. ${parseFloat(goal).toFixed(2)}` : '-';

    const categorySelect = document.getElementById('category');
    document.getElementById('summary-category').textContent =
        categorySelect.options[categorySelect.selectedIndex]?.text || '-';

    document.getElementById('summary-location').textContent =
        document.getElementById('location').value || '-';
}

async function handleSubmit(e) {
    e.preventDefault();

    if (!validateStep(currentStep)) {
        return;
    }

    const submitBtn = document.getElementById('btn-submit');
    const originalHTML = submitBtn.innerHTML;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Creando proyecto...';

    try {
        let coverImageId = null;
        if (coverImageUploader.hasFile()) {
            coverImageId = await coverImageUploader.upload();
            if (!coverImageId) {
                throw new Error('Error al subir la imagen de portada');
            }
        } else {
            throw new Error('La imagen de portada es obligatoria');
        }

        let proofDocumentId = null;
        if (proofDocumentUploader.hasFile()) {
            proofDocumentId = await proofDocumentUploader.upload();
        }

        const projectData = {
            title: document.getElementById('title').value.trim(),
            description: document.getElementById('description').value.trim(),
            financialGoal: parseFloat(document.getElementById('financial-goal').value),
            endDate: document.getElementById('end-date').value,
            categoryId: parseInt(document.getElementById('category').value),
            location: document.getElementById('location').value.trim(),
            videoUrl: document.getElementById('video-url').value.trim() || null,
            coverImageId: coverImageId,
            proofDocumentId: proofDocumentId
        };

        const token = localStorage.getItem('token');
        const response = await fetch('/api/projects', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(projectData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Error al crear el proyecto');
        }

        Notification.success('¡Proyecto creado exitosamente! Está siendo revisado por nuestro equipo.');

        setTimeout(() => {
            window.location.href = '/pages/user/projects/myProjects.html';
        }, 2500);

    } catch (error) {
        console.error('Error:', error);
        Notification.error(error.message || 'Error al crear el proyecto. Por favor intenta nuevamente.');

        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHTML;
    }
}
