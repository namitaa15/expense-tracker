import {
    getDatabase,
    ref,
    get,
    query,
    orderByChild,
    startAt,
    endAt,
    remove,
    update
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const db = getDatabase();
const auth = getAuth();

// DOM Elements
const expenseTableBody = document.getElementById("expense-table-body");
const totalExpenseDisplay = document.getElementById("total-expense");
const expenseByCategoryList = document.getElementById("expense-by-category");
const searchBar = document.getElementById("search-bar");
const categoryFilter = document.getElementById("category-filter");
const dateSortSelect = document.getElementById("date-sort");
const amountSortSelect = document.getElementById("amount-sort");
const prevPageButton = document.getElementById("prev-page");
const nextPageButton = document.getElementById("next-page");
const currentPageDisplay = document.getElementById("current-page");
const startDateInput = document.getElementById("start-date");
const endDateInput = document.getElementById("end-date");
const filterByDateButton = document.getElementById("filter-by-date");

let currentPage = 1;
const expensesPerPage = 10;
let currentUserId = null;

// Initialize and Fetch Expenses
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserId = user.uid;
        fetchExpenses();
    } else {
        alert("You are not logged in. Redirecting to login page...");
        window.location.href = "login.html";
    }
});

// Fetch Expenses from Firebase
function fetchExpenses() {
    if (!currentUserId) return;

    const expensesRef = ref(db, `expenses/${currentUserId}`);
    get(expensesRef)
        .then((snapshot) => {
            if (snapshot.exists()) {
                let expenses = Object.keys(snapshot.val()).map((id) => ({
                    id,
                    ...snapshot.val()[id],
                }));

                // Apply filters
                expenses = applySearchFilter(expenses);
                expenses = applyCategoryFilter(expenses);
                expenses = applyDateSort(expenses);
                expenses = applyAmountSort(expenses);

                displayExpenses(expenses);
                displaySummary(expenses);
            } else {
                expenseTableBody.innerHTML = '<tr><td colspan="6">No expenses to display.</td></tr>';
                totalExpenseDisplay.textContent = "Total Expense: Rs. 0.00";
                expenseByCategoryList.innerHTML = "";
            }
        })
        .catch((error) => console.error("Error fetching expenses: ", error));
}

// Apply Search Filter
function applySearchFilter(expenses) {
    const searchTerm = searchBar.value.toLowerCase().trim();
    if (searchTerm) {
        return expenses.filter(
            (expense) =>
                expense.description.toLowerCase().includes(searchTerm) ||
                expense.category.toLowerCase().includes(searchTerm)
        );
    }
    return expenses;
}

// Apply Category Filter
function applyCategoryFilter(expenses) {
    const selectedCategory = categoryFilter.value;
    if (selectedCategory) {
        return expenses.filter((expense) => expense.category === selectedCategory);
    }
    return expenses;
}

// Apply Date Sort
function applyDateSort(expenses) {
    const sortOrder = dateSortSelect.value;
    if (sortOrder) {
        return expenses.sort((a, b) =>
            sortOrder === "asc"
                ? new Date(a.date) - new Date(b.date)
                : new Date(b.date) - new Date(a.date)
        );
    }
    return expenses;
}

// Apply Amount Sort
function applyAmountSort(expenses) {
    const sortOrder = amountSortSelect.value;
    if (sortOrder) {
        return expenses.sort((a, b) =>
            sortOrder === "asc" ? a.amount - b.amount : b.amount - a.amount
        );
    }
    return expenses;
}

// Display Expenses in the Table
function displayExpenses(expenses) {
    expenseTableBody.innerHTML = "";
    const startIndex = (currentPage - 1) * expensesPerPage;
    const endIndex = startIndex + expensesPerPage;
    const paginatedExpenses = expenses.slice(startIndex, endIndex);

    paginatedExpenses.forEach((expense) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${expense.date}</td>
            <td>${expense.description}</td>
            <td>${expense.category}</td>
            <td>Rs. ${expense.amount}</td>
            <td><button class="edit-btn" data-id="${expense.id}">Edit</button></td>
            <td><button class="delete-btn" data-id="${expense.id}">Delete</button></td>
        `;
        expenseTableBody.appendChild(row);
    });

    // Attach event listeners for edit and delete buttons
    document.querySelectorAll(".edit-btn").forEach((button) =>
        button.addEventListener("click", () => editExpense(button.dataset.id))
    );
    document.querySelectorAll(".delete-btn").forEach((button) =>
        button.addEventListener("click", () => deleteExpense(button.dataset.id))
    );

    updatePagination(expenses.length);
}

// Update Pagination Buttons
function updatePagination(totalExpenses) {
    const totalPages = Math.ceil(totalExpenses / expensesPerPage);
    currentPageDisplay.textContent = `Page ${currentPage}`;
    prevPageButton.disabled = currentPage === 1;
    nextPageButton.disabled = currentPage === totalPages;
}

// Display Expense Summary
function displaySummary(expenses) {
    const totalExpense = expenses.reduce(
        (total, expense) => total + parseFloat(expense.amount),
        0
    );
    totalExpenseDisplay.textContent = `Total Expense: Rs. ${totalExpense.toFixed(2)}`;

    const categoryBreakdown = {};
    expenses.forEach((expense) => {
        if (!categoryBreakdown[expense.category]) {
            categoryBreakdown[expense.category] = 0;
        }
        categoryBreakdown[expense.category] += parseFloat(expense.amount);
    });

    expenseByCategoryList.innerHTML = "";
    for (const [category, amount] of Object.entries(categoryBreakdown)) {
        const listItem = document.createElement("li");
        listItem.textContent = `${category}: Rs. ${amount.toFixed(2)}`;
        expenseByCategoryList.appendChild(listItem);
    }
}

// Edit Expense
// Edit Expense
async function editExpense(expenseId) {
    const categories = ['food', 'transport', 'education', 'utilities', 'entertainment', 'others'];

    // Get new description
    const newDescription = await prompt("Enter new description:");
    if (!newDescription) {
        await alert("Description is required.");
        return;
    }

    // Get new amount
    const newAmount = await prompt("Enter new amount:");
    if (!newAmount) {
        await alert("Amount is required.");
        return;
    }
    const parsedAmount = parseFloat(newAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
        await alert("Amount must be a valid positive number.");
        return;
    }

    // Get new date
    const newDate = await prompt("Enter new date (YYYY-MM-DD):");
    if (!newDate) {
        await alert("Please enter the date.");
        return;
    }
    if (!isValidDate(newDate)) {
        await alert("Please enter a valid date in YYYY-MM-DD format.");
        return;
    }

    // Get new category
    const newCategory = await prompt("Enter new category (e.g., food, transport, etc.):");
    if (!newCategory) {
        await alert("Category is required.");
        return;
    }
    if (!categories.includes(newCategory.toLowerCase())) {
        await alert(`Invalid category. Please choose from: ${categories.join(', ')}`);
        return;
    }

    // Update the expense in the database
    const expenseRef = ref(db, `expenses/${currentUserId}/${expenseId}`);
    update(expenseRef, {
        description: newDescription,
        amount: parsedAmount,
        date: newDate,
        category: newCategory.toLowerCase(),
    })
        .then(fetchExpenses)
        .catch((error) => console.error("Error updating expense: ", error));
}

// Helper function to validate date format and ensure it's a valid calendar date
function isValidDate(date) {
    // Check basic format YYYY-MM-DD
    const regex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
    if (!regex.test(date)) {
        return false; // Invalid format
    }

    // Parse date parts
    const [year, month, day] = date.split('-').map(Number);

    // Check for valid date using JavaScript Date object
    const testDate = new Date(year, month - 1, day); // JavaScript months are 0-based
    return (
        testDate.getFullYear() === year &&
        testDate.getMonth() === month - 1 &&
        testDate.getDate() === day
    );
}



// Delete Expense
async function deleteExpense(expenseId) {
    const userConfirmed = await confirm("Are you sure you want to delete this expense?");
    if (userConfirmed) {
        const expenseRef = ref(db, `expenses/${currentUserId}/${expenseId}`);
        remove(expenseRef)
            .then(fetchExpenses)
            .catch((error) => console.error("Error deleting expense: ", error));
    }
}


// Filter Expenses by Date Range
filterByDateButton.addEventListener("click", () => {
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;

    if (!startDate && !endDate) {
        fetchExpenses();
        return;
    }

    const expensesRef = ref(db, `expenses/${currentUserId}`);
    get(expensesRef)
        .then((snapshot) => {
            if (snapshot.exists()) {
                let expenses = Object.keys(snapshot.val()).map((id) => ({
                    id,
                    ...snapshot.val()[id],
                }));

                expenses = expenses.filter((expense) => {
                    const expenseDate = new Date(expense.date);
                    return (!startDate || new Date(startDate) <= expenseDate) &&
                           (!endDate || new Date(endDate) >= expenseDate);
                });

                displayExpenses(expenses);
                displaySummary(expenses);
            }
        })
        .catch((error) => console.error("Error filtering expenses: ", error));
});

// Event Listeners
searchBar.addEventListener("input", fetchExpenses);
categoryFilter.addEventListener("change", fetchExpenses);
dateSortSelect.addEventListener("change", fetchExpenses);
amountSortSelect.addEventListener("change", fetchExpenses);
prevPageButton.addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        fetchExpenses();
    }
});
nextPageButton.addEventListener("click", () => {
    currentPage++;
    fetchExpenses();
});
