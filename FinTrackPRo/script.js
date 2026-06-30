const CURRENCY_SYMBOLS = {
    rupee: '₹',
    dollar: '$',
    euro: '€',
    pound: '£',
    yen: '¥',
    won: '₩',
    franc: '₣',
    aud: 'A$',
    cad: 'C$',
    aed: 'د.إ'
};
let currentUser = null;
let transactions = [];
let financeChart = null;
let editingId = null;
function getCurrencySymbol() {
    if (!currentUser) return '₹';
    return CURRENCY_SYMBOLS[currentUser.currency] || '₹';
}
function formatAmount(amount) {
    return getCurrencySymbol() + parseFloat(amount).toFixed(2);
}
function saveUserData() {
    if (!currentUser) return;
    const users = JSON.parse(localStorage.getItem('fintrack_users')) || [];
    const index = users.findIndex(u => u.email === currentUser.email);
    if (index !== -1) {
        users[index] = currentUser;
        localStorage.setItem('fintrack_users', JSON.stringify(users));
    }
    localStorage.setItem('fintrack_current_user', currentUser.email);
}
function saveTransactions() {
    if (!currentUser) return;
    localStorage.setItem(`fintrack_transactions_${currentUser.email}`, JSON.stringify(transactions));
}
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
function showToast(message, type) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const iconMap = { success: 'ri-checkbox-circle-fill', error: 'ri-error-warning-fill', info: 'ri-information-fill' };
    toast.innerHTML = `<i class="${iconMap[type] || iconMap.info}"></i><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
}
const tabLogin = document.getElementById('tab-login');
const tabSignup = document.getElementById('tab-signup');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const loginError = document.getElementById('login-error');
const signupError = document.getElementById('signup-error');
const authScreen = document.getElementById('auth-screen');
const appShell = document.getElementById('app-shell');
tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('active');
    tabSignup.classList.remove('active');
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
    loginError.classList.add('hidden');
    signupError.classList.add('hidden');
});
tabSignup.addEventListener('click', () => {
    tabSignup.classList.add('active');
    tabLogin.classList.remove('active');
    signupForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    loginError.classList.add('hidden');
    signupError.classList.add('hidden');
});
signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim().toLowerCase();
    const password = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-confirm').value;
    signupError.classList.add('hidden');
    if (password !== confirm) {
        signupError.textContent = 'Passwords do not match.';
        signupError.classList.remove('hidden');
        return;
    }
    const users = JSON.parse(localStorage.getItem('fintrack_users')) || [];
    if (users.some(u => u.email === email)) {
        signupError.textContent = 'User already exists.';
        signupError.classList.remove('hidden');
        return;
    }
    const newUser = {
        name,
        email,
        password,
        theme: 'light',
        currency: 'rupee'
    };
    users.push(newUser);
    localStorage.setItem('fintrack_users', JSON.stringify(users));
    currentUser = newUser;
    saveUserData();
    signupForm.reset();
    initAppSession();
    showToast('Registration successful!', 'success');
});
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;
    loginError.classList.add('hidden');
    const users = JSON.parse(localStorage.getItem('fintrack_users')) || [];
    const user = users.find(u => u.email === email);
    if (!user) {
        loginError.textContent = 'User does not exist. Please Sign Up.';
        loginError.classList.remove('hidden');
        return;
    }
    if (user.password !== password) {
        loginError.textContent = 'Incorrect Password.';
        loginError.classList.remove('hidden');
        return;
    }
    currentUser = user;
    saveUserData();
    loginForm.reset();
    initAppSession();
    showToast('Logged in successfully!', 'success');
});
const btnLogout = document.getElementById('btn-logout');
btnLogout.addEventListener('click', () => {
    currentUser = null;
    localStorage.removeItem('fintrack_current_user');
    authScreen.classList.remove('hidden');
    appShell.classList.add('hidden');
    if (financeChart) {
        financeChart.destroy();
        financeChart = null;
    }
    showToast('Logged out successfully.', 'info');
});
const btnNavDashboard = document.getElementById('btn-nav-dashboard');
const btnNavSettings = document.getElementById('btn-nav-settings');
const pageDashboard = document.getElementById('page-dashboard');
const pageSettings = document.getElementById('page-settings');
const topbarTitle = document.getElementById('topbar-title');
function showPage(page) {
    if (page === 'dashboard') {
        pageDashboard.classList.remove('hidden');
        pageSettings.classList.add('hidden');
        btnNavDashboard.classList.add('active');
        btnNavSettings.classList.remove('active');
        topbarTitle.textContent = 'Dashboard';
    } else {
        pageDashboard.classList.add('hidden');
        pageSettings.classList.remove('hidden');
        btnNavDashboard.classList.remove('active');
        btnNavSettings.classList.add('active');
        topbarTitle.textContent = 'Settings';
    }
}
btnNavDashboard.addEventListener('click', () => showPage('dashboard'));
btnNavSettings.addEventListener('click', () => showPage('settings'));
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');
sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
});
document.addEventListener('click', (e) => {
    if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== sidebarToggle) {
        sidebar.classList.remove('open');
    }
});
function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
        document.getElementById('theme-icon').className = 'ri-moon-line';
    } else {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
        document.getElementById('theme-icon').className = 'ri-sun-line';
    }
    updateChart();
}
function toggleTheme() {
    if (!currentUser) return;
    currentUser.theme = currentUser.theme === 'light' ? 'dark' : 'light';
    saveUserData();
    applyTheme(currentUser.theme);
}
document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
function setGreeting() {
    const hour = new Date().getHours();
    let greeting = 'Good Morning';
    if (hour >= 12 && hour < 17) greeting = 'Good Afternoon';
    else if (hour >= 17) greeting = 'Good Evening';
    const name = currentUser ? currentUser.name.split(' ')[0] : 'User';
    document.getElementById('hero-greeting').textContent = `${greeting}, ${name} 👋`;
}
function setDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('hero-date').textContent = now.toLocaleDateString('en-IN', options);
}
function updateAvatarDisplay() {
    if (!currentUser) return;
    const initials = currentUser.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    document.getElementById('avatar-initials').textContent = initials;
    setGreeting();
}
function calculateStats() {
    let income = 0;
    let expense = 0;
    transactions.forEach(t => {
        if (t.type === 'income') income += parseFloat(t.amount);
        else expense += parseFloat(t.amount);
    });
    const balance = income - expense;
    const sym = getCurrencySymbol();
    document.getElementById('stat-balance').textContent = sym + balance.toFixed(2);
    document.getElementById('stat-income').textContent = sym + income.toFixed(2);
    document.getElementById('stat-expense').textContent = sym + expense.toFixed(2);
    document.getElementById('stat-count').textContent = transactions.length;
    return { income, expense, balance };
}
function getChartColors() {
    const isDark = currentUser && currentUser.theme === 'dark';
    return {
        gridColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        tickColor: isDark ? '#8892a4' : '#6b7280',
        tooltipBg: isDark ? '#1a1e2e' : '#ffffff',
        tooltipText: isDark ? '#e8eaf0' : '#1a1d2e'
    };
}
function buildChartData() {
    const monthlyData = {};
    transactions.forEach(t => {
        const date = new Date(t.date);
        const key = date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
        if (!monthlyData[key]) monthlyData[key] = { income: 0, expense: 0 };
        if (t.type === 'income') monthlyData[key].income += parseFloat(t.amount);
        else monthlyData[key].expense += parseFloat(t.amount);
    });
    const labels = Object.keys(monthlyData).slice(-7);
    const incomeData = labels.map(k => monthlyData[k].income);
    const expenseData = labels.map(k => monthlyData[k].expense);
    return { labels, incomeData, expenseData };
}
function updateChart() {
    const canvas = document.getElementById('finance-chart');
    if (!canvas) return;
    const colors = getChartColors();
    const { labels, incomeData, expenseData } = buildChartData();
    const displayLabels = labels.length ? labels : ['No Data'];
    const displayIncome = incomeData.length ? incomeData : [0];
    const displayExpense = expenseData.length ? expenseData : [0];
    if (financeChart) {
        financeChart.data.labels = displayLabels;
        financeChart.data.datasets[0].data = displayIncome;
        financeChart.data.datasets[1].data = displayExpense;
        financeChart.options.scales.x.ticks.color = colors.tickColor;
        financeChart.options.scales.y.ticks.color = colors.tickColor;
        financeChart.options.scales.x.grid.color = colors.gridColor;
        financeChart.options.scales.y.grid.color = colors.gridColor;
        financeChart.update();
        return;
    }
    financeChart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: displayLabels,
            datasets: [
                {
                    label: 'Income',
                    data: displayIncome,
                    backgroundColor: 'rgba(16, 185, 129, 0.75)',
                    borderColor: '#10b981',
                    borderWidth: 1.5,
                    borderRadius: 5,
                    borderSkipped: false
                },
                {
                    label: 'Expense',
                    data: displayExpense,
                    backgroundColor: 'rgba(239, 68, 68, 0.75)',
                    borderColor: '#ef4444',
                    borderWidth: 1.5,
                    borderRadius: 5,
                    borderSkipped: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    align: 'end',
                    labels: {
                        boxWidth: 10,
                        boxHeight: 10,
                        borderRadius: 3,
                        useBorderRadius: true,
                        font: { family: 'Inter', size: 12 },
                        color: colors.tickColor,
                        padding: 16
                    }
                },
                tooltip: {
                    backgroundColor: colors.tooltipBg,
                    titleColor: colors.tooltipText,
                    bodyColor: colors.tooltipText,
                    borderColor: 'rgba(99,102,241,0.3)',
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        label: (ctx) => ` ${getCurrencySymbol()}${ctx.parsed.y.toFixed(2)}`
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: colors.gridColor, drawTicks: false },
                    ticks: { color: colors.tickColor, font: { family: 'Inter', size: 11 }, padding: 6 },
                    border: { display: false }
                },
                y: {
                    grid: { color: colors.gridColor, drawTicks: false },
                    ticks: { color: colors.tickColor, font: { family: 'Inter', size: 11 }, padding: 8, callback: (v) => getCurrencySymbol() + v },
                    border: { display: false }
                }
            }
        }
    });
}
function formatTableDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function renderTable(list) {
    const tbody = document.getElementById('txn-table-body');
    const emptyState = document.getElementById('empty-state');
    tbody.innerHTML = '';
    if (!list.length) {
        emptyState.classList.add('visible');
        return;
    }
    emptyState.classList.remove('visible');
    const sorted = [...list].sort((a, b) => new Date(b.date) - new Date(a.date));
    sorted.forEach(txn => {
        const tr = document.createElement('tr');
        const sign = txn.type === 'income' ? '+' : '-';
        tr.innerHTML = `
            <td class="txn-date">${formatTableDate(txn.date)}</td>
            <td class="txn-title">${txn.title}</td>
            <td><span class="txn-badge">${txn.category}</span></td>
            <td class="txn-amount ${txn.type}">${sign}${formatAmount(txn.amount)}</td>
            <td class="txn-actions">
                <button class="btn-action btn-edit" data-id="${txn.id}" title="Edit"><i class="ri-edit-line"></i></button>
                <button class="btn-action btn-delete" data-id="${txn.id}" title="Delete"><i class="ri-delete-bin-line"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}
function refreshDashboard() {
    calculateStats();
    updateChart();
    applyFilter();
}
const transactionForm = document.getElementById('transaction-form');
transactionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('txn-title').value.trim();
    const amount = parseFloat(document.getElementById('txn-amount').value);
    const category = document.getElementById('txn-category').value;
    const type = document.querySelector('input[name="txn-type"]:checked').value;
    if (!title || !amount || amount <= 0) return;
    const txn = {
        id: generateId(),
        title,
        amount,
        category,
        type,
        date: new Date().toISOString()
    };
    transactions.push(txn);
    saveTransactions();
    transactionForm.reset();
    document.getElementById('type-income').checked = true;
    refreshDashboard();
    showToast('Transaction added successfully!', 'success');
});
const btnOpenModal = document.getElementById('btn-open-modal');
const modalOverlay = document.getElementById('modal-overlay');
const modalClose = document.getElementById('modal-close');
btnOpenModal.addEventListener('click', () => {
    modalOverlay.classList.remove('hidden');
});
modalClose.addEventListener('click', () => {
    modalOverlay.classList.add('hidden');
    editingId = null;
});
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
        modalOverlay.classList.add('hidden');
        editingId = null;
    }
});
const editForm = document.getElementById('edit-form');
editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('edit-title').value.trim();
    const amount = parseFloat(document.getElementById('edit-amount').value);
    const category = document.getElementById('edit-category').value;
    const type = document.querySelector('input[name="edit-txn-type"]:checked').value;
    if (!title || !amount || amount <= 0) return;
    const index = transactions.findIndex(t => t.id === editingId);
    if (index !== -1) {
        transactions[index] = { ...transactions[index], title, amount, category, type };
        saveTransactions();
        refreshDashboard();
        showToast('Transaction updated!', 'info');
    }
    modalOverlay.classList.add('hidden');
    editingId = null;
});
document.getElementById('txn-table-body').addEventListener('click', (e) => {
    const editBtn = e.target.closest('.btn-edit');
    const deleteBtn = e.target.closest('.btn-delete');
    if (editBtn) {
        const id = editBtn.dataset.id;
        const txn = transactions.find(t => t.id === id);
        if (!txn) return;
        editingId = id;
        document.getElementById('edit-title').value = txn.title;
        document.getElementById('edit-amount').value = txn.amount;
        document.getElementById('edit-category').value = txn.category;
        if (txn.type === 'income') document.getElementById('edit-type-income').checked = true;
        else document.getElementById('edit-type-expense').checked = true;
        document.getElementById('edit-txn-id').value = id;
        modalOverlay.classList.remove('hidden');
    }
    if (deleteBtn) {
        const id = deleteBtn.dataset.id;
        transactions = transactions.filter(t => t.id !== id);
        saveTransactions();
        refreshDashboard();
        showToast('Transaction deleted.', 'error');
    }
});
const searchInput = document.getElementById('search-input');
const filterSelect = document.getElementById('filter-select');
function applyFilter() {
    const query = searchInput.value.toLowerCase().trim();
    const filterVal = filterSelect.value;
    let result = [...transactions];
    if (filterVal !== 'all') result = result.filter(t => t.type === filterVal);
    if (query) result = result.filter(t => t.title.toLowerCase().includes(query) || t.category.toLowerCase().includes(query));
    renderTable(result);
}
searchInput.addEventListener('input', applyFilter);
filterSelect.addEventListener('change', applyFilter);
const btnResetData = document.getElementById('btn-reset-data');
btnResetData.addEventListener('click', () => {
    if (!confirm('Are you sure you want to delete all transactions? This cannot be undone.')) return;
    transactions = [];
    saveTransactions();
    refreshDashboard();
    showToast('All data has been reset.', 'error');
});
const settingsForm = document.getElementById('settings-form');
const settingsName = document.getElementById('settings-name');
const settingsCurrency = document.getElementById('settings-currency');
function loadSettings() {
    if (!currentUser) return;
    settingsName.value = currentUser.name;
    settingsCurrency.value = currentUser.currency;
}
settingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newName = settingsName.value.trim();
    const newCurrency = settingsCurrency.value;
    if (newName) {
        currentUser.name = newName;
    }
    currentUser.currency = newCurrency;
    saveUserData();
    updateAvatarDisplay();
    calculateStats();
    updateChart();
    showToast('Settings saved successfully!', 'success');
});
function initAppSession() {
    if (!currentUser) return;
    authScreen.classList.add('hidden');
    appShell.classList.remove('hidden');
    showPage('dashboard');
    applyTheme(currentUser.theme);
    setDate();
    updateAvatarDisplay();
    transactions = JSON.parse(localStorage.getItem(`fintrack_transactions_${currentUser.email}`)) || [];
    loadSettings();
    refreshDashboard();
}
function autoLogin() {
    const email = localStorage.getItem('fintrack_current_user');
    if (email) {
        const users = JSON.parse(localStorage.getItem('fintrack_users')) || [];
        const user = users.find(u => u.email === email);
        if (user) {
            currentUser = user;
            initAppSession();
            return;
        }
    }
    authScreen.classList.remove('hidden');
    appShell.classList.add('hidden');
}
autoLogin();
