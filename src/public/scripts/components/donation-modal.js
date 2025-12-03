document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('donation-modal');
    const closeBtn = document.getElementById('close-donation-modal');
    const donateBtns = document.querySelectorAll('.btn-donate');
    const amountInput = document.getElementById('donation-amount');
    const quickAmountBtns = document.querySelectorAll('.amount-btn');
    const confirmBtn = document.getElementById('confirm-donation');
    const modalProjectTitle = document.getElementById('modal-project-title');
    const pageProjectTitle = document.getElementById('project-title');

    let currentAmount = 100;

    // Inicialización
    if (pageProjectTitle) {
        modalProjectTitle.textContent = pageProjectTitle.textContent;
        // Observar cambios en el título (por si carga asíncronamente)
        const observer = new MutationObserver(() => {
            modalProjectTitle.textContent = pageProjectTitle.textContent;
        });
        observer.observe(pageProjectTitle, { childList: true, characterData: true, subtree: true });
    }

    // Event Listeners
    donateBtns.forEach(btn => {
        btn.addEventListener('click', openModal);
    });

    closeBtn.addEventListener('click', closeModal);

    // Cerrar al hacer click fuera
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Input de monto
    amountInput.addEventListener('input', (e) => {
        currentAmount = parseFloat(e.target.value) || 0;
    });

    // Botones rápidos
    quickAmountBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const amount = parseFloat(btn.dataset.amount);
            amountInput.value = amount;
            currentAmount = amount;

            // Animación visual
            btn.style.transform = 'scale(0.95)';
            setTimeout(() => btn.style.transform = 'scale(1)', 100);
        });
    });

    confirmBtn.addEventListener('click', processDonation);

    // Funciones
    function openModal() {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }

    async function processDonation() {
        if (currentAmount <= 0) {
            alert('Por favor ingresa un monto válido mayor a 0');
            return;
        }

        // Obtener slug del proyecto de la URL
        const urlParams = new URLSearchParams(window.location.search);
        const slug = urlParams.get('slug');

        if (!slug) {
            alert('Error: No se pudo identificar el proyecto');
            return;
        }

        try {
            confirmBtn.disabled = true;
            confirmBtn.textContent = 'Procesando...';

            const token = localStorage.getItem('token');
            if (!token) {
                alert('Debes iniciar sesión para donar');
                window.location.href = '/pages/auth/login.html';
                return;
            }

            const response = await fetch(`/api/gateway/projects/${slug}/donate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ amount: currentAmount })
            });

            const data = await response.json();

            if (data.success) {
                window.location.href = data.data.paymentUrl;
            } else {
                throw new Error(data.message || 'Error al procesar la donación');
            }

        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'Ocurrió un error al procesar tu solicitud');
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Continuar al Pago';
        }
    }
});
