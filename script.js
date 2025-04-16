let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
let expenseChart = null;
const form = document.getElementById("expenseForm");
const expensesList = document.getElementById("expensesList");
const totalAmountElement = document.getElementById("totalAmount");

// Budget tracking
const budgetMessageElement = document.createElement("div");
budgetMessageElement.className = "budget-message";
document.querySelector(".container").appendChild(budgetMessageElement);

// Adding Search Bar functionality
document.getElementById("searchExpense").addEventListener("input", applyFilters);

/**
 * Feature: Add Expense
 * This function adds a new expense to the list, validates the form data, and stores it in local storage.
 */
form.addEventListener("submit", addExpense);

function addExpense(e) {
    e.preventDefault();

    const name = document.getElementById("expenseName").value.trim();
    const amount = parseFloat(document.getElementById("expenseAmount").value);
    const date = document.getElementById("expenseDate").value;
    const category = document.getElementById("expenseCategory").value;

    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize time to compare date only

    if (selectedDate > today) {
        alert("Future dates are not allowed. Please select today or a past date.");
        return;
    }

    if (name && amount > 0 && date && category) {
        const expense = {
            id: Date.now(),
            name,
            amount,
            date,
            category,
        };

        expenses.push(expense);
        saveToLocalStorage();
        renderExpenses();
        form.reset();
        document.getElementById("expenseCategory").selectedIndex = 0;
    }
}

/**
 * Feature: Apply Filters
 * This function filters expenses based on search query, category, and date range.
 */
function applyFilters() {
    const category = document.getElementById("filterCategory").value;
    const startDate = document.getElementById("filterStartDate").value;
    const endDate = document.getElementById("filterEndDate").value;
    const searchQuery = document.getElementById("searchExpense").value.trim().toLowerCase();

    if (startDate && endDate && startDate > endDate) {
        alert("Start date cannot be after end date.");
        return;
    }

    let filtered = expenses;

    // Filter by search query (name, category, or amount)
    if (searchQuery) {
        filtered = filtered.filter((expense) => {
            return expense.name.toLowerCase().includes(searchQuery) || expense.category.toLowerCase().includes(searchQuery) || expense.amount.toString().includes(searchQuery);
        });
    }

    if (category) {
        filtered = filtered.filter((expense) => expense.category === category);
    }

    if (startDate) {
        filtered = filtered.filter((expense) => expense.date >= startDate);
    }

    if (endDate) {
        filtered = filtered.filter((expense) => expense.date <= endDate);
    }

    renderExpenses(filtered);
    console.log("Filtered results:", filtered);
}

/**
 * Feature: Clear Filters
 * This function clears all filter inputs and shows the unfiltered list of expenses.
 */
function clearFilters() {
    // Clear the values in the filter inputs
    document.getElementById("filterCategory").value = "";
    document.getElementById("filterStartDate").value = "";
    document.getElementById("filterEndDate").value = "";

    // Render the full list of expenses without filters
    renderExpenses(expenses);
}

/**
 * Feature: Render Expenses
 * This function renders the list of expenses and updates the total amount.
 */
function renderExpenses(data = expenses) {
    expensesList.innerHTML = "";
    let total = 0;

    // Sort by date descending
    data.sort((a, b) => new Date(b.date) - new Date(a.date));

    // ✅ Check if there are no items to display
    if (data.length === 0) {
        expensesList.innerHTML = `<p class="text-muted text-center">No expenses match the filters.</p>`;
        totalAmountElement.textContent = "0.00";
        return;
    }

    // Prepare data for chart (Expenses by category)
    const categoryData = {};

    data.forEach((expense) => {
        // Group expenses by category
        categoryData[expense.category] = (categoryData[expense.category] || 0) + expense.amount;
        total += expense.amount;
    });

    // Update total amount
    totalAmountElement.textContent = total.toFixed(2);

    // Create the chart
    createChart(categoryData);

    // Create expense list
    data.forEach((expense) => {
        const expenseElement = document.createElement("div");
        expenseElement.className = "expense-item";

        // Format the date to dd/mm/yyyy
        const formattedDate = formatDate(expense.date);
        const formattedAmount = `₹${expense.amount.toFixed(2)}`;

        const badgeClass = `badge-${expense.category}`;

        expenseElement.innerHTML = `
      <div class="row w-100">
        <div class="col-12 col-md-2 text-muted small mb-1 mb-md-0">${formattedDate}</div>
        <div class="col-12 col-md-3 fw-semibold text-break mb-1 mb-md-0">${expense.name}</div>
        <div class="col-6 col-md-2 mb-1 mb-md-0">
          <span class="badge ${badgeClass}">${expense.category}</span>
        </div>
        <div class="col-6 col-md-3 mb-1 mb-md-0">${formattedAmount}</div>
        <div class="col-12 col-md-2 text-end">
          <span class="delete-btn">✕</span>
        </div>
      </div>
    `;

        const deleteBtn = expenseElement.querySelector(".delete-btn");
        deleteBtn.addEventListener("click", () => {
            if (confirm(`Delete "${expense.name}" for ₹${expense.amount.toFixed(2)}?`)) {
                deleteExpense(expense.id);
            }
        });

        expensesList.appendChild(expenseElement);
    });
}

/**
 * Feature: Create Chart
 * This function generates a pie chart showing expenses by category.
 */
function createChart(categoryData) {
    const ctx = document.getElementById("expensesChart").getContext("2d");

    // ✅ Destroy previous chart instance if it exists
    if (expenseChart !== null) {
        expenseChart.destroy();
    }

    // Create data for the chart
    const labels = Object.keys(categoryData);
    const data = Object.values(categoryData);

    // ✅ Store the chart instance in the global variable
    expenseChart = new Chart(ctx, {
        type: "pie",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Expenses by Category",
                    data: data,
                    backgroundColor: ["#28a745", "#17a2b8", "#ffc107", "#fd7e14", "#6c757d"],
                },
            ],
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: "top",
                },
                tooltip: {
                    callbacks: {
                        label: function (tooltipItem) {
                            return `₹${tooltipItem.raw.toFixed(2)}`;
                        },
                    },
                },
            },
        },
    });
}

/**
 * Helper function to format date to dd/mm/yyyy
 */
function formatDate(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0"); // Ensures two digits for the day
    const month = String(d.getMonth() + 1).padStart(2, "0"); // Gets month (0-indexed)
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
}

/**
 * Feature: Delete Expense
 * This function deletes an expense from the list and local storage.
 */
function deleteExpense(id) {
    expenses = expenses.filter((expense) => expense.id !== id);
    saveToLocalStorage();
    renderExpenses();
}

/**
 * Feature: Save to Local Storage
 * This function saves the current expenses list to local storage.
 */
function saveToLocalStorage() {
    localStorage.setItem("expenses", JSON.stringify(expenses));
}

/**
 * Feature: Save Budget
 * This function saves the user's monthly budget to local storage.
 */
function saveBudget() {
    const budget = parseFloat(document.getElementById("monthlyBudget").value);
    if (budget && budget > 0) {
        localStorage.setItem("monthlyBudget", budget);
        alert("Budget saved successfully!");
        renderExpenses(); // Recalculate after saving
    } else {
        alert("Please enter a valid budget.");
    }
}

/**
 * Feature: Export to CSV
 * This function exports the expenses data as a CSV file.
 */
document.getElementById("exportCSV").addEventListener("click", exportToCSV);

function exportToCSV() {
    const dataToExport = expenses.map((expense) => ({
        Name: expense.name,
        Category: expense.category,
        Amount: expense.amount,
        Date: formatDate(expense.date),
    }));

    // Use PapaParse to convert data into CSV format
    const csv = Papa.unparse(dataToExport);

    // Create a temporary link to download the CSV file
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "expenses.csv";
    link.click();
}

/**
 * Feature: Export to PDF
 * This function exports the expenses data as a PDF file.
 */
document.getElementById("exportPDF").addEventListener("click", exportToPDF);

function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Add title
    doc.text("Expense Report", 20, 20);

    // Add table header
    doc.text("Name", 20, 30);
    doc.text("Category", 60, 30);
    doc.text("Amount", 100, 30);
    doc.text("Date", 140, 30);

    // Add expenses data
    let yPosition = 40;
    expenses.forEach((expense) => {
        doc.text(expense.name, 20, yPosition);
        doc.text(expense.category, 60, yPosition);
        doc.text(`₹${expense.amount.toFixed(2)}`, 100, yPosition);
        doc.text(expense.date, 140, yPosition);
        yPosition += 10;
    });

    // Save the PDF
    doc.save("expenses.pdf");
}

/**
 * Initial render of the expense list and chart
 */
renderExpenses();

/**
 * Feature: Prevent future dates in expense form
 * This function ensures that the user cannot select future dates in the date picker.
 */
const todayDate = new Date().toISOString().split("T")[0];

// For expense form
document.getElementById("expenseDate").setAttribute("max", todayDate);

// ✅ Disable manual typing into date fields
document.querySelectorAll('input[type="date"]').forEach((input) => {
    input.addEventListener("keydown", (e) => e.preventDefault());
});
