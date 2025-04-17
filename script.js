// Cleaned and improved version of your expense tracker script

let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
let expenseChart = null;
let currentlyRenderedExpenses = [];

const form = document.getElementById("expenseForm");
const expensesList = document.getElementById("expensesList");
const totalAmountElement = document.getElementById("totalAmount");

// Budget tracking
const budgetMessageElement = document.createElement("div");
budgetMessageElement.className = "budget-message mt-3 fw-bold";
document.querySelector(".container").appendChild(budgetMessageElement);

// Search input
document
  .getElementById("searchExpense")
  .addEventListener("input", applyFilters);

document.getElementById("exportCSV").addEventListener("click", exportToCSV);
document.getElementById("exportPDF").addEventListener("click", exportToPDF);

form.addEventListener("submit", addExpense);

function addExpense(e) {
  e.preventDefault();

  const name = document.getElementById("expenseName").value.trim();
  const amount = parseFloat(document.getElementById("expenseAmount").value);
  const date = document.getElementById("expenseDate").value;
  const category = document.getElementById("expenseCategory").value;

  if (!name || !amount || amount <= 0 || !date || !category) {
    alert("Please enter valid expense details.");
    return;
  }

  const selectedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (selectedDate > today) {
    alert("Future dates are not allowed.");
    return;
  }

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

function applyFilters() {
  const category = document.getElementById("filterCategory").value;
  const startDate = document.getElementById("filterStartDate").value;
  const endDate = document.getElementById("filterEndDate").value;
  const searchQuery = document
    .getElementById("searchExpense")
    .value.trim()
    .toLowerCase();

  if (startDate && endDate && startDate > endDate) {
    alert("Start date cannot be after end date.");
    return;
  }

  let filtered = expenses.filter((expense) => {
    const matchesSearch =
      expense.name.toLowerCase().includes(searchQuery) ||
      expense.category.toLowerCase().includes(searchQuery) ||
      expense.amount.toString().includes(searchQuery);
    const matchesCategory = !category || expense.category === category;
    const matchesStart = !startDate || expense.date >= startDate;
    const matchesEnd = !endDate || expense.date <= endDate;

    return matchesSearch && matchesCategory && matchesStart && matchesEnd;
  });

  renderExpenses(filtered);
}

function clearFilters() {
  document.getElementById("filterCategory").value = "";
  document.getElementById("filterStartDate").value = "";
  document.getElementById("filterEndDate").value = "";
  renderExpenses(expenses);
}

function renderExpenses(data = expenses) {
  expensesList.innerHTML = "";
  currentlyRenderedExpenses = data;

  let total = 0;
  const categoryData = {};

  data.sort((a, b) => new Date(b.date) - new Date(a.date));

  if (data.length === 0) {
    expensesList.innerHTML = `<p class="text-muted text-center">No expenses match the filters.</p>`;
    totalAmountElement.textContent = "0.00";
    budgetMessageElement.textContent = "";
    return;
  }

  data.forEach((expense) => {
    categoryData[expense.category] =
      (categoryData[expense.category] || 0) + expense.amount;
    total += expense.amount;
  });

  totalAmountElement.textContent = total.toFixed(2);
  renderBudgetFeedback(total);
  createChart(categoryData);

  data.forEach((expense) => {
    const expenseElement = document.createElement("div");
    expenseElement.className = "expense-item";
    const badgeClass = `badge-${expense.category}`;

    expenseElement.innerHTML = `
        <div class="row w-100">
            <div class="col-12 col-md-2 text-muted small">${formatDate(
              expense.date
            )}</div>
            <div class="col-12 col-md-3 fw-semibold text-break">${
              expense.name
            }</div>
            <div class="col-6 col-md-2">
                <span class="badge ${badgeClass}">${expense.category}</span>
            </div>
            <div class="col-6 col-md-3">₹${expense.amount.toFixed(2)}</div>
            <div class="col-12 col-md-2 text-end">
                <span class="delete-btn">✕</span>
            </div>
        </div>`;

    expenseElement
      .querySelector(".delete-btn")
      .addEventListener("click", () => {
        if (
          confirm(
            `Delete \"${expense.name}\" for ₹${expense.amount.toFixed(2)}?`
          )
        ) {
          deleteExpense(expense.id);
        }
      });

    expensesList.appendChild(expenseElement);
  });
}

function createChart(categoryData) {
  const ctx = document.getElementById("expensesChart").getContext("2d");
  if (expenseChart) expenseChart.destroy();

  const labels = Object.keys(categoryData);
  const data = Object.values(categoryData);
  const colors = ["#28a745", "#17a2b8", "#ffc107", "#fd7e14", "#6c757d"];

  expenseChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels,
      datasets: [
        {
          label: "Expenses by Category",
          data,
          backgroundColor: labels.map((_, i) => colors[i % colors.length]),
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "top" },
        tooltip: {
          callbacks: {
            label: (tooltipItem) => `₹${tooltipItem.raw.toFixed(2)}`,
          },
        },
      },
    },
  });
}

function formatDate(date) {
  const d = new Date(date);
  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1
  ).padStart(2, "0")}/${d.getFullYear()}`;
}

function deleteExpense(id) {
  expenses = expenses.filter((exp) => exp.id !== id);
  saveToLocalStorage();
  renderExpenses();
}

function saveToLocalStorage() {
  localStorage.setItem("expenses", JSON.stringify(expenses));
}

function saveBudget() {
  const budget = parseFloat(document.getElementById("monthlyBudget").value);
  if (budget && budget > 0) {
    localStorage.setItem("monthlyBudget", budget);
    alert("Budget saved successfully!");
    renderExpenses();
  } else {
    alert("Please enter a valid budget.");
  }
}

function renderBudgetFeedback(total) {
  const budget = parseFloat(localStorage.getItem("monthlyBudget") || 0);
  if (!budget) {
    budgetMessageElement.textContent = "";
    return;
  }
  const diff = budget - total;
  budgetMessageElement.textContent =
    diff >= 0
      ? `Remaining Budget: ₹${diff.toFixed(2)}`
      : `Over Budget by ₹${Math.abs(diff).toFixed(2)}`;
  budgetMessageElement.classList.toggle("text-danger", diff < 0);
  budgetMessageElement.classList.toggle("text-success", diff >= 0);
}

function exportToCSV() {
  const csvData = currentlyRenderedExpenses.map((exp) => ({
    Name: exp.name,
    Category: exp.category,
    Amount: exp.amount,
    Date: formatDate(exp.date),
  }));
  const csv = Papa.unparse(csvData);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "expenses.csv";
  link.click();
}

function exportToPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text("Expense Report", 20, 20);
  doc.text("Name", 20, 30);
  doc.text("Category", 60, 30);
  doc.text("Amount", 100, 30);
  doc.text("Date", 140, 30);

  let y = 40;
  currentlyRenderedExpenses.forEach((exp) => {
    doc.text(exp.name, 20, y);
    doc.text(exp.category, 60, y);
    doc.text(`₹${exp.amount.toFixed(2)}`, 100, y);
    doc.text(formatDate(exp.date), 140, y);
    y += 10;
  });

  doc.save("expenses.pdf");
}

// Initial render
renderExpenses();

// Disable manual typing for date fields
const todayDate = new Date().toISOString().split("T")[0];
document.getElementById("expenseDate").setAttribute("max", todayDate);
document.querySelectorAll('input[type="date"]').forEach((input) => {
  input.addEventListener("keydown", (e) => e.preventDefault());
});
