(function () {
    'use strict';

    const loadingState = document.getElementById('loading-state');
    const emptyState = document.getElementById('empty-state');
    const donationsSummary = document.getElementById('donations-summary');
    const totalDonatedEl = document.getElementById('total-donated');
    const projectsCountEl = document.getElementById('projects-count');
    const donationsTableWrapper = document.getElementById('donations-table-wrapper');
    const donationsTbody = document.getElementById('donations-tbody');

    async function loadDonations() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '../auth/login.html';
                return;
            }

            const response = await fetch('/api/donations', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = '../auth/login.html';
                    return;
                }
                throw new Error('Error al cargar donaciones');
            }

            const result = await response.json();
            const donations = result.data.donations;

            renderDonations(donations);
        } catch (error) {
            console.error('Error:', error);
            loadingState.innerHTML = '<p class="error-message">Error al cargar tus aportes. Por favor intenta de nuevo.</p>';
        }
    }

    function renderDonations(donations) {
        loadingState.style.display = 'none';

        if (donations.length === 0) {
            emptyState.style.display = 'flex';
            return;
        }

        // Calcular resumen
        const totalDonated = donations.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
        const uniqueProjects = new Set(donations.map(d => d.project_id)).size;

        totalDonatedEl.textContent = `Bs. ${totalDonated.toFixed(2)}`;
        projectsCountEl.textContent = uniqueProjects;
        donationsSummary.style.display = 'flex';

        // Renderizar tabla
        donationsTbody.innerHTML = '';
        donations.forEach(donation => {
            const row = createDonationRow(donation);
            donationsTbody.appendChild(row);
        });

        donationsTableWrapper.style.display = 'block';
    }

    function createDonationRow(donation) {
        const tr = document.createElement('tr');

        // Fecha
        const date = new Date(donation.donation_date).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });

        // Estado
        const statusInfo = getStatusInfo(donation.payment_status);

        tr.innerHTML = `
            <td>${date}</td>
            <td>
                <a href="/project/${donation.project_slug || donation.project_id}" class="project-link">
                    ${donation.project_title || 'Proyecto'}
                </a>
            </td>
            <td class="donation-amount">Bs. ${parseFloat(donation.amount).toFixed(2)}</td>
            <td><span class="status-badge ${statusInfo.className}">${statusInfo.text}</span></td>
            <td>
                <a href="/project/${donation.project_slug || donation.project_id}" class="btn btn-sm btn-outline">
                    Ver Proyecto
                </a>
            </td>
        `;

        return tr;
    }

    function getStatusInfo(status) {
        const statusMap = {
            'success': { text: 'Completado', className: 'status-success' },
            'pending': { text: 'Pendiente', className: 'status-pending' },
            'failed': { text: 'Fallido', className: 'status-failed' }
        };

        return statusMap[status] || { text: status, className: 'status-default' };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadDonations);
    } else {
        loadDonations();
    }

})();
