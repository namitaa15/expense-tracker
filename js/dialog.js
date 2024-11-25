// Select DOM elements
const dialogContainer = document.getElementById('custom-dialog');
const dialogTitle = document.getElementById('dialog-title');
const dialogMessage = document.getElementById('dialog-message');
const dialogInput = document.getElementById('dialog-input');
const dialogOkButton = document.getElementById('dialog-ok');
const dialogCancelButton = document.getElementById('dialog-cancel');

// Helper variable to control dialog flow
let isDialogActive = false;

// Function to show custom alert
window.alert = function (message) {
    dialogContainer.className = 'dialog-container alert'; // Add 'alert' class
    return new Promise((resolve) => {
        if (isDialogActive) return; // Prevent multiple dialogs
        isDialogActive = true;

        dialogTitle.textContent = 'Alert';
        dialogMessage.textContent = message;
        dialogInput.classList.add('hidden'); // Hide input for alerts
        dialogCancelButton.classList.add('hidden'); // Hide cancel button
        dialogContainer.classList.remove('hidden');

        const handleOk = () => {
            dialogContainer.classList.add('hidden');
            cleanup();
            resolve(true);
        };

        // Attach event listener
        dialogOkButton.addEventListener('click', handleOk);

        // Cleanup function
        function cleanup() {
            dialogOkButton.removeEventListener('click', handleOk);
            isDialogActive = false;
        }
    });
};

// Function to show custom confirm
window.confirm = function (message) {
    return new Promise((resolve) => {
        if (isDialogActive) return; // Prevent multiple dialogs
        isDialogActive = true;

        dialogTitle.textContent = 'Confirm';
        dialogMessage.textContent = message;
        dialogInput.classList.add('hidden'); // Hide input for confirm
        dialogCancelButton.classList.remove('hidden'); // Show cancel button
        dialogContainer.classList.remove('hidden');

        const handleOk = () => {
            dialogContainer.classList.add('hidden');
            cleanup();
            resolve(true); // User clicked OK
        };

        const handleCancel = () => {
            dialogContainer.classList.add('hidden');
            cleanup();
            resolve(false); // User clicked Cancel
        };

        // Attach event listeners
        dialogOkButton.addEventListener('click', handleOk);
        dialogCancelButton.addEventListener('click', handleCancel);

        // Cleanup function
        function cleanup() {
            dialogOkButton.removeEventListener('click', handleOk);
            dialogCancelButton.removeEventListener('click', handleCancel);
            isDialogActive = false;
        }
    });
};

// Function to show custom prompt
window.prompt = function (message) {
    return new Promise((resolve) => {
        if (isDialogActive) return; // Prevent multiple dialogs
        isDialogActive = true;

        dialogTitle.textContent = 'Prompt';
        dialogMessage.textContent = message;
        dialogInput.classList.remove('hidden'); // Show input for prompt
        dialogCancelButton.classList.remove('hidden'); // Show cancel button
        dialogContainer.classList.remove('hidden');
        dialogInput.value = ''; // Clear input field
        dialogInput.focus(); // Focus on input field

        const handleOk = () => {
            const inputValue = dialogInput.value.trim();
            dialogContainer.classList.add('hidden');
            cleanup();
            resolve(inputValue || null); // Resolve with input value or null if empty
        };

        const handleCancel = () => {
            dialogContainer.classList.add('hidden');
            cleanup();
            resolve(null); // User clicked Cancel
        };

        // Attach event listeners
        dialogOkButton.addEventListener('click', handleOk);
        dialogCancelButton.addEventListener('click', handleCancel);

        // Cleanup function
        function cleanup() {
            dialogOkButton.removeEventListener('click', handleOk);
            dialogCancelButton.removeEventListener('click', handleCancel);
            isDialogActive = false;
        }
    });
};