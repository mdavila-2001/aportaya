class DocumentUploader {
    constructor(inputId, previewElementOrId, options = {}) {
        this.input = document.getElementById(inputId);

        if (typeof previewElementOrId === 'string') {
            this.preview = document.getElementById(previewElementOrId) || document.querySelector(previewElementOrId);
        } else {
            this.preview = previewElementOrId;
        }

        this.maxSize = options.maxSize || 10 * 1024 * 1024; 
        this.endpoint = options.endpoint || '/api/document';
        this.documentType = options.documentType || 'proof';
        
        this.init();
    }

    init() {
        if(!this.input) {
            console.error('¡Error! DocumentUploader: No se encuentra la entrada de archivo.');
            return;
        }

        this.input.addEventListener('change', (e) => this.handleFileSelect(e));
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        
        if (file.type !== 'application/pdf') {
            Notification.error('Por favor, selecciona un archivo PDF válido.');
            this.input.value = '';
            return;
        }

        if (file.size > this.maxSize) {
            Notification.error(`El archivo excede el tamaño máximo permitido de ${this.maxSize / (1024 * 1024)} MB.`);
            this.input.value = '';
            return;
        }

        
        if (this.preview) {
            if (this.preview.tagName === 'SPAN' || this.preview.tagName === 'DIV') {
                this.preview.textContent = file.name;
                this.preview.classList.add('file-selected');
            }
        }

        Notification.success(`Archivo "${file.name}" seleccionado correctamente.`);
    }

    async upload() {
        const file = this.input.files[0];
        if (!file) {
            return null;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('documentType', this.documentType);

        try {
            const response = await fetch(this.endpoint, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Error en la subida: ${response.statusText}`);
            }

            const data = await response.json();
            return data.documentId;
        } catch (error) {
            console.error('Error subiendo el documento:', error);
            Notification.error('Error subiendo el documento. Por favor, inténtalo de nuevo.');
            return null;
        }
    }

    hasFile() {
        return this.input.files && this.input.files.length > 0;
    }

    clear() {
        this.input.value = '';
        if (this.preview) {
            this.preview.textContent = 'Ningún archivo seleccionado';
            this.preview.classList.remove('file-selected');
        }
    }
}
