import { auth, database } from './firebase.js';
import { ref, set, push, onValue, get, update } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

window.onload = function () {
    const accountBalanceDisplay = document.getElementById('budget-amount');

    // Ensure DOM elements exist
    if (!accountBalanceDisplay) {
        console.error("'budget-amount' is missing in the DOM.");
        return;
    }

    // Authentication state listener
    auth.onAuthStateChanged(user => {
        if (user) {
            console.log("User authenticated:", user);

            // Fetch and update account balance
            const accountBalanceRef = ref(database, `users/${user.uid}/accountBalance`);
            onValue(accountBalanceRef, snapshot => {
                const accountBalanceData = snapshot.val();
                console.log("Fetched account balance:", accountBalanceData);

                // Handle nested structure
                const currentBalance = accountBalanceData?.balance || 0; // Access the nested 'balance' key
                accountBalanceDisplay.textContent = `Rs. ${parseFloat(currentBalance).toFixed(2)}`;
            });

            // Handle money credited
            document.getElementById('credit-form').addEventListener('submit', async function (event) {
                event.preventDefault();

                const creditAmount = parseFloat(document.getElementById('credit-amount').value);
                const creditDescription = document.getElementById('credit-description').value.trim();
                const creditDate = document.getElementById('credit-date').value;

                if (!creditDescription || isNaN(creditAmount) || creditAmount <= 0 || !creditDate) {
                    alert("Please enter valid credit details.");
                    return;
                }

                try {
                    const snapshot = await get(accountBalanceRef);
                    const currentBalance = snapshot.exists() ? snapshot.val().balance || 0 : 0;

                    const newBalance = currentBalance + creditAmount;
                    // Add the credit item to Firebase
                    const creditRef = push(ref(database, `credits/${user.uid}`));
                    await set(creditRef, {
                        amount: creditAmount,
                        description: creditDescription,
                        date: creditDate
                    });

                    await set(accountBalanceRef, { balance: newBalance }); // Update nested balance

                    // Update UI
                    accountBalanceDisplay.textContent = `Rs. ${newBalance.toFixed(2)}`;
                    document.getElementById('credit-form').reset();
                    console.log("Money credited successfully. New balance:", newBalance);
                } catch (error) {
                    console.error("Error crediting money:", error);
                }
            });

            // Add expense with account balance check
            document.getElementById('add-expense-form').addEventListener('submit', async function (event) {
                event.preventDefault();

                const expenseAmount = parseFloat(document.getElementById('expense-amount').value);
                const expenseCategory = document.getElementById('expense-category').value;
                const expenseDescription = document.getElementById('expense-description').value.trim();
                const expenseDate = document.getElementById('expense-date').value;

                if (!expenseCategory || !expenseDescription || isNaN(expenseAmount) || expenseAmount <= 0 || !expenseDate) {
                    alert("Please enter valid expense details.");
                    return;
                }

                try {
                    const snapshot = await get(accountBalanceRef);
                    const currentBalance = snapshot.exists() ? snapshot.val().balance || 0 : 0;

                    // Check if account balance is sufficient
                    if (expenseAmount > currentBalance) {
                        alert(`Insufficient Balance! Your current balance is Rs. ${currentBalance.toFixed(2)}.`);
                        return;
                    }

                    const newBalance = currentBalance - expenseAmount;
                    await update(accountBalanceRef, { balance: newBalance }); // Update nested balance

                    // Save the expense to Firebase
                    const expenseRef = push(ref(database, `expenses/${user.uid}`));
                    await set(expenseRef, {
                        amount: expenseAmount,
                        description: expenseDescription,
                        date: expenseDate,
                        category: expenseCategory
                    });

                    // Update UI
                    accountBalanceDisplay.textContent = `Rs. ${newBalance.toFixed(2)}`;
                    document.getElementById('add-expense-form').reset();
                    console.log("Expense added successfully. Updated balance:", newBalance);
                } catch (error) {
                    console.error("Error adding expense or updating balance:", error);
                }
            });

        } else {
            console.warn("No user is logged in.");
            accountBalanceDisplay.textContent = 'Rs. 0.00';
        }
    });

    // Fetch expense summary
    auth.onAuthStateChanged(user => {
        if (user) {
            const expensesRef = ref(database, `expenses/${user.uid}`);
            onValue(expensesRef, snapshot => {
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
                document.getElementById('food-expense').textContent = `Rs. ${categoryTotals.food.toFixed(2)}`;
                document.getElementById('transport-expense').textContent = `Rs. ${categoryTotals.transport.toFixed(2)}`;
                document.getElementById('utilities-expense').textContent = `Rs. ${categoryTotals.utilities.toFixed(2)}`;
                document.getElementById('entertainment-expense').textContent = `Rs. ${categoryTotals.entertainment.toFixed(2)}`;
                document.getElementById('education-expense').textContent = `Rs. ${categoryTotals.education.toFixed(2)}`;
                document.getElementById('others-expense').textContent = `Rs. ${categoryTotals.others.toFixed(2)}`;
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
