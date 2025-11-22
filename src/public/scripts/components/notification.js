class Notification {
    static show(message, type = 'info', duration = 4000, link = null) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icon = this.getIcon(type);
        
        let messageContent = message;
        if (link) {
            messageContent = `${message} <a href="${link.url}" target="_blank" class="notification-link">${link.text || 'Ver aquí'}</a>`;
        }
        
        notification.innerHTML = `
            <span class="notification-icon material-symbols-outlined">${icon}</span>
            <span class="notification-message">${messageContent}</span>
            <button class="notification-close" aria-label="Cerrar">
                <span class="material-symbols-outlined">close</span>
            </button>
        `;
        
        let container = document.querySelector('.notification-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
        
        container.appendChild(notification);
        
        // Animación de entrada
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Botón de cerrar
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => this.hide(notification));
        
        // Auto-cerrar
        if (duration > 0) {
            setTimeout(() => this.hide(notification), duration);
        }
        
        return notification;
    }
    
    static hide(notification) {
        notification.classList.remove('show');
        notification.classList.add('hide');
        
        setTimeout(() => {
            notification.remove();
            
            // Limpiar contenedor si está vacío
            const container = document.querySelector('.notification-container');
            if (container && container.children.length === 0) {
                container.remove();
            }
        }, 300);
    }
    
    static getIcon(type) {
        const icons = {
            'success': 'check_circle',
            'error': 'error',
            'warning': 'warning',
            'info': 'info'
        };
        return icons[type] || icons.info;
    }
    
    // Métodos helper
    static success(message, duration, link) {
        return this.show(message, 'success', duration, link);
    }
    
    static error(message, duration, link) {
        return this.show(message, 'error', duration, link);
    }
    
    static warning(message, duration, link) {
        return this.show(message, 'warning', duration, link);
    }
    
    static info(message, duration, link) {
        return this.show(message, 'info', duration, link);
    }
}
