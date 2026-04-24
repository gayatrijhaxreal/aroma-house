document.addEventListener('DOMContentLoaded', () => {
    const authPanel = document.getElementById('auth-panel');
    const dashboardPanel = document.getElementById('dashboard-panel');
    const authForm = document.getElementById('admin-login-form');
    const adminTokenInput = document.getElementById('admin-token');
    const authMessage = document.getElementById('auth-message');
    const dashboardMessage = document.getElementById('dashboard-message');
    const inquiriesBody = document.getElementById('inquiries-body');
    const emptyState = document.getElementById('empty-state');
    const totalCount = document.getElementById('total-count');
    const latestDate = document.getElementById('latest-date');
    const searchInput = document.getElementById('search-input');
    const refreshBtn = document.getElementById('refresh-btn');
    const exportBtn = document.getElementById('export-btn');
    const logoutBtn = document.getElementById('logout-btn');

    let inquiries = [];
    const storageKey = 'aroma-admin-token';
    const savedToken = localStorage.getItem(storageKey) || '';

    if (savedToken) {
        adminTokenInput.value = savedToken;
        openDashboard(savedToken);
    }

    authForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const token = adminTokenInput.value.trim();

        if (!token) {
            setAuthMessage('Enter an admin token.', 'error');
            return;
        }

        localStorage.setItem(storageKey, token);
        openDashboard(token);
    });

    refreshBtn.addEventListener('click', () => {
        const token = localStorage.getItem(storageKey) || '';
        if (token) {
            openDashboard(token);
        }
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem(storageKey);
        authForm.reset();
        inquiries = [];
        renderInquiries([]);
        dashboardPanel.classList.add('hidden');
        authPanel.classList.remove('hidden');
        setDashboardMessage('');
    });

    searchInput.addEventListener('input', () => {
        renderInquiries(filterInquiries(searchInput.value));
    });

    exportBtn.addEventListener('click', () => {
        const rows = filterInquiries(searchInput.value);
        if (!rows.length) {
            setDashboardMessage('Nothing to export yet.', 'error');
            return;
        }

        const csv = [
            ['Name', 'Phone', 'Message', 'Created At'],
            ...rows.map((entry) => [entry.name, entry.phone, entry.message, entry.createdAt])
        ].map((row) => row.map(escapeCsv).join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `aroma-house-inquiries-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        setDashboardMessage('CSV export ready.');
    });

    async function openDashboard(token) {
        try {
            setAuthMessage('Loading dashboard...', '');
            const response = await fetch('/api/admin/inquiries', {
                headers: {
                    'x-admin-token': token
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Unable to load inquiries');
            }

            inquiries = Array.isArray(data.inquiries) ? data.inquiries : [];
            authPanel.classList.add('hidden');
            dashboardPanel.classList.remove('hidden');
            setAuthMessage('', '');
            setDashboardMessage(`Loaded ${inquiries.length} submission${inquiries.length === 1 ? '' : 's'}.`);
            updateStats(inquiries);
            renderInquiries(filterInquiries(searchInput.value));
        } catch (error) {
            dashboardPanel.classList.add('hidden');
            authPanel.classList.remove('hidden');
            setAuthMessage(error.message || 'Could not open dashboard.', 'error');
        }
    }

    function filterInquiries(query) {
        const normalized = query.trim().toLowerCase();
        if (!normalized) {
            return inquiries;
        }

        return inquiries.filter((entry) => {
            return [entry.name, entry.phone, entry.message, entry.createdAt]
                .some((value) => String(value || '').toLowerCase().includes(normalized));
        });
    }

    function renderInquiries(rows) {
        inquiriesBody.innerHTML = rows.map((entry) => {
            return `
                <tr>
                    <td>${escapeHtml(entry.name)}</td>
                    <td><a href="tel:${escapeHtml(entry.phone)}">${escapeHtml(entry.phone)}</a></td>
                    <td>${escapeHtml(entry.message)}</td>
                    <td>${formatDate(entry.createdAt)}</td>
                </tr>
            `;
        }).join('');

        emptyState.classList.toggle('hidden', rows.length > 0);
    }

    function updateStats(rows) {
        totalCount.textContent = String(rows.length);
        latestDate.textContent = rows[0]?.createdAt ? formatDate(rows[0].createdAt) : '-';
    }

    function formatDate(value) {
        if (!value) {
            return '-';
        }

        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
    }

    function setAuthMessage(text, type) {
        authMessage.textContent = text;
        authMessage.className = `message ${type}`.trim();
    }

    function setDashboardMessage(text, type) {
        dashboardMessage.textContent = text;
        dashboardMessage.className = `message ${type}`.trim();
    }

    function escapeHtml(value) {
        return String(value || '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function escapeCsv(value) {
        const text = String(value || '');
        if (/[",\n]/.test(text)) {
            return `"${text.replaceAll('"', '""')}"`;
        }
        return text;
    }
});
