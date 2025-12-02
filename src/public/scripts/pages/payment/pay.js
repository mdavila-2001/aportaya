document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentId = urlParams.get('id');

    // UI Elements
    const loadingState = document.getElementById('loading-state');
    const paymentContent = document.getElementById('payment-content');
    const errorMessage = document.getElementById('error-message');

    // Payment Details
    const amountDisplay = document.getElementById('amount-display');
    const qrImage = document.getElementById('qr-image');

    // Project Details
    const projectTitle = document.getElementById('project-title');
    const projectImage = document.getElementById('project-image');

    // Status & Actions
    const statusContainer = document.getElementById('status-container');
    const statusText = document.getElementById('status-text');
    const btnSimulate = document.getElementById('btn-simulate');
    const btnReturn = document.getElementById('btn-return');

    if (!paymentId) {
        showError('No se especificó un ID de pago válido.');
        return;
    }

    try {
        // 1. Obtener detalles del pago
        const response = await fetch(`/api/gateway/payments/${paymentId}`);
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Error al obtener detalles del pago');
        }

        const payment = data.data;

        // 2. Actualizar UI
        amountDisplay.textContent = `Bs. ${payment.amount.toFixed(2)}`;

        // Actualizar info del proyecto
        if (payment.projectTitle) {
            projectTitle.textContent = payment.projectTitle;
        }
        if (payment.projectImage) {
            projectImage.src = payment.projectImage;
        } else {
            projectImage.src = '/images/placeholder-project.jpg'; // Fallback
        }

        // 3. Cargar QR
        qrImage.src = `/api/gateway/payments/${paymentId}/qr`;

        // 4. Verificar estado inicial
        updateStatusUI(payment.status);

        // Mostrar contenido
        loadingState.style.display = 'none';
        paymentContent.style.display = 'grid'; // Usar grid como en el CSS

        // 5. Configurar botón de simulación
        if (payment.status === 'PENDING') {
            btnSimulate.onclick = () => simulatePayment(paymentId);
        } else {
            btnSimulate.style.display = 'none';
        }

        // 6. Iniciar polling si está pendiente
        if (payment.status === 'PENDING') {
            startPolling(paymentId);
        }

    } catch (error) {
        console.error('Error:', error);
        showError('Error al cargar la información del pago. Por favor intenta nuevamente.');
    }

    // Función para simular pago
    async function simulatePayment(id) {
        try {
            btnSimulate.disabled = true;
            btnSimulate.innerHTML = '<span class="spinner" style="width: 20px; height: 20px; border-width: 2px; margin: 0;"></span> Procesando...';

            const response = await fetch(`/api/gateway/payments/${id}/confirm`, {
                method: 'POST'
            });
            const data = await response.json();

            if (data.success) {
                updateStatusUI('CONFIRMED');
                btnSimulate.style.display = 'none';
            } else {
                alert('Error al simular pago: ' + data.message);
                resetSimulateBtn();
            }
        } catch (error) {
            console.error('Error simulando pago:', error);
            alert('Error de conexión al simular pago');
            resetSimulateBtn();
        }
    }

    function resetSimulateBtn() {
        btnSimulate.disabled = false;
        btnSimulate.innerHTML = '<span class="material-symbols-outlined">bolt</span> Simular Pago Exitoso (Demo)';
    }

    // Función para actualizar UI según estado
    function updateStatusUI(status) {
        if (status === 'CONFIRMED') {
            statusContainer.classList.add('success');
            statusText.textContent = '¡Pago Exitoso!';

            // Actualizar subtexto
            const subtext = statusContainer.querySelector('.status-subtext');
            if (subtext) subtext.textContent = 'Gracias por tu aporte. Ya puedes volver al inicio.';

            // Mostrar botón de retorno
            btnReturn.style.display = 'flex';

            // Ocultar QR y simulación
            document.querySelector('.qr-wrapper').style.opacity = '0.5';
            document.querySelector('.qr-instruction').textContent = 'Pago completado.';

            // Detener polling si existe
            if (window.pollingInterval) {
                clearInterval(window.pollingInterval);
            }
        }
    }

    // Polling para verificar estado
    function startPolling(id) {
        window.pollingInterval = setInterval(async () => {
            try {
                const response = await fetch(`/api/gateway/payments/${id}`);
                const data = await response.json();

                if (data.success && data.data.status === 'CONFIRMED') {
                    updateStatusUI('CONFIRMED');
                }
            } catch (error) {
                console.error('Error en polling:', error);
            }
        }, 3000); // Verificar cada 3 segundos
    }

    function showError(message) {
        loadingState.style.display = 'none';
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }
});
