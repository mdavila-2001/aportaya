document.addEventListener('DOMContentLoaded', () => {
    initializeStars();
    initializePasswordToggle();
    initializeFormValidation();
});

// ===================================
// GENERAR VALORES ALEATORIOS PARA ESTRELLAS
// ===================================
function initializeStars() {
    const stars = document.querySelectorAll('.star');
    
    const randomRange = (min, max) => {
        return Math.random() * (max - min) + min;
    };
    
    stars.forEach(star => {
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
    });
}

// ===================================
// TOGGLE DE VISIBILIDAD DE CONTRASEÑA
// ===================================
function initializePasswordToggle() {
    const toggleButtons = document.querySelectorAll('[data-toggle="password"]');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const wrapper = button.closest('.password-wrapper');
            const input = wrapper.querySelector('.password-input');
            const icon = button.querySelector('.material-symbols-outlined');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.textContent = 'visibility_off';
                button.setAttribute('aria-label', 'Ocultar contraseña');
            } else {
                input.type = 'password';
                icon.textContent = 'visibility';
                button.setAttribute('aria-label', 'Mostrar contraseña');
            }
        });
    });
}

// ===================================
// VALIDACIÓN BÁSICA DEL FORMULARIO
// ===================================
function initializeFormValidation() {
    const form = document.querySelector('.login-form');
    
    if (!form) return;
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        
        // Validación básica
        if (!email || !password) {
            showNotification('Por favor, completa todos los campos', 'error');
            return;
        }
        
        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showNotification('Por favor, ingresa un correo electrónico válido', 'error');
            return;
        }
        
        // Validar longitud mínima de contraseña
        if (password.length < 6) {
            showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }
        
        // Aquí iría la lógica de autenticación real
        // Por ahora solo mostramos mensaje de éxito
        showNotification('Iniciando sesión...', 'success');
        
        // Simular delay de login
        setTimeout(() => {
            console.log('Login attempt:', { email, password: '***' });
            // window.location.href = '../../index.html';
        }, 1500);
    });
}

// ===================================
// SISTEMA DE NOTIFICACIONES
// ===================================
function showNotification(message, type = 'info') {
    // Remover notificación existente si hay
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Crear notificación
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Estilos inline para la notificación
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '16px 24px',
        backgroundColor: type === 'error' ? '#dc2626' : type === 'success' ? '#00bc00' : '#0766ff',
        color: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        zIndex: '9999',
        fontSize: '14px',
        fontFamily: 'var(--font-base)',
        fontWeight: '500',
        maxWidth: '320px',
        animation: 'slideIn 0.3s ease-out',
        pointerEvents: 'auto'
    });
    
    document.body.appendChild(notification);
    
    // Auto-remover después de 4 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Agregar estilos de animación para notificaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
