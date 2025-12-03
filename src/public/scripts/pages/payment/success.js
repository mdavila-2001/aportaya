document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentId = urlParams.get('id');

    const loadingState = document.getElementById('loading-state');
    const errorState = document.getElementById('error-state');
    const successState = document.getElementById('success-state');
    const errorMessage = document.getElementById('error-message');

    const donationAmount = document.getElementById('donation-amount');
    const projectName = document.getElementById('project-name');
    const paymentDate = document.getElementById('payment-date');
    const transactionId = document.getElementById('transaction-id');

    const projectCard = document.getElementById('project-card');
    const projectImage = document.getElementById('project-image');
    const projectTitleCard = document.getElementById('project-title-card');
    const viewProjectBtn = document.getElementById('view-project-btn');

    if (!paymentId) {
        showError('No se especificó un ID de pago válido.');
        return;
    }

    try {
        const paymentResponse = await fetch(`/api/gateway/payments/${paymentId}`);
        const paymentData = await paymentResponse.json();

        if (!paymentData.success) {
            throw new Error(paymentData.message || 'Error al obtener detalles del pago');
        }

        const payment = paymentData.data;

        const confirmResponse = await fetch(`/api/gateway/payments/${paymentId}/confirm`, {
            method: 'POST'
        });
        const confirmData = await confirmResponse.json();

        if (!confirmData.success) {
            if (payment.status !== 'CONFIRMED') {
                throw new Error(confirmData.message || 'Error al confirmar el pago');
            }
        }

        showSuccess(payment, paymentId);

    } catch (error) {
        console.error('Error:', error);
        showError(error.message || 'Error al procesar tu pago. Por favor contacta con soporte.');
    }

    function showSuccess(payment, id) {
        loadingState.style.display = 'none';
        successState.style.display = 'block';

        donationAmount.textContent = `Bs. ${parseFloat(payment.amount).toFixed(2)}`;

        if (payment.projectTitle) {
            projectName.textContent = payment.projectTitle;
            projectTitleCard.textContent = payment.projectTitle;
        }

        const now = new Date();
        paymentDate.textContent = now.toLocaleDateString('es-BO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        transactionId.textContent = id.substring(0, 8).toUpperCase();

        if (payment.projectImage) {
            projectImage.src = payment.projectImage;
            projectCard.style.display = 'flex';
        }

        viewProjectBtn.href = '/';

        setupShareButtons(payment);
    }

    function showError(message) {
        loadingState.style.display = 'none';
        errorState.style.display = 'flex';
        errorMessage.textContent = message;
    }

    function setupShareButtons(payment) {
        const shareWhatsapp = document.getElementById('share-whatsapp');
        const shareFacebook = document.getElementById('share-facebook');
        const shareTwitter = document.getElementById('share-twitter');

        const shareText = `¡Acabo de apoyar "${payment.projectTitle || 'un proyecto'}" en AportaYa! 🎉`;
        const shareUrl = window.location.origin;

        if (shareWhatsapp) {
            shareWhatsapp.addEventListener('click', () => {
                const url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
                window.open(url, '_blank');
            });
        }

        if (shareFacebook) {
            shareFacebook.addEventListener('click', () => {
                const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
                window.open(url, '_blank');
            });
        }

        if (shareTwitter) {
            shareTwitter.addEventListener('click', () => {
                const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
                window.open(url, '_blank');
            });
        }
    }
});