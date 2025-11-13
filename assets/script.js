// script.js - Society Dashboard Data Handler
const DATA_URL = 'https://dkapoore.github.io/society-dashboard/data/data.json';
const NOTICE_URL = 'https://dkapoore.github.io/society-dashboard/data/notice.json';

let currentData = null;
let currentNotices = null;

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadAllData();
    
    // Auto-refresh every 2 minutes
    setInterval(loadAllData, 2 * 60 * 1000);
    
    // Add refresh button listener
    const refreshBtn = document.querySelector('.refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadAllData);
    }
});

// Load all data from GitHub Pages
async function loadAllData() {
    try {
        showLoadingState();
        updateConnectionStatus('loading', '⟳ Loading data from GitHub...');
        
        const [dataResponse, noticesResponse] = await Promise.all([
            fetchWithTimeout(DATA_URL, 10000),
            fetchWithTimeout(NOTICE_URL, 10000)
        ]);

        if (!dataResponse.ok) throw new Error(`Data fetch failed: ${dataResponse.status}`);
        if (!noticesResponse.ok) throw new Error(`Notices fetch failed: ${noticesResponse.status}`);

        currentData = await dataResponse.json();
        currentNotices = await noticesResponse.json();

        renderDashboard(currentData, currentNotices);
        updateConnectionStatus('success', '✅ Data loaded successfully');
        
        // Update last updated timestamp
        document.getElementById('lastUpdated').textContent = new Date().toLocaleString();
        
    } catch (error) {
        console.error('Error loading data:', error);
        updateConnectionStatus('error', '❌ Failed to load data');
        showErrorState('Failed to load data from GitHub. Please try again later.');
    }
}

// Fetch with timeout
async function fetchWithTimeout(url, timeout = 10000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(url, {
            signal: controller.signal,
            cache: 'no-cache'
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

// Render the complete dashboard
function renderDashboard(data, notices) {
    updateFinancialMetrics(data);
    renderSummaryTable(data);
    renderNotices(notices);
    updateMembersOverview(data);
    updateExpenseAnalysis(data);
}

// Update financial metrics section
function updateFinancialMetrics(data) {
    const metricsContainer = document.getElementById('financialMetrics');
    
    if (!data || !data.summary) {
        metricsContainer.innerHTML = '<div class="metric-card">No financial data available</div>';
        return;
    }

    const metrics = [
        { 
            label: 'Total Collections', 
            value: data.summary.totalCollectionAmount, 
            format: 'currency',
            icon: '💰'
        },
        { 
            label: 'Total Expenses', 
            value: data.summary.totalExpenseAmount, 
            format: 'currency',
            icon: '📊'
        },
        { 
            label: 'Net Balance', 
            value: data.summary.netBalance, 
            format: 'currency',
            icon: '💳'
        },
        { 
            label: 'Collections Count', 
            value: data.summary.totalCollections, 
            format: 'number',
            icon: '📥'
        },
        { 
            label: 'Expenses Count', 
            value: data.summary.totalExpenses, 
            format: 'number',
            icon: '📤'
        }
    ];

    metricsContainer.innerHTML = metrics.map(metric => `
        <div class="metric-card">
            <div class="metric-icon">${metric.icon}</div>
            <div class="metric-value">
                ${metric.format === 'currency' ? '₹' : ''}${(metric.value || 0).toLocaleString('en-IN')}
            </div>
            <div class="metric-label">${metric.label}</div>
        </div>
    `).join('');
}

// Render combined summary table
function renderSummaryTable(data) {
    const tableBody = document.getElementById('summaryTableBody');
    
    if (!data || !data.data) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">No transaction data available</td></tr>';
        return;
    }

    // Combine collections and expenses into a single array
    const allEntries = [
        ...(data.data.collections || []).map(item => ({ 
            ...item, 
            entryType: 'collection',
            displayName: item.member || 'N/A',
            category: 'Payment'
        })),
        ...(data.data.expenses || []).map(item => ({ 
            ...item, 
            entryType: 'expense',
            displayName: item.item || 'N/A',
            category: item.category || 'Other'
        }))
    ];

    // Sort by date (newest first)
    allEntries.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (allEntries.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">No transactions found</td></tr>';
        return;
    }

    tableBody.innerHTML = allEntries.map(entry => `
        <tr>
            <td>${formatDate(entry.date)}</td>
            <td>
                <span class="type-badge type-${entry.entryType}">
                    ${entry.entryType === 'collection' ? '💳 Collection' : '📊 Expense'}
                </span>
            </td>
            <td>
                <strong>${entry.displayName}</strong>
                ${entry.flat ? `<br><small>🏠 ${entry.flat}</small>` : ''}
                ${entry.entryType === 'expense' && entry.category ? `<br><small>📁 ${entry.category}</small>` : ''}
            </td>
            <td class="amount-cell">
                <span class="amount ${entry.entryType}">
                    ₹${(entry.amount || 0).toLocaleString('en-IN')}
                </span>
            </td>
            <td class="remark-cell">
                ${entry.remark || '-'}
                ${entry.mode ? `<br><small>${getPaymentModeIcon(entry.mode)} ${entry.mode}</small>` : ''}
            </td>
        </tr>
    `).join('');
}

// Render notices section
function renderNotices(notices) {
    const noticesContainer = document.getElementById('noticesList');
    
    if (!notices || notices.length === 0) {
        noticesContainer.innerHTML = `
            <div class="notice-card">
                <div class="notice-title">No Notices Available</div>
                <div class="notice-description">Check back later for updates from the society committee.</div>
            </div>
        `;
        return;
    }

    // Sort notices by date (newest first) and take latest 10
    const sortedNotices = [...notices]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10);

    noticesContainer.innerHTML = sortedNotices.map(notice => `
        <div class="notice-card">
            <div class="notice-header">
                <div class="notice-title-container">
                    <div class="notice-title">${notice.title || 'No Title'}</div>
                    <div class="notice-date">📅 ${formatDate(notice.date)}</div>
                </div>
                <div class="notice-meta">
                    <span class="notice-type type-${notice.type}">
                        ${getNoticeTypeIcon(notice.type)} ${notice.type}
                    </span>
                    ${notice.priority ? `
                        <span class="notice-priority priority-${notice.priority}">
                            ${notice.priority}
                        </span>
                    ` : ''}
                </div>
            </div>
            <div class="notice-description">
                ${notice.description || 'No description available'}
            </div>
            <div class="notice-footer">
                ${notice.issuer ? `<span class="notice-issuer">👤 Issued by: ${notice.issuer}</span>` : ''}
                <span class="notice-source">🌐 GitHub Pages</span>
            </div>
        </div>
    `).join('');
}

// Update members overview section
function updateMembersOverview(data) {
    const membersContainer = document.getElementById('membersList');
    
    if (!data || !data.data || !data.data.collections) {
        membersContainer.innerHTML = '<div class="member-card">No member data available</div>';
        return;
    }

    // Extract unique members from collections
    const memberMap = new Map();
    
    data.data.collections.forEach(collection => {
        if (collection.member && collection.flat) {
            const key = `${collection.member}-${collection.flat}`;
            if (!memberMap.has(key)) {
                memberMap.set(key, {
                    name: collection.member,
                    flat: collection.flat,
                    totalPaid: 0,
                    lastPayment: null
                });
            }
            const member = memberMap.get(key);
            member.totalPaid += collection.amount || 0;
            if (!member.lastPayment || new Date(collection.date) > new Date(member.lastPayment)) {
                member.lastPayment = collection.date;
            }
        }
    });

    const members = Array.from(memberMap.values())
        .sort((a, b) => b.totalPaid - a.totalPaid)
        .slice(0, 6); // Show top 6 members by payment amount

    if (members.length === 0) {
        membersContainer.innerHTML = '<div class="member-card">No member payment data available</div>';
        return;
    }

    membersContainer.innerHTML = members.map(member => `
        <div class="member-card">
            <div class="member-header">
                <div class="member-name">👤 ${member.name}</div>
                <div class="member-flat">🏠 ${member.flat}</div>
            </div>
            <div class="member-stats">
                <div class="member-total">
                    💰 Total Paid: ₹${member.totalPaid.toLocaleString('en-IN')}
                </div>
                ${member.lastPayment ? `
                    <div class="member-last-payment">
                        📅 Last: ${formatDate(member.lastPayment)}
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Update expense analysis section
function updateExpenseAnalysis(data) {
    const expenseContainer = document.getElementById('expenseChart');
    
    if (!data || !data.data || !data.data.expenses) {
        expenseContainer.innerHTML = '<div class="chart-placeholder">No expense data available for analysis</div>';
        return;
    }

    // Calculate expense breakdown by category
    const categoryTotals = {};
    let totalExpenses = 0;
    
    data.data.expenses.forEach(expense => {
        const category = expense.category || 'Other';
        const amount = expense.amount || 0;
        categoryTotals[category] = (categoryTotals[category] || 0) + amount;
        totalExpenses += amount;
    });

    // Sort categories by amount (descending)
    const sortedCategories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1]);

    if (sortedCategories.length === 0) {
        expenseContainer.innerHTML = '<div class="chart-placeholder">No expense categories found</div>';
        return;
    }

    expenseContainer.innerHTML = `
        <div class="expense-analysis">
            <div class="expense-header">
                <h4>📈 Expense Distribution</h4>
                <div class="total-expenses">Total: ₹${totalExpenses.toLocaleString('en-IN')}</div>
            </div>
            <div class="expense-categories">
                ${sortedCategories.map(([category, amount]) => {
                    const percentage = ((amount / totalExpenses) * 100).toFixed(1);
                    return `
                        <div class="expense-category">
                            <div class="category-info">
                                <span class="category-name">${category}</span>
                                <span class="category-amount">₹${amount.toLocaleString('en-IN')}</span>
                            </div>
                            <div class="category-percentage">${percentage}%</div>
                            <div class="category-bar">
                                <div class="bar-fill" style="width: ${percentage}%"></div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

// Filter summary table by type
function filterSummary() {
    const filter = document.getElementById('typeFilter').value;
    const rows = document.querySelectorAll('#summaryTableBody tr');
    
    let visibleCount = 0;
    
    rows.forEach(row => {
        const typeBadge = row.querySelector('.type-badge');
        if (!typeBadge) return;
        
        const type = typeBadge.textContent.includes('Collection') ? 'collection' : 'expense';
        
        if (filter === 'all' || type === filter) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });
    
    // Show message if no rows visible
    const tableBody = document.getElementById('summaryTableBody');
    if (visibleCount === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">No transactions match the selected filter</td></tr>';
    }
}

// Filter notices by type
function filterNotices() {
    const filter = document.getElementById('noticeTypeFilter').value;
    const notices = document.querySelectorAll('.notice-card');
    
    let visibleCount = 0;
    
    notices.forEach(notice => {
        const typeElement = notice.querySelector('.notice-type');
        if (!typeElement) return;
        
        const type = typeElement.textContent.replace(/[🔧📅📢🚨🎉]/g, '').trim();
        
        if (filter === 'all' || type === filter) {
            notice.style.display = '';
            visibleCount++;
        } else {
            notice.style.display = 'none';
        }
    });
    
    // Show message if no notices visible
    const noticesContainer = document.getElementById('noticesList');
    if (visibleCount === 0) {
        noticesContainer.innerHTML = '<div class="notice-card">No notices match the selected filter</div>';
    }
}

// Manual refresh function
function refreshData() {
    loadAllData();
}

// Show loading state
function showLoadingState() {
    const elements = [
        '#financialMetrics',
        '#summaryTableBody', 
        '#noticesList',
        '#membersList',
        '#expenseChart'
    ];
    
    elements.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
            element.innerHTML = '<div class="loading-spinner">🔄 Loading...</div>';
        }
    });
}

// Show error state
function showErrorState(message) {
    const financialMetrics = document.getElementById('financialMetrics');
    if (financialMetrics) {
        financialMetrics.innerHTML = `<div class="error-message">${message}</div>`;
    }
}

// Update connection status
function updateConnectionStatus(status, message = '') {
    const statusElement = document.getElementById('connectionStatus');
    if (!statusElement) return;
    
    statusElement.className = `status-${status}`;
    
    const statusMessages = {
        loading: '⟳ Loading...',
        success: '✅ Live',
        error: '❌ Connection Error'
    };
    
    statusElement.textContent = message || statusMessages[status] || status;
}

// Utility function to format dates
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    } catch (error) {
        return dateString;
    }
}

// Get payment mode icon
function getPaymentModeIcon(mode) {
    const icons = {
        'Cash': '💵',
        'Online': '🌐',
        'Cheque': '📄',
        'UPI': '📱'
    };
    return icons[mode] || '💳';
}

// Get notice type icon
function getNoticeTypeIcon(type) {
    const icons = {
        'Maintenance': '🔧',
        'Meeting': '📅',
        'General': '📢',
        'Emergency': '🚨',
        'Event': '🎉'
    };
    return icons[type] || '📢';
}

// Show raw data in modal
function showRawData() {
    const dataContent = document.getElementById('rawDataContent');
    const noticesContent = document.getElementById('rawNoticesContent');
    
    if (dataContent && currentData) {
        dataContent.textContent = JSON.stringify(currentData, null, 2);
    }
    
    if (noticesContent && currentNotices) {
        noticesContent.textContent = JSON.stringify(currentNotices, null, 2);
    }
    
    document.getElementById('rawDataModal').style.display = 'block';
}

// Close raw data modal
function closeRawData() {
    document.getElementById('rawDataModal').style.display = 'none';
}

// Tab functionality for modal
function openTab(evt, tabName) {
    const tabcontent = document.getElementsByClassName('tab-content');
    for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].classList.remove('active');
    }
    
    const tablinks = document.getElementsByClassName('tab-btn');
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].classList.remove('active');
    }
    
    document.getElementById(tabName).classList.add('active');
    evt.currentTarget.classList.add('active');
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('rawDataModal');
    if (event.target === modal) {
        closeRawData();
    }
}

// Add CSS for new elements
const additionalStyles = `
    .loading-spinner {
        text-align: center;
        padding: 20px;
        color: #666;
        font-style: italic;
    }
    
    .error-message {
        text-align: center;
        padding: 20px;
        color: #dc3545;
        background: #f8d7da;
        border-radius: 8px;
        margin: 10px 0;
    }
    
    .amount-cell .amount {
        font-weight: bold;
    }
    
    .amount-cell .amount.collection {
        color: #28a745;
    }
    
    .amount-cell .amount.expense {
        color: #dc3545;
    }
    
    .remark-cell {
        max-width: 200px;
        word-wrap: break-word;
    }
    
    .notice-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid #eee;
        font-size: 0.8rem;
        color: #666;
    }
    
    .expense-analysis {
        width: 100%;
    }
    
    .expense-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
    }
    
    .expense-category {
        margin-bottom: 10px;
    }
    
    .category-info {
        display: flex;
        justify-content: space-between;
        margin-bottom: 5px;
    }
    
    .category-bar {
        width: 100%;
        height: 6px;
        background: #e9ecef;
        border-radius: 3px;
        overflow: hidden;
    }
    
    .bar-fill {
        height: 100%;
        background: linear-gradient(90deg, #667eea, #764ba2);
        transition: width 0.3s ease;
    }
    
    .chart-placeholder {
        text-align: center;
        padding: 40px 20px;
        color: #666;
        font-style: italic;
    }
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);
