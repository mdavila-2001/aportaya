class DocumentUploader {
    constructor(inputId, fileNameDisplayId, options = {}) {
        this.input = document.getElementById(inputId);

        if (typeof fileNameDisplayId === 'string') {
            this.fileNameDisplay = document.getElementById(fileNameDisplayId) || document.querySelector(fileNameDisplayId);
        } else {
            this.fileNameDisplay = fileNameDisplayId;
        }

        this.maxSize = options.maxSize || 10 * 1024 * 1024;
        this.endpoint = options.endpoint || '/api/document';
        this.documentType = options.documentType || 'general';
        this.allowedTypes = options.allowedTypes || ['.pdf', '.doc', '.docx'];

        this.init();
    }

    init() {
        if (!this.input) {
            console.error('Error! DocumentUploader: No se encuentra la entrada de archivo.');
            return;
        }

        this.input.addEventListener('change', (e) => this.handleFileSelect(e));
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        const fileExt = '.' + file.name.split('.').pop().toLowerCase();
        if (!this.allowedTypes.includes(fileExt)) {
            console.error(`Tipo de archivo no permitido. Permitidos: ${this.allowedTypes.join(', ')}`);
            this.input.value = '';
            return;
        }

        if (file.size > this.maxSize) {
            console.error(`El archivo excede el tamaño máximo permitido de ${this.maxSize / (1024 * 1024)} MB.`);
            this.input.value = '';
            return;
        }

        if (this.fileNameDisplay) {
            this.fileNameDisplay.textContent = file.name;
        }
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
            return null;
        }
    }

    hasFile() {
        return this.input.files && this.input.files.length > 0;
    }

    getFileName() {
        return this.input.files && this.input.files.length > 0 ? this.input.files[0].name : null;
    }

    clear() {
        this.input.value = '';
        if (this.fileNameDisplay) {
            this.fileNameDisplay.textContent = 'Ningún archivo seleccionado';
        }
    }
}
