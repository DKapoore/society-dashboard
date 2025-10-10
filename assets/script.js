// Configuration - UPDATE WITH YOUR WEB APP URL
const WEB_APP_URL = 'https://script.google.com/macros/s/1Sui2INwTLcblVNn7DltjAk5Q86iyFvCPLyUPTEPyPW4wv-BzEK5Cz6Pp/exec';

// Live data loader
async function loadData() {
    try {
        showLoading();
        updateConnectionStatus('loading');
        
        const response = await fetch(`${WEB_APP_URL}?action=all&t=${Date.now()}`);
        const data = await response.json();
        
        if (data.status === 'success') {
            updateDashboard(data.data);
            updateConnectionStatus('live');
        } else {
            throw new Error(data.error || 'Unknown error');
        }
        
    } catch (error) {
        console.error('Error loading live data:', error);
        showError('Failed to load live data. Using cached data...');
        updateConnectionStatus('error');
        // Fallback to GitHub data
        loadCachedData();
    }
}

// Fallback to GitHub data
async function loadCachedData() {
    try {
        const GITHUB_BASE_URL = 'https://dkapoore.github.io/society-dashboard';
        const [reports, members, maintenance, expenses] = await Promise.all([
            fetch(`${GITHUB_BASE_URL}/data/reports.json`).then(r => r.json()),
            fetch(`${GITHUB_BASE_URL}/data/members.json`).then(r => r.json()),
            fetch(`${GITHUB_BASE_URL}/data/maintenance.json`).then(r => r.json()),
            fetch(`${GITHUB_BASE_URL}/data/expenses.json`).then(r => r.json())
        ]);
        
        updateDashboard({ reports, members, maintenance, expenses });
        
    } catch (error) {
        showError('Cannot load any data source. Please check connection.');
    }
}

function updateDashboard(data) {
    const { reports, members, maintenance, expenses } = data;
    
    // Update last updated time
    document.getElementById('lastUpdated').textContent = new Date().toLocaleString();
    
    // Update all sections
    updateFinancialMetrics(reports);
    updateMembersList(members);
    updateRecentPayments(maintenance);
    updateExpenseChart(expenses);
}

function updateFinancialMetrics(reports) {
    const metrics = reports.metrics;
    const financialMetrics = document.getElementById('financialMetrics');
    
    financialMetrics.innerHTML = `
        <div class="card">
            <div class="metric-label">👥 Total Members</div>
            <div class="metric-value">${metrics['Total Members'] || 0}</div>
            <div class="metric-trend">Live from Google Sheets</div>
        </div>
        <div class="card">
            <div class="metric-label">✅ Active Members</div>
            <div class="metric-value">${metrics['Active Members'] || 0}</div>
            <div class="metric-trend">Live from Google Sheets</div>
        </div>
        <div class="card">
            <div class="metric-label">💰 Total Collection</div>
            <div class="metric-value">₹${formatNumber(metrics['Total Collection (₹)'] || 0)}</div>
            <div class="metric-trend">Updates automatically</div>
        </div>
        <div class="card">
            <div class="metric-label">📊 Total Expenses</div>
            <div class="metric-value">₹${formatNumber(metrics['Total Expenses (₹)'] || 0)}</div>
            <div class="metric-trend">Updates automatically</div>
        </div>
        <div class="card">
            <div class="metric-label">💳 Balance</div>
            <div class="metric-value">₹${formatNumber(metrics['Balance (₹)'] || 0)}</div>
            <div class="metric-trend">Real-time calculation</div>
        </div>
        <div class="card">
            <div class="metric-label">⏰ Pending Dues</div>
            <div class="metric-value">₹${formatNumber(metrics['Pending Dues (₹)'] || 0)}</div>
            <div class="metric-trend">Live from Sheet</div>
        </div>
    `;
}

function updateMembersList(members) {
    const membersList = document.getElementById('membersList');
    
    if (!members.members || members.members.length === 0) {
        membersList.innerHTML = '<div class="card"><p>No members found in Google Sheet.</p></div>';
        return;
    }
    
    membersList.innerHTML = members.members.map(member => `
        <div class="member-card ${member.pendingAmount > 0 ? 'has-pending' : ''}">
            <div class="member-name">${member.name}</div>
            <div class="member-details">
                🏠 Flat: ${member.flat} | 👤 ${member.type}<br>
                💰 Monthly: ₹${formatNumber(member.monthlyCharge)}
            </div>
            <div class="${member.pendingAmount > 0 ? 'pending-amount' : 'paid-amount'}">
                ${member.pendingAmount > 0 ? '⏰ Pending: ₹' + formatNumber(member.pendingAmount) : '✅ All Paid'}
            </div>
            <div class="member-details">
                📅 Last Paid: ${member.lastPaidMonth || 'Never'}
            </div>
            <div class="data-source">Google Sheets</div>
        </div>
    `).join('');
}

function updateRecentPayments(maintenance) {
    const recentPayments = document.getElementById('recentPayments');
    
    const paidBills = maintenance.bills
        .filter(bill => bill.status === 'Paid')
        .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
        .slice(0, 10);
    
    recentPayments.innerHTML = `
        <div class="card">
            <h3 style="margin-bottom: 15px; color: #333;">
                Recent Payments (Last 10)
                <span style="float: right; font-size: 0.8rem; color: #666;">Live Data</span>
            </h3>
            ${paidBills.length > 0 ? `
                <div style="display: grid; gap: 10px;">
                    ${paidBills.map(bill => `
                        <div class="payment-item">
                            <div class="payment-info">
                                <strong>${bill.memberName}</strong> (${bill.flatNo})<br>
                                <small>${bill.month} • ${bill.mode}</small>
                            </div>
                            <div class="payment-amount">
                                <div class="amount">₹${formatNumber(bill.amount)}</div>
                                <small>${formatDate(bill.paymentDate)}</small>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : '<p>No recent payments found in Google Sheet.</p>'}
        </div>
    `;
}

function updateExpenseChart(expenses) {
    const expenseChart = document.getElementById('expenseChart');
    
    if (!expenses.expenses || expenses.expenses.length === 0) {
        expenseChart.innerHTML = '<div class="card"><p>No expenses recorded in Google Sheet.</p></div>';
        return;
    }
    
    const categoryTotals = {};
    expenses.expenses.forEach(expense => {
        const category = expense.category || 'Other';
        categoryTotals[category] = (categoryTotals[category] || 0) + expense.amount;
    });
    
    expenseChart.innerHTML = `
        <div class="card">
            <h3 style="margin-bottom: 15px; color: #333;">
                Expense by Category
                <span style="float: right; font-size: 0.8rem; color: #666;">Live from Sheet</span>
            </h3>
            <div class="expense-categories">
                ${Object.entries(categoryTotals)
                    .sort((a, b) => b[1] - a[1])
                    .map(([category, total]) => `
                    <div class="expense-category">
                        <span class="category-name">${category}</span>
                        <span class="category-amount">₹${formatNumber(total)}</span>
                        <div class="category-bar" style="width: ${(total / Math.max(...Object.values(categoryTotals))) * 100}%"></div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Utility functions
function formatNumber(num) {
    return new Intl.NumberFormat('en-IN').format(num);
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN');
}

function updateConnectionStatus(status) {
    const statusElement = document.getElementById('connectionStatus');
    statusElement.className = `status-${status}`;
    statusElement.textContent = status === 'live' ? '● Live' : status === 'loading' ? '⟳ Loading...' : '● Error';
}

function showLoading() {
    document.getElementById('financialMetrics').innerHTML = '<div class="card loading">🔄 Loading live data from Google Sheets...</div>';
    document.getElementById('membersList').innerHTML = '<div class="card loading">🔄 Loading members...</div>';
}

function showError(message) {
    document.getElementById('financialMetrics').innerHTML = `<div class="card error">${message}</div>`;
}

// Modal functions
function showRawData() {
    fetch(`${https://dkapoore.github.io/society-dashboard/}?action=all`)
        .then(r => r.json())
        .then(data => {
            document.getElementById('rawDataContent').textContent = JSON.stringify(data, null, 2);
            document.getElementById('rawDataModal').style.display = 'block';
        });
}

function closeRawData() {
    document.getElementById('rawDataModal').style.display = 'none';
}

// Auto-refresh every 2 minutes for live data
setInterval(loadData, 2 * 60 * 1000);

// Load data when page loads
document.addEventListener('DOMContentLoaded', loadData);
