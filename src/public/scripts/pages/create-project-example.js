// Ejemplo de integración en createProject.js

let coverImageUploader;
let proofDocumentUploader;

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar el uploader de imagen de portada
    coverImageUploader = new ImageUploader('cover-image-input', '#cover-preview', {
        imageType: 'project'
    });

    // Inicializar el uploader de documento de prueba
    proofDocumentUploader = new DocumentUploader('proof-document-input', '#proof-file-name', {
        documentType: 'proof'
    });

    // Manejar el submit del formulario
    const form = document.getElementById('create-project-form');
    form.addEventListener('submit', handleCreateProject);
});

async function handleCreateProject(e) {
    e.preventDefault();

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creando proyecto...';

    try {
        // 1. Subir imagen de portada si existe
        let coverImageId = null;
        if (coverImageUploader.hasFile()) {
            coverImageId = await coverImageUploader.upload();
            if (!coverImageId) {
                throw new Error('Error al subir la imagen de portada');
            }
        }

        // 2. Subir documento de prueba si existe
        let proofDocumentId = null;
        if (proofDocumentUploader.hasFile()) {
            proofDocumentId = await proofDocumentUploader.upload();
            if (!proofDocumentId) {
                throw new Error('Error al subir el documento de prueba');
            }
        }

        // 3. Preparar datos del proyecto
        const projectData = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            financialGoal: parseFloat(document.getElementById('financial-goal').value),
            endDate: document.getElementById('end-date').value,
            categoryId: parseInt(document.getElementById('category').value),
            location: document.getElementById('location').value,
            videoUrl: document.getElementById('video-url').value || null,
            coverImageId: coverImageId,
            proofDocumentId: proofDocumentId
        };

        // 4. Enviar al backend
        const token = localStorage.getItem('auth_token');
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

        Notification.success('¡Proyecto creado exitosamente!');
        
        // Redirigir al detalle del proyecto o a mis proyectos
        setTimeout(() => {
            window.location.href = `/pages/projects/details.html?id=${result.projectId}`;
        }, 2000);

    } catch (error) {
        console.error('Error:', error);
        Notification.error(error.message || 'Error al crear el proyecto');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}
