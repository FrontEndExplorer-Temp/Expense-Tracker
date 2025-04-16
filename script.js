let expenses = JSON.parse(localStorage.getItem("expenses")) || [];

const form = document.getElementById("expenseForm");
const expensesList = document.getElementById("expensesList");
const totalAmountElement = document.getElementById("totalAmount");

form.addEventListener("submit", addExpense);

function addExpense(e) {
  e.preventDefault();

  const name = document.getElementById("expenseName").value;
  const amount = parseFloat(document.getElementById("expenseAmount").value);
  const date = document.getElementById("expenseDate").value;

  if (name && amount && date) {
    const expense = {
      id: new Date().getTime(),
      name,
      amount,
      date,
    };

    expenses.push(expense);
    saveToLocalStorage();
    renderExpenses();
    form.reset();
  }
}

function renderExpenses() {
  expensesList.innerHTML = "";
  let total = 0;

  expenses.forEach((expense) => {
    const expenseElement = document.createElement("div");
    expenseElement.className = "expense-item";
    expenseElement.innerHTML = `
            <div>${expense.date}</div>
            <div>${expense.name}</div>
            <div>₹${expense.amount}</div>
            <div class="delete-btn" onclick="deleteExpense(${expense.id})">✕</div>
        `;

    expensesList.appendChild(expenseElement);
    total += expense.amount;
  });

  totalAmountElement.textContent = total.toFixed(2);
}

function deleteExpense(id) {
  expenses = expenses.filter((expense) => expence.id !== id);
  saveToLocalStorage();
  renderExpenses();
}

function saveToLocalStorage() {
  localStorage.setItem("expenses", JSON.stringify(expenses));
}

// Initial render
renderExpenses();
