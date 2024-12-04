import {
    getDatabase,
    ref,
    get,
    query,
    orderByChild,
    startAt,
    endAt,
    remove,
    update,
    onValue
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const db = getDatabase();
const auth = getAuth();
const accountBalanceDisplay = document.getElementById("budget-amount");

function updateAccountBalanceDisplay(balance) {
    if (accountBalanceDisplay) {
        accountBalanceDisplay.textContent = `Rs. ${balance.toFixed(2)}`;
    }
}

function fetchAccountBalance() {
    const balanceRef = ref(db, `users/${currentUserId}/accountBalance`);
    get(balanceRef).then(snapshot => {
        if (snapshot.exists()) {
            const balance = snapshot.val();
            updateAccountBalanceDisplay(balance);
        } else {
            updateAccountBalanceDisplay(0); // Default to Rs. 0.00 if no balance
        }
    }).catch(error => console.error("Error fetching account balance:", error));
}

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
const creditedTableBody = document.getElementById("credited-table-body");

let currentPage = 1;
const expensesPerPage = 10;
let currentUserId = null;

// Initialize and Fetch Expenses
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserId = user.uid;
        fetchExpenses();
        fetchCreditItems(); // Fetch credit items
        fetchAccountBalance();
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
// Fetch Credit Items
function fetchCreditItems() {
    if (!currentUserId) return;

    const creditsRef = ref(db, `credits/${currentUserId}`);
    get(creditsRef)
        .then((snapshot) => {
            if (snapshot.exists()) {
                const credits = Object.keys(snapshot.val()).map((id) => ({
                    id,
                    ...snapshot.val()[id],
                }));

                // Display credit items
                displayCreditItems(credits);

                // Calculate total credits
                const totalCredits = credits.reduce(
                    (total, credit) => total + parseFloat(credit.amount),
                    0
                );

                // Update the account balance
                updateAccountBalance(totalCredits);
            } else {
                creditedTableBody.innerHTML =
                    '<tr><td colspan="5">No credits to display.</td></tr>';
                updateAccountBalance(0); // If no credits, set credits to 0
            }
        })
        .catch((error) => {
            console.error("Error fetching credits: ", error);
        });
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
async function editExpense(expenseId) {
    const categories = ['food', 'transport', 'education', 'utilities', 'entertainment', 'others'];

    // Reference to the expense in Firebase
    const expenseRef = ref(db, `expenses/${currentUserId}/${expenseId}`);
    const snapshot = await get(expenseRef);

    if (!snapshot.exists()) {
        alert("Expense not found.");
        return;
    }

    const oldExpense = snapshot.val();
    const oldAmount = parseFloat(oldExpense.amount);

    // Get new description
    const newDescription = await prompt("Enter new description:", oldExpense.description);
    if (!newDescription) {
        alert("Description is required.");
        return;
    }

    // Get new amount
    const newAmount = await prompt("Enter new amount:", oldAmount.toString());
    const parsedAmount = parseFloat(newAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
        alert("Amount must be a valid positive number.");
        return;
    }

    // Get new date
    const newDate = await prompt("Enter new date (YYYY-MM-DD):", oldExpense.date);
    if (!isValidDate(newDate)) {
        alert("Please enter a valid date in YYYY-MM-DD format.");
        return;
    }

    // Get new category
    const newCategory = await prompt("Enter new category:", oldExpense.category);
    if (!categories.includes(newCategory.toLowerCase())) {
        alert(`Invalid category. Please choose from: ${categories.join(', ')}`);
        return;
    }

    // Update account balance
    const accountBalanceRef = ref(db, `users/${currentUserId}/accountBalance`);
    const balanceSnapshot = await get(accountBalanceRef);
    const currentBalance = balanceSnapshot.exists() ? balanceSnapshot.val().balance || 0 : 0;

    // Adjust balance based on the difference
    const balanceDifference = oldAmount - parsedAmount;
    const updatedBalance = currentBalance + balanceDifference;

    // Update Firebase
    await Promise.all([
        update(expenseRef, {
            description: newDescription,
            amount: parsedAmount,
            date: newDate,
            category: newCategory.toLowerCase(),
        }),
        update(accountBalanceRef, { balance: updatedBalance }),
    ]);
    // Refresh UI
    fetchExpenses();
    showToast("Expense updated successfully!",3000);
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
// Delete Expense
async function deleteExpense(expenseId) {
    try {
        // Show confirmation dialog and wait for user's response
        const userConfirmed = await new Promise((resolve) => {
            const isConfirmed = confirm("Are you sure you want to delete this expense?");
            resolve(isConfirmed); // Resolve based on the user's choice
        });

        if (!userConfirmed) return; // Exit if the user cancels

        // Reference to the expense in Firebase
        const expenseRef = ref(db, `expenses/${currentUserId}/${expenseId}`);
        const snapshot = await get(expenseRef);

        if (!snapshot.exists()) {
            alert("Expense not found.");
            return;
        }

        const deletedExpense = snapshot.val();
        const deletedAmount = parseFloat(deletedExpense.amount);

        // Reference to the account balance in Firebase
        const accountBalanceRef = ref(db, `users/${currentUserId}/accountBalance`);
        const balanceSnapshot = await get(accountBalanceRef);
        const currentBalance = balanceSnapshot.exists() ? balanceSnapshot.val().balance || 0 : 0;

        // Calculate updated balance
        const updatedBalance = currentBalance + deletedAmount;

        // Update Firebase
        await Promise.all([
            remove(expenseRef), // Delete the expense
            update(accountBalanceRef, { balance: updatedBalance }), // Update account balance
        ]);

        // Refresh UI
        fetchExpenses(); // Refresh expense list
        showToast("Expense deleted successfully!",3000);
    } catch (error) {
        console.error("Error deleting expense or updating balance:", error);
        alert("An error occurred. Please try again.");
    }
}

// Display Credit Items in the Table
function displayCreditItems(credits) {
    creditedTableBody.innerHTML = "";

    credits.forEach((credit) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${credit.date}</td>
            <td>${credit.description}</td>
            <td>Rs. ${credit.amount}</td>
            <td><button class="edit-credit-btn" data-id="${credit.id}">Edit</button></td>
            <td><button class="delete-credit-btn" data-id="${credit.id}">Delete</button></td>
        `;
        creditedTableBody.appendChild(row);
    });

    // Attach event listeners for edit and delete buttons
    document.querySelectorAll(".edit-credit-btn").forEach((button) =>
        button.addEventListener("click", () => editCredit(button.dataset.id))
    );
    document.querySelectorAll(".delete-credit-btn").forEach((button) =>
        button.addEventListener("click", () => deleteCredit(button.dataset.id))
    );
}

// Edit Credit
async function editCredit(creditId) {
    try {
        // Reference to the credit in Firebase
        const creditRef = ref(db, `credits/${currentUserId}/${creditId}`);
        const snapshot = await get(creditRef);

        if (!snapshot.exists()) {
            alert("Credit not found.");
            return;
        }

        const oldCredit = snapshot.val();
        const oldAmount = parseFloat(oldCredit.amount);

        // Get updated details
        const newDescription = await prompt("Enter new description:", oldCredit.description);
        if (!newDescription) {
            alert("Description is required.");
            return;
        }

        const newAmount = await prompt("Enter new amount:", oldAmount.toString());
        const parsedAmount = parseFloat(newAmount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            alert("Amount must be a valid positive number.");
            return;
        }

        const newDate = await prompt("Enter new date (YYYY-MM-DD):", oldCredit.date);
        if (!isValidDate(newDate)) {
            alert("Please enter a valid date in YYYY-MM-DD format.");
            return;
        }

        // Reference to the account balance in Firebase
        const accountBalanceRef = ref(db, `users/${currentUserId}/accountBalance`);
        const balanceSnapshot = await get(accountBalanceRef);
        const currentBalance = balanceSnapshot.exists() ? balanceSnapshot.val().balance || 0 : 0;

        // Adjust balance based on the difference
        const balanceDifference = parsedAmount - oldAmount;
        const updatedBalance = currentBalance + balanceDifference;

        // Update Firebase
        await Promise.all([
            update(creditRef, {
                description: newDescription,
                amount: parsedAmount,
                date: newDate,
            }),
            update(accountBalanceRef, { balance: updatedBalance }),
        ]);

        // Refresh UI
        fetchCreditItems();
        showToast("Credit updated successfully!",3000);
    } catch (error) {
        console.error("Error updating credit or account balance:", error);
        alert("An error occurred. Please try again.");
    }
}


// Delete Credit
async function deleteCredit(creditId) {
    try {
        // Show confirmation dialog and wait for user's response
        const userConfirmed = await new Promise((resolve) => {
            const isConfirmed = confirm("Are you sure you want to delete this credit?");
            resolve(isConfirmed); // Resolve based on the user's choice
        });

        if (!userConfirmed) return; // Exit if the user cancels

        // Reference to the credit in Firebase
        const creditRef = ref(db, `credits/${currentUserId}/${creditId}`);
        const snapshot = await get(creditRef);

        if (!snapshot.exists()) {
            alert("Credit not found.");
            return;
        }

        const deletedCredit = snapshot.val();
        const deletedAmount = parseFloat(deletedCredit.amount);

        // Reference to the account balance in Firebase
        const accountBalanceRef = ref(db, `users/${currentUserId}/accountBalance`);
        const balanceSnapshot = await get(accountBalanceRef);
        const currentBalance = balanceSnapshot.exists() ? balanceSnapshot.val().balance || 0 : 0;

        // Calculate updated balance
        const updatedBalance = currentBalance - deletedAmount;

        // Update Firebase
        await Promise.all([
            remove(creditRef), // Delete the credit
            update(accountBalanceRef, { balance: updatedBalance }), // Update account balance
        ]);

        // Refresh UI
        fetchCreditItems(); // Refresh credit list
        showToast("Credit deleted successfully!",3000);
    } catch (error) {
        console.error("Error deleting credit or updating balance:", error);
        alert("An error occurred. Please try again.");
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