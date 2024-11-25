import { auth, database } from './firebase.js';
import { ref, set, push, onValue } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

window.onload = function () {
    const budgetDisplay = document.getElementById('monthly-budget-display');
    const budgetWarning = document.getElementById('budget-warning');

    // Authentication state listener
    auth.onAuthStateChanged(user => {
        if (user) {
            console.log("User authenticated:", user);

            // Fetch user's budget from Firebase
            const userBudgetRef = ref(database, `users/${user.uid}/budget`);
            onValue(userBudgetRef, snapshot => {
                const budget = snapshot.val();
                budgetDisplay.textContent = budget
                    ? `Current Budget: $${parseFloat(budget).toFixed(2)}`
                    : 'Current Budget: $0.00';
            });
        } else {
            console.warn("No user is logged in.");
            budgetDisplay.textContent = 'Current Budget: $0.00';
        }
    });

    // Save monthly budget
    document.getElementById('save-budget-btn').addEventListener('click', async function () {
        const budgetInput = document.getElementById('monthly-budget-input');
        const budget = parseFloat(budgetInput.value);

        if (isNaN(budget) || budget <= 0) {
            budgetWarning.textContent = 'Please enter a valid budget.';
        } else {
            budgetWarning.textContent = '';
            const user = auth.currentUser;

            if (user) {
                try {
                    const userBudgetRef = ref(database, `users/${user.uid}/budget`);
                    await set(userBudgetRef, budget);
                    budgetDisplay.textContent = `Current Budget: $${budget.toFixed(2)}`;
                    console.log("Budget saved successfully.");
                } catch (error) {
                    console.error("Error saving budget:", error);
                }
            } else {
                console.warn("No user is logged in.");
            }
        }
    });
    function calculateTotalExpenses() {
        const categories = ['food', 'transport', 'utilities', 'entertainment', 'education', 'others'];
        let totalExpenses = 0;
    
        categories.forEach(category => {
            const expenseElement = document.getElementById(`${category}-expense`);
            const expenseValue = parseFloat(expenseElement.textContent.replace('$', '')) || 0;
            totalExpenses += expenseValue;
        });
    
        return totalExpenses;
    }
    

    // Add expense
    document.getElementById('add-expense-form').addEventListener('submit', async function (event) {
        event.preventDefault();
    
        const expenseAmount = parseFloat(document.getElementById('expense-amount').value) || 0;
        const expenseCategory = document.getElementById('expense-category').value;
    
        const budgetDisplay = document.getElementById('monthly-budget-display');
        const currentBudget = parseFloat(budgetDisplay.textContent.replace('Current Budget: $', '')) || 0;
    
        // Calculate current total expenses
        const currentTotalExpenses = calculateTotalExpenses();
    
        // Check if budget exceeds
        if (currentTotalExpenses + expenseAmount > currentBudget) {
            alert(`Budget Overflow! Your total expenses will exceed the budget of $${currentBudget.toFixed(2)}.`);
            return;
        }
    
        // Proceed with adding the expense
        const expenseDescription = document.getElementById('expense-description').value;
        const expenseDate = document.getElementById('expense-date').value;
    
        const user = auth.currentUser;
        if (!user) {
            console.error("No user is logged in.");
            return;
        }
    
        try {
            const expenseRef = push(ref(database, `expenses/${user.uid}`));
            await set(expenseRef, {
                amount: expenseAmount,
                description: expenseDescription,
                date: expenseDate,
                category: expenseCategory
            });
            document.getElementById('add-expense-form').reset();
            console.log("Expense added successfully.");
        } catch (error) {
            console.error("Error adding expense:", error);
        }
    });

    // Fetch expense summary
    auth.onAuthStateChanged(user => {
        if (user) {
            const expensesRef = ref(database, `expenses/${user.uid}`);
            onValue(expensesRef, (snapshot) => {
                const expenses = snapshot.val();
                const categoryTotals = {
                    food: 0,
                    transport: 0,
                    utilities: 0,
                    entertainment: 0,
                    education: 0,
                    others: 0
                };

                if (expenses) {
                    Object.values(expenses).forEach(expense => {
                        if (expense.category in categoryTotals) {
                            categoryTotals[expense.category] += parseFloat(expense.amount);
                        }
                    });
                }

                // Update expense summary table
                document.getElementById('food-expense').textContent = `$${categoryTotals.food.toFixed(2)}`;
                document.getElementById('transport-expense').textContent = `$${categoryTotals.transport.toFixed(2)}`;
                document.getElementById('utilities-expense').textContent = `$${categoryTotals.utilities.toFixed(2)}`;
                document.getElementById('entertainment-expense').textContent = `$${categoryTotals.entertainment.toFixed(2)}`;
                document.getElementById('education-expense').textContent = `$${categoryTotals.education.toFixed(2)}`;
                document.getElementById('others-expense').textContent = `$${categoryTotals.others.toFixed(2)}`;
            });
        }
    });
};

// Logout function
function logout() {
    auth.signOut().then(() => {
        console.log("User logged out successfully.");
        window.location.href = 'login.html';
    }).catch(error => {
        console.error("Error logging out:", error);
    });
}

document.getElementById('logout-link').addEventListener('click', logout);