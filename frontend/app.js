const API_BASE_URL = window.__APP_CONFIG__.API_BASE_URL;
const tokenKey = "moneytracker_access_token";

const registerForm = document.getElementById("register-form");
const loginForm = document.getElementById("login-form");
const expenseForm = document.getElementById("expense-form");
const appSection = document.getElementById("app-section");
const tableBody = document.getElementById("expense-table-body");
const statsList = document.getElementById("stats-list");
const messageEl = document.getElementById("message");

function getToken() {
  return localStorage.getItem(tokenKey);
}

function setMessage(text, ok = true) {
  messageEl.textContent = text;
  messageEl.className = ok ? "ok" : "error";
}

async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let detail = `Request failed: ${response.status}`;
    try {
      const data = await response.json();
      detail = data.detail || JSON.stringify(data);
    } catch (error) {
      // Fallback to generic message if backend error is not JSON.
    }
    throw new Error(detail);
  }

  if (response.status === 204) {
    return null;
  }
  return response.json();
}

async function register(event) {
  event.preventDefault();
  const fd = new FormData(registerForm);
  try {
    await request("/auth/register", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(fd.entries())),
    });
    setMessage("Dang ky thanh cong. Hay dang nhap.", true);
    registerForm.reset();
  } catch (error) {
    setMessage(error.message, false);
  }
}

async function login(event) {
  event.preventDefault();
  const fd = new FormData(loginForm);
  try {
    const data = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(fd.entries())),
    });
    localStorage.setItem(tokenKey, data.access);
    setMessage("Dang nhap thanh cong.", true);
    appSection.style.display = "block";
    await loadExpenses();
    await loadStats("month");
  } catch (error) {
    setMessage(error.message, false);
  }
}

function fillExpenseForm(expense) {
  expenseForm.id.value = expense.id;
  expenseForm.title.value = expense.title;
  expenseForm.category.value = expense.category;
  expenseForm.amount.value = expense.amount;
  expenseForm.spent_at.value = expense.spent_at;
  expenseForm.note.value = expense.note || "";
}

async function saveExpense(event) {
  event.preventDefault();
  const fd = new FormData(expenseForm);
  const data = Object.fromEntries(fd.entries());
  const id = data.id;
  delete data.id;

  try {
    if (id) {
      await request(`/expenses/${id}/`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      setMessage("Cap nhat thanh cong.", true);
    } else {
      await request("/expenses/", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setMessage("Them moi thanh cong.", true);
    }

    expenseForm.reset();
    expenseForm.id.value = "";
    await loadExpenses();
    await loadStats("month");
  } catch (error) {
    setMessage(error.message, false);
  }
}

function expenseRow(expense) {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${expense.title}</td>
    <td>${expense.category}</td>
    <td>${expense.amount}</td>
    <td>${expense.spent_at}</td>
    <td>${expense.note || ""}</td>
    <td class="row-actions">
      <button data-action="edit" data-id="${expense.id}">Sua</button>
      <button data-action="delete" data-id="${expense.id}">Xoa</button>
    </td>
  `;
  return tr;
}

async function loadExpenses() {
  const q = document.getElementById("filter-q").value.trim();
  const category = document.getElementById("filter-category").value.trim();
  const from = document.getElementById("filter-from").value;
  const to = document.getElementById("filter-to").value;

  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (category) params.set("category", category);
  if (from) params.set("date_from", from);
  if (to) params.set("date_to", to);

  const path = params.toString() ? `/expenses/?${params.toString()}` : "/expenses/";

  try {
    const expenses = await request(path);
    tableBody.innerHTML = "";
    expenses.forEach((item) => tableBody.appendChild(expenseRow(item)));
  } catch (error) {
    setMessage(error.message, false);
  }
}

async function handleTableClick(event) {
  const button = event.target.closest("button");
  if (!button) return;

  const id = button.dataset.id;
  const action = button.dataset.action;

  if (action === "delete") {
    try {
      await request(`/expenses/${id}/`, { method: "DELETE" });
      setMessage("Da xoa.", true);
      await loadExpenses();
      await loadStats("month");
    } catch (error) {
      setMessage(error.message, false);
    }
    return;
  }

  if (action === "edit") {
    try {
      const expense = await request(`/expenses/${id}/`);
      fillExpenseForm(expense);
    } catch (error) {
      setMessage(error.message, false);
    }
  }
}

async function loadStats(groupBy) {
  try {
    const stats = await request(`/expenses/stats/?group_by=${groupBy}`);
    statsList.innerHTML = "";
    stats.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = `${item.period}: ${item.total} (${item.count} giao dich)`;
      statsList.appendChild(li);
    });
  } catch (error) {
    setMessage(error.message, false);
  }
}

function logout() {
  localStorage.removeItem(tokenKey);
  appSection.style.display = "none";
  setMessage("Da dang xuat.", true);
}

registerForm.addEventListener("submit", register);
loginForm.addEventListener("submit", login);
expenseForm.addEventListener("submit", saveExpense);
document.getElementById("filter-btn").addEventListener("click", loadExpenses);
document.getElementById("logout-btn").addEventListener("click", logout);
document.getElementById("expense-table-body").addEventListener("click", handleTableClick);

document.querySelectorAll(".stats-btn").forEach((btn) => {
  btn.addEventListener("click", () => loadStats(btn.dataset.group));
});

if (getToken()) {
  appSection.style.display = "block";
  loadExpenses();
  loadStats("month");
}
