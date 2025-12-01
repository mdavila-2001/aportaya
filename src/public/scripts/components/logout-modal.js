document.addEventListener('DOMContentLoaded', () => {
    const confirmBtn = document.getElementById('confirm-logout');

    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            window.location.href = '../auth/login.html';
        });
    }
});
