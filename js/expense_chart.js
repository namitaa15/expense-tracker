import { database, auth } from './firebase.js';
import { ref, get } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// DOM Elements
const chartTypeSelect = document.getElementById('chart-type');
const timePeriodSelect = document.getElementById('time-period');
const startDateInput = document.getElementById('start-date');
const endDateInput = document.getElementById('end-date');
const customDateRange = document.getElementById('custom-date-range');
const expenseChartCanvas = document.getElementById('expense-chart');
const logoutButton = document.getElementById('logout-button');

// Variables for storing expense data
let expenseData = {};
const categories = ['food', 'transport', 'education', 'utilities', 'entertainment', 'others'];

// Initialize chart (defer rendering until user authenticated)
let expenseChart;

// Authentication state listener
auth.onAuthStateChanged((user) => {
    if (!user) {
        console.warn("User is not authenticated. Redirecting to login.");
        window.location.href = 'login.html';
    } else {
        console.log(`User authenticated: ${user.email || user.uid}`);
        initializeChart();
        setupEventListeners();
        fetchExpenseData('monthly'); // Load default data
    }
});

// Initialize chart
function initializeChart() {
    expenseChart = new Chart(expenseChartCanvas, {
        type: 'bar', // Default to bar chart
        data: {
            labels: categories,
            datasets: [{
                label: 'Expenses',
                data: Array(categories.length).fill(0),
                backgroundColor: [
                    'rgba(90, 61, 153, 0.6)',
                    'rgba(57, 100, 214, 0.6)',
                    'rgba(93, 185, 214, 0.6)',
                    'rgba(100, 180, 100, 0.6)',
                    'rgba(245, 126, 126, 0.6)',
                    'rgba(240, 200, 90, 0.6)'
                ],
                borderColor: [
                    'rgba(90, 61, 153, 1)',
                    'rgba(57, 100, 214, 1)',
                    'rgba(93, 185, 214, 1)',
                    'rgba(100, 180, 100, 1)',
                    'rgba(245, 126, 126, 1)',
                    'rgba(240, 200, 90, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        label: (tooltipItem) => `$${tooltipItem.raw.toFixed(2)}`
                    },
                    backgroundColor: 'rgba(90, 61, 153, 0.9)',
                    titleColor: '#ffffff',
                    bodyColor: '#f0f0f0',
                    borderColor: 'rgba(57, 100, 214, 1)',
                    borderWidth: 1
                }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}
// Set up event listeners
function setupEventListeners() {
    chartTypeSelect.addEventListener('change', updateChartType);
    timePeriodSelect.addEventListener('change', handleTimePeriodChange);
    logoutButton.addEventListener('click', handleLogout);
}

// Update chart type
function updateChartType() {
    expenseChart.config.type = chartTypeSelect.value;
    expenseChart.update();
    console.log(`Chart type updated to: ${chartTypeSelect.value}`);
}

// Handle time period change
function handleTimePeriodChange() {
    const timePeriod = timePeriodSelect.value;
    if (timePeriod === 'custom') {
        customDateRange.style.display = 'block';
    } else {
        customDateRange.style.display = 'none';
        fetchExpenseData(timePeriod);
    }
    console.log(`Time period changed to: ${timePeriod}`);
}

// Fetch data from Firebase
async function fetchExpenseData(timePeriod) {
    const userId = auth.currentUser?.uid;
    if (!userId) {
        console.error("No user is logged in.");
        window.location.href = 'login.html';
        return;
    }

    const expensesRef = ref(database, `expenses/${userId}`);
    try {
        const snapshot = await get(expensesRef);
        if (snapshot.exists()) {
            console.log("Expense data fetched successfully:", snapshot.val());
            processExpenseData(snapshot.val(), timePeriod);
        } else {
            console.warn("No expense data available.");
            resetChartAndSummary();
        }
    } catch (error) {
        console.error("Error fetching expense data:", error);
        resetChartAndSummary();
    }
}

// Process and display expense data
function processExpenseData(data, timePeriod) {
    const filteredData = filterDataByTimePeriod(data, timePeriod);
    const categoryTotals = categories.map(category => filteredData[category] || 0);

    // Update chart
    expenseChart.data.datasets[0].data = categoryTotals;
    expenseChart.update();
    console.log("Chart updated with filtered data:", categoryTotals);

    // Update summary
    updateExpenseSummary(categoryTotals);
}

// Filter data by time period
function filterDataByTimePeriod(data, timePeriod) {
    const filtered = {};
    const currentDate = new Date();

    Object.keys(data).forEach((key) => {
        const expense = data[key];
        const expenseCategory = expense.category || 'others';
        const expenseDate = new Date(expense.date);
        const daysDifference = (currentDate - expenseDate) / (1000 * 60 * 60 * 24);

        const isValid =
            timePeriod === 'weekly' ? daysDifference <= 7 :
            timePeriod === 'monthly' ? daysDifference <= 30 :
            timePeriod === 'yearly' ? daysDifference <= 365 : true;

        if (isValid) {
            filtered[expenseCategory] = (filtered[expenseCategory] || 0) + parseFloat(expense.amount);
        }
    });

    console.log("Filtered data by time period:", timePeriod, filtered);
    return filtered;
}

// Update expense summary
function updateExpenseSummary(expenses) {
    const total = expenses.reduce((acc, value) => acc + value, 0);
    const highest = expenses.length ? Math.max(...expenses) : 0;
    const filteredExpenses = expenses.filter(value => value > 0); // Filter out zeros for minimum calculation
    const lowest = filteredExpenses.length ? Math.min(...filteredExpenses) : 0;

    document.getElementById('total-expense').textContent = `Total Expenses: $${total.toFixed(2)}`;
    document.getElementById('highest-expense').textContent = `Highest Expense: $${highest.toFixed(2)}`;
    document.getElementById('lowest-expense').textContent = `Lowest Expense: $${lowest.toFixed(2)}`;

    console.log("Updated expense summary:", { total, highest, lowest });
}

// Reset chart and summary
function resetChartAndSummary() {
    expenseChart.data.datasets[0].data = Array(categories.length).fill(0);
    expenseChart.update();

    document.getElementById('total-expense').textContent = 'Total Expenses: $0.00';
    document.getElementById('highest-expense').textContent = 'Highest Expense: $0.00';
    document.getElementById('lowest-expense').textContent = 'Lowest Expense: $0.00';

    console.log("Reset chart and summary to default values.");
}

// Logout function
function handleLogout() {
    console.log("Logout button clicked.");
    auth.signOut()
        .then(() => {
            console.log("User logged out successfully.");
            window.location.href = 'login.html';
        })
        .catch((error) => {
            console.error("Error logging out:", error);
        });
}