class ImageUploader {
    constructor(inputId, previewElementOrId, options = {}) {
        this.input = document.getElementById(inputId);

        if (typeof previewElementOrId === 'string') {
            this.preview = document.getElementById(previewElementOrId) || document.querySelector(previewElementOrId);
        } else {
            this.preview = previewElementOrId;
        }

        this.maxSize = options.maxSize || 5 * 1024 * 1024;
        this.endpoint = options.endpoint || '/api/image';
        this.imageType = options.imageType || 'general';
        
        this.init();
    }

    init () {
        if(!this.input) {
            console.error('¡Error! ImageUploader: No se encuentra la entrada de archivo.');
            return;
        }

        this.input.addEventListener('change', (e) => this.handleFileSelect(e));
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            Notification.error('Por favor, selecciona un archivo de imagen válido.');
            this.input.value = '';
            return;
        }

        if (file.size > this.maxSize) {
            Notification.error(`El archivo excede el tamaño máximo permitido de ${this.maxSize / (1024 * 1024)} MB.`);
            this.input.value = '';
            return;
        }

        if (this.preview) {
            const url = URL.createObjectURL(file);

            if (this.preview.tagName === 'DIV' || this.preview.tagName === 'LABEL') {
                this.preview.style.backgroundImage = `url(${url})`;
                this.preview.style.backgroundSize = 'cover';
                this.preview.style.backgroundPosition = 'center';
            }

            else if (this.preview.tagName === 'IMG') {
                this.preview.src = url;
            }
        }
    }

    async upload() {
        const file = this.input.files[0];
        if (!file) {
            return null;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('imageType', this.imageType);

        try {
            const response = await fetch(this.endpoint, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Error en la subida: ${response.statusText}`);
            }

            const data = await response.json();
            return data.imageId;
        } catch (error) {
            console.error('Error subiendo la imagen:', error);
            Notification.error('Error subiendo la imagen. Por favor, inténtalo de nuevo.');
            return null;
        }
    }

    hasFile() {
        return this.input.files && this.input.files.length > 0;
    }
}