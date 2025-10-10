// update-data.js - Society Maintenance Data Generator
const fs = require('fs');
const path = require('path');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('✅ Created data directory');
}

// Sample data with Indian society examples
function generateSampleData() {
    const currentDate = new Date().toISOString();
    
    // Sample members data
    const members = [
        {
            id: "MEM-202401-001",
            name: "Rajesh Sharma",
            flat: "A-101",
            mobile: "9876543210",
            type: "Owner",
            monthlyCharge: 2500,
            pendingAmount: 0,
            lastPaidMonth: "Jan-2024",
            joinDate: "01-Jan-2023",
            status: "Active"
        },
        {
            id: "MEM-202401-002", 
            name: "Priya Singh",
            flat: "A-102",
            mobile: "9876543211",
            type: "Owner",
            monthlyCharge: 2500,
            pendingAmount: 2500,
            lastPaidMonth: "Dec-2023",
            joinDate: "01-Jan-2023",
            status: "Active"
        },
        {
            id: "MEM-202401-003",
            name: "Amit Verma",
            flat: "B-201", 
            mobile: "9876543212",
            type: "Tenant",
            monthlyCharge: 2500,
            pendingAmount: 5000,
            lastPaidMonth: "Nov-2023",
            joinDate: "01-Mar-2023",
            status: "Active"
        },
        {
            id: "MEM-202401-004",
            name: "Sunita Patel",
            flat: "B-202",
            mobile: "9876543213", 
            type: "Owner",
            monthlyCharge: 2500,
            pendingAmount: 0,
            lastPaidMonth: "Jan-2024",
            joinDate: "01-Jan-2023",
            status: "Active"
        },
        {
            id: "MEM-202401-005",
            name: "Vikram Joshi",
            flat: "C-301",
            mobile: "9876543214",
            type: "Owner", 
            monthlyCharge: 2500,
            pendingAmount: 2500,
            lastPaidMonth: "",
            joinDate: "01-Feb-2023",
            status: "Active"
        }
    ];

    // Sample maintenance bills data
    const bills = [
        {
            entryId: "BILL-20240115-001",
            month: "Jan-2024",
            flatNo: "A-101",
            memberName: "Rajesh Sharma",
            amount: 2500,
            mode: "Online",
            paymentDate: "05-Jan-2024",
            status: "Paid",
            dueDate: "10-Jan-2024"
        },
        {
            entryId: "BILL-20240115-002",
            month: "Jan-2024", 
            flatNo: "A-102",
            memberName: "Priya Singh",
            amount: 2500,
            mode: "",
            paymentDate: "",
            status: "Unpaid",
            dueDate: "10-Jan-2024"
        },
        {
            entryId: "BILL-20240115-003",
            month: "Jan-2024",
            flatNo: "B-201",
            memberName: "Amit Verma", 
            amount: 2500,
            mode: "",
            paymentDate: "",
            status: "Unpaid",
            dueDate: "10-Jan-2024"
        },
        {
            entryId: "BILL-20240115-004",
            month: "Jan-2024",
            flatNo: "B-202",
            memberName: "Sunita Patel",
            amount: 2500,
            mode: "Cash", 
            paymentDate: "08-Jan-2024",
            status: "Paid",
            dueDate: "10-Jan-2024"
        },
        {
            entryId: "BILL-20240115-005",
            month: "Jan-2024",
            flatNo: "C-301",
            memberName: "Vikram Joshi",
            amount: 2500,
            mode: "",
            paymentDate: "",
            status: "Unpaid", 
            dueDate: "10-Jan-2024"
        },
        {
            entryId: "BILL-20231215-001",
            month: "Dec-2023",
            flatNo: "A-102",
            memberName: "Priya Singh",
            amount: 2500,
            mode: "",
            paymentDate: "",
            status: "Unpaid",
            dueDate: "10-Dec-2023"
        },
        {
            entryId: "BILL-20231115-001", 
            month: "Nov-2023",
            flatNo: "B-201",
            memberName: "Amit Verma",
            amount: 2500,
            mode: "",
            paymentDate: "",
            status: "Unpaid",
            dueDate: "10-Nov-2023"
        }
    ];

    // Sample expenses data
    const expenses = [
        {
            expenseId: "EXP-20240115-001",
            date: "05-Jan-2024",
            description: "Electricity Bill Payment",
            amount: 12500,
            paidBy: "Treasurer",
            remarks: "Main building electricity",
            category: "Electricity"
        },
        {
            expenseId: "EXP-20240110-001",
            date: "10-Jan-2024", 
            description: "Security Guard Salary",
            amount: 8000,
            paidBy: "Secretary",
            remarks: "January salary",
            category: "Security"
        },
        {
            expenseId: "EXP-20240105-001",
            date: "05-Jan-2024",
            description: "Water Tank Cleaning",
            amount: 2500,
            paidBy: "Treasurer",
            remarks: "Monthly cleaning service",
            category: "Cleaning"
        },
        {
            expenseId: "EXP-20231228-001",
            date: "28-Dec-2023",
            description: "Lift Maintenance", 
            amount: 3500,
            paidBy: "Secretary",
            remarks: "Quarterly maintenance",
            category: "Repairs"
        },
        {
            expenseId: "EXP-20231225-001",
            date: "25-Dec-2023",
            description: "Gardening Services",
            amount: 3000,
            paidBy: "Treasurer",
            remarks: "Monthly gardening",
            category: "Gardening"
        }
    ];

    // Calculate reports metrics
    const totalMembers = members.length;
    const activeMembers = members.filter(m => m.status === 'Active').length;
    
    const paidBills = bills.filter(bill => bill.status === 'Paid');
    const totalCollection = paidBills.reduce((sum, bill) => sum + bill.amount, 0);
    
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const balance = totalCollection - totalExpenses;
    
    const pendingBills = bills.filter(bill => bill.status === 'Unpaid');
    const pendingDues = pendingBills.reduce((sum, bill) => sum + bill.amount, 0);

    // Current month calculations
    const currentMonth = new Date().toLocaleString('en-IN', { month: 'short', year: 'numeric' });
    const thisMonthCollection = paidBills
        .filter(bill => bill.month === currentMonth)
        .reduce((sum, bill) => sum + bill.amount, 0);
    
    const thisMonthExpenses = expenses
        .filter(expense => {
            const expenseDate = new Date(expense.date);
            const expenseMonth = expenseDate.toLocaleString('en-IN', { month: 'short', year: 'numeric' });
            return expenseMonth === currentMonth;
        })
        .reduce((sum, expense) => sum + expense.amount, 0);

    return {
        reports: {
            lastUpdated: currentDate,
            metrics: {
                'Total Members': totalMembers,
                'Active Members': activeMembers,
                'Total Collection (₹)': totalCollection,
                'Total Expenses (₹)': totalExpenses,
                'Balance (₹)': balance,
                'Pending Dues (₹)': pendingDues,
                'Collection This Month (₹)': thisMonthCollection,
                'Expenses This Month (₹)': thisMonthExpenses
            }
        },
        members: {
            lastUpdated: currentDate,
            totalMembers: totalMembers,
            activeMembers: activeMembers,
            members: members
        },
        maintenance: {
            lastUpdated: currentDate,
            totalBills: bills.length,
            paidBills: paidBills.length,
            unpaidBills: pendingBills.length,
            bills: bills
        },
        expenses: {
            lastUpdated: currentDate,
            totalExpenses: expenses.length,
            totalAmount: totalExpenses,
            expenses: expenses
        }
    };
}

// Generate and save data files
function generateAndSaveData() {
    try {
        const data = generateSampleData();
        
        // Save reports.json
        fs.writeFileSync(
            path.join(dataDir, 'reports.json'),
            JSON.stringify(data.reports, null, 2)
        );
        console.log('✅ reports.json created');
        
        // Save members.json
        fs.writeFileSync(
            path.join(dataDir, 'members.json'),
            JSON.stringify(data.members, null, 2)
        );
        console.log('✅ members.json created');
        
        // Save maintenance.json
        fs.writeFileSync(
            path.join(dataDir, 'maintenance.json'),
            JSON.stringify(data.maintenance, null, 2)
        );
        console.log('✅ maintenance.json created');
        
        // Save expenses.json
        fs.writeFileSync(
            path.join(dataDir, 'expenses.json'),
            JSON.stringify(data.expenses, null, 2)
        );
        console.log('✅ expenses.json created');
        
        console.log('\n🎉 All data files generated successfully!');
        console.log('📊 Summary:');
        console.log(`   • ${data.members.totalMembers} Members`);
        console.log(`   • ₹${data.reports.metrics['Total Collection (₹)']} Total Collection`);
        console.log(`   • ₹${data.reports.metrics['Total Expenses (₹)']} Total Expenses`);
        console.log(`   • ₹${data.reports.metrics['Pending Dues (₹)']} Pending Dues`);
        
    } catch (error) {
        console.error('❌ Error generating data:', error);
    }
}

// Run the data generation
generateAndSaveData();