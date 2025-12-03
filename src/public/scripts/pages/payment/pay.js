document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentId = urlParams.get('id');

    const loadingState = document.getElementById('loading-state');
    const paymentContent = document.getElementById('payment-content');
    const errorMessage = document.getElementById('error-message');

    const amountDisplay = document.getElementById('amount-display');
    const qrImage = document.getElementById('qr-image');

    const projectTitle = document.getElementById('project-title');
    const projectImage = document.getElementById('project-image');

    const statusContainer = document.getElementById('status-container');
    const statusText = document.getElementById('status-text');
    const btnSimulate = document.getElementById('btn-simulate');
    const btnReturn = document.getElementById('btn-return');

    if (!paymentId) {
        showError('No se especificó un ID de pago válido.');
        return;
    }

    try {
        const response = await fetch(`/api/gateway/payments/${paymentId}`);
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Error al obtener detalles del pago');
        }

        const payment = data.data;

        amountDisplay.textContent = `Bs. ${payment.amount.toFixed(2)}`;

        if (payment.projectTitle) {
            projectTitle.textContent = payment.projectTitle;
        }
        if (payment.projectImage) {
            projectImage.src = payment.projectImage;
        } else {
            projectImage.src = '/images/placeholder-project.jpg';
        }

        qrImage.src = `/api/gateway/payments/${paymentId}/qr`;

        updateStatusUI(payment.status);

        loadingState.style.display = 'none';
        paymentContent.style.display = 'grid';

        if (payment.status === 'PENDING') {
            btnSimulate.onclick = () => simulatePayment(paymentId);
        } else {
            btnSimulate.style.display = 'none';
        }

        if (payment.status === 'PENDING') {
            startPolling(paymentId);
        }

    } catch (error) {
        console.error('Error:', error);
        showError('Error al cargar la información del pago. Por favor intenta nuevamente.');
    }

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

    function updateStatusUI(status) {
        if (status === 'CONFIRMED') {
            statusContainer.classList.add('success');
            statusText.textContent = '¡Pago Exitoso!';
            const subtext = statusContainer.querySelector('.status-subtext');
            if (subtext) subtext.textContent = 'Gracias por tu aporte. Ya puedes volver al inicio.';

            btnReturn.style.display = 'flex';

            document.querySelector('.qr-wrapper').style.opacity = '0.5';
            document.querySelector('.qr-instruction').textContent = 'Pago completado.';
            if (window.pollingInterval) {
                clearInterval(window.pollingInterval);
            }
        }
    }

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
