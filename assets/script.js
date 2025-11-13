// script.js
const DATA_URL = 'https://dkapoore.github.io/society-dashboard/data/data.json';
const NOTICES_URL = 'https://dkapoore.github.io/society-dashboard/data/notice.json';

let currentData = null;
let currentNotices = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    loadAllData();
    // Auto-refresh every 5 minutes
    setInterval(loadAllData, 5 * 60 * 1000);
});

// Load all data from both endpoints
async function loadAllData() {
    try {
        setStatus('loading', '⟳ Loading data...');
        
        const [dataResponse, noticesResponse] = await Promise.all([
            fetch(DATA_URL).then(response => {
                if (!response.ok) throw new Error('Data fetch failed');
                return response.json();
            }),
            fetch(NOTICES_URL).then(response => {
                if (!response.ok) throw new Error('Notices fetch failed');
                return response.json();
            })
        ]);

        currentData = dataResponse;
        currentNotices = noticesResponse;

        updateDashboard(dataResponse, noticesResponse);
        setStatus('success', '✅ Data loaded successfully');
        
        // Update last updated timestamp
        document.getElementById('lastUpdated').textContent = new Date().toLocaleString();
        
    } catch (error) {
        console.error('Error loading data:', error);
        setStatus('error', '❌ Failed to load data');
    }
}

// Update the entire dashboard with new data
function updateDashboard(data, notices) {
    updateFinancialMetrics(data);
    updateSummaryTable(data);
    updateNotices(notices);
    updateMembersList(data);
    updateExpenseChart(data);
}

// Update financial metrics section
function updateFinancialMetrics(data) {
    const metricsContainer = document.getElementById('financialMetrics');
    
    if (!data || !data.summary) {
        metricsContainer.innerHTML = '<div class="metric-card">No data available</div>';
        return;
    }

    const metrics = [
        { label: 'Total Collections', value: data.summary.totalCollectionAmount, format: 'currency' },
        { label: 'Total Expenses', value: data.summary.totalExpenseAmount, format: 'currency' },
        { label: 'Net Balance', value: data.summary.netBalance, format: 'currency' },
        { label: 'Collections Count', value: data.summary.totalCollections, format: 'number' },
        { label: 'Expenses Count', value: data.summary.totalExpenses, format: 'number' }
    ];

    metricsContainer.innerHTML = metrics.map(metric => `
        <div class="metric-card">
            <div class="metric-label">${metric.label}</div>
            <div class="metric-value">
                ${metric.format === 'currency' ? '₹' : ''}${metric.value?.toLocaleString('en-IN') || '0'}
            </div>
        </div>
    `).join('');
}

// Update summary table with combined data
function updateSummaryTable(data) {
    const tableBody = document.getElementById('summaryTableBody');
    
    if (!data || !data.data) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No data available</td></tr>';
        return;
    }

    // Combine collections and expenses into a single array
    const allEntries = [
        ...(data.data.collections || []).map(item => ({ ...item, entryType: 'collection' })),
        ...(data.data.expenses || []).map(item => ({ ...item, entryType: 'expense' }))
    ];

    // Sort by date (newest first)
    allEntries.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (allEntries.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No transactions found</td></tr>';
        return;
    }

    tableBody.innerHTML = allEntries.map(entry => `
        <tr>
            <td>${formatDate(entry.date)}</td>
            <td>
                <span class="type-badge type-${entry.entryType}">
                    ${entry.entryType}
                </span>
            </td>
            <td>
                ${entry.entryType === 'collection' 
                    ? (entry.member || 'N/A')
                    : (entry.item || 'N/A')
                }
            </td>
            <td>₹${(entry.amount || 0).toLocaleString('en-IN')}</td>
            <td>${entry.remark || '-'}</td>
        </tr>
    `).join('');
}

// Update notices section
function updateNotices(notices) {
    const noticesContainer = document.getElementById('noticesList');
    
    if (!notices || notices.length === 0) {
        noticesContainer.innerHTML = '<div class="notice-card">No notices available</div>';
        return;
    }

    noticesContainer.innerHTML = notices.map(notice => `
        <div class="notice-card">
            <div class="notice-header">
                <div>
                    <div class="notice-title">${notice.title || 'No Title'}</div>
                    <div class="notice-date">${formatDate(notice.date)}</div>
                </div>
                <div>
                    <span class="notice-type type-${notice.type}">${notice.type}</span>
                    ${notice.priority ? `<span class="notice-priority priority-${notice.priority}">${notice.priority}</span>` : ''}
                </div>
            </div>
            <div class="notice-description">
                ${notice.description || 'No description available'}
            </div>
            ${notice.issuer ? `<div class="notice-issuer">Issued by: ${notice.issuer}</div>` : ''}
        </div>
    `).join('');
}

// Update members list
function updateMembersList(data) {
    const membersContainer = document.getElementById('membersList');
    
    // For now, we'll show a summary of unique members from collections
    if (!data || !data.data || !data.data.collections) {
        membersContainer.innerHTML = '<div class="member-card">No member data available</div>';
        return;
    }

    const uniqueMembers = {};
    data.data.collections.forEach(collection => {
        if (collection.member && collection.flat) {
            uniqueMembers[collection.member] = {
                name: collection.member,
                flat: collection.flat,
                amount: (uniqueMembers[collection.member]?.amount || 0) + (collection.amount || 0)
            };
        }
    });

    const members = Object.values(uniqueMembers).slice(0, 6); // Show first 6 members

    if (members.length === 0) {
        membersContainer.innerHTML = '<div class="member-card">No member data available</div>';
        return;
    }

    membersContainer.innerHTML = members.map(member => `
        <div class="member-card">
            <div class="member-name">${member.name}</div>
            <div class="member-details">
                Flat: ${member.flat}<br>
                Total Paid: ₹${member.amount.toLocaleString('en-IN')}
            </div>
        </div>
    `).join('');
}

// Update expense chart (placeholder for now)
function updateExpenseChart(data) {
    const chartContainer = document.getElementById('expenseChart');
    
    if (!data || !data.data || !data.data.expenses) {
        chartContainer.innerHTML = '<p>No expense data available for chart</p>';
        return;
    }

    // Simple expense breakdown by category
    const categories = {};
    data.data.expenses.forEach(expense => {
        const category = expense.category || 'Other';
        categories[category] = (categories[category] || 0) + (expense.amount || 0);
    });

    const chartContent = Object.entries(categories).map(([category, amount]) => `
        <div style="margin: 5px 0; padding: 5px; background: #f0f0f0; border-radius: 4px;">
            <strong>${category}:</strong> ₹${amount.toLocaleString('en-IN')}
        </div>
    `).join('');

    chartContainer.innerHTML = `
        <div style="width: 100%;">
            <h4 style="margin-bottom: 15px;">Expense Breakdown</h4>
            ${chartContent}
        </div>
    `;
}

// Filter summary table by type
function filterSummary() {
    const filter = document.getElementById('typeFilter').value;
    const rows = document.querySelectorAll('#summaryTableBody tr');
    
    rows.forEach(row => {
        const type = row.querySelector('.type-badge').textContent.trim();
        if (filter === 'all' || type === filter) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Filter notices by type
function filterNotices() {
    const filter = document.getElementById('noticeTypeFilter').value;
    const notices = document.querySelectorAll('.notice-card');
    
    notices.forEach(notice => {
        const type = notice.querySelector('.notice-type').textContent.trim();
        if (filter === 'all' || type === filter) {
            notice.style.display = '';
        } else {
            notice.style.display = 'none';
        }
    });
}

// Refresh data manually
function refreshData() {
    document.body.classList.add('loading');
    loadAllData().finally(() => {
        document.body.classList.remove('loading');
    });
}

// Set connection status
function setStatus(type, message) {
    const statusElement = document.getElementById('connectionStatus');
    statusElement.textContent = message;
    statusElement.className = `status-${type}`;
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    } catch {
        return dateString;
    }
}

// Show raw data in modal
function showRawData() {
    document.getElementById('rawDataContent').textContent = 
        JSON.stringify(currentData, null, 2);
    document.getElementById('rawNoticesContent').textContent = 
        JSON.stringify(currentNotices, null, 2);
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
