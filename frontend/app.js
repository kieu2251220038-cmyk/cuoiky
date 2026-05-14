const API_BASE_URL = window.__APP_CONFIG__.API_BASE_URL;
const tokenKey = "moneytracker_access_token";

const registerForm = document.getElementById("register-form");
const loginForm = document.getElementById("login-form");
const expenseForm = document.getElementById("expense-form");
const appSection = document.getElementById("app-section");
const guestSection = document.getElementById("guest-section");
const tableBody = document.getElementById("expense-table-body");
const statsList = document.getElementById("stats-list");
const summaryTotalEl = document.getElementById("summary-total");
const summaryCountEl = document.getElementById("summary-count");
const summaryCountCardEl = document.getElementById("summary-count-card");
const messageEl = document.getElementById("message");
const trendList = document.getElementById("trend-list");
const filterCategoryList = document.getElementById("filter-category-list");

function getToken() {
  return localStorage.getItem(tokenKey);
}

function updateSummary(expenses) {
  if (!summaryTotalEl || !summaryCountEl || !summaryCountCardEl) return;

  const total = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const count = expenses.length;
  const formattedTotal = new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(total);

  summaryTotalEl.textContent = `${formattedTotal} ₫`;
  summaryCountEl.textContent = String(count);
  summaryCountCardEl.textContent = String(count);
}
function setMessage(text, ok = true) {
  if (!messageEl) return;
  messageEl.textContent = text;
  messageEl.className = ok ? "ok" : "error";
}
// show a transient message and clear after a few seconds
function flashMessage(text, ok = true, seconds = 5) {
  setMessage(text, ok);
  if (!messageEl) return;
  clearTimeout(messageEl._timeout);
  messageEl._timeout = setTimeout(() => {
    messageEl.textContent = "";
    messageEl.className = "";
  }, seconds * 1000);
}

function goTo(page) {
  window.location.href = page;
}

function showGuestGate() {
  if (guestSection) guestSection.style.display = "block";
  if (appSection) appSection.style.display = "none";
}

function showDashboard() {
  if (guestSection) guestSection.style.display = "none";
  if (appSection) appSection.style.display = "block";
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

  if (response.status === 401) {
    localStorage.removeItem(tokenKey);
    if (appSection) {
      showGuestGate();
    }
    throw new Error("Phien dang nhap het han. Vui long dang nhap lai.");
  }

  if (!response.ok) {
    let detail = `Request failed: ${response.status}`;
    try {
      const data = await response.json();
      if (data.detail) {
        detail = data.detail;
      } else if (typeof data === "object") {
        // Format validation errors like {field: ["err"]}
        const parts = [];
        for (const [key, val] of Object.entries(data)) {
          if (Array.isArray(val)) {
            parts.push(`${key}: ${val.join(", ")}`);
          } else if (typeof val === "object") {
            parts.push(`${key}: ${JSON.stringify(val)}`);
          } else {
            parts.push(`${key}: ${String(val)}`);
          }
        }
        if (parts.length) detail = parts.join("; ");
        else detail = JSON.stringify(data);
      } else {
        detail = String(data);
      }
    } catch (error) {
      // Backend may return non-JSON errors.
    }
    const err = new Error(detail);
    err.status = response.status;
    throw err;
  }

  if (response.status === 204) {
    return null;
  }
  return response.json();
}

async function handleRegisterSubmit(event) {
  event.preventDefault();
  const fd = new FormData(registerForm);

  try {
    await request("/auth/register", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(fd.entries())),
    });
    setMessage("Dang ky thanh cong! Chuyen sang trang dang nhap...", true);
    setTimeout(() => goTo("login.html"), 1200);
  } catch (error) {
    flashMessage(error.message || "Loi", false);
  }
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  const fd = new FormData(loginForm);

  try {
    const data = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(fd.entries())),
    });
    localStorage.setItem(tokenKey, data.access);
    setMessage("Dang nhap thanh cong! Chuyen sang trang chu...", true);
    setTimeout(() => goTo("index.html"), 800);
  } catch (error) {
    flashMessage(error.message || "Loi dang nhap", false);
  }
}

function fillExpenseForm(expense) {
  expenseForm.id.value = expense.id;
  expenseForm.title.value = expense.title;
  expenseForm.category.value = expense.category;
  expenseForm.amount.value = String(expense.amount);
  expenseForm.spent_at.value = expense.spent_at;
  expenseForm.note.value = expense.note || "";
  // Scroll form vào view khi edit
  expenseForm.scrollIntoView({ behavior: "smooth", block: "start" });
  expenseForm.title.focus();
}

async function saveExpense(event) {
  event.preventDefault();
  const fd = new FormData(expenseForm);
  const data = Object.fromEntries(fd.entries());
  const id = data.id;
  delete data.id;

  // Chuyển amount thành số
  data.amount = parseFloat(data.amount);
  if (isNaN(data.amount) || data.amount <= 0) {
    flashMessage("So tien phai > 0", false);
    return;
  }

  try {
    if (id) {
      await request(`/expenses/${id}/`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      flashMessage("Cap nhat thanh cong.", true);
    } else {
      await request("/expenses/", {
        method: "POST",
        body: JSON.stringify(data),
      });
      flashMessage("Them moi thanh cong.", true);
    }

    clearExpenseForm();
    await loadExpenses();
    await loadStats("month");
    await loadTrend(6);
  } catch (error) {
    flashMessage(error.message || "Loi luu giao dich", false);
  }
}

function clearExpenseForm() {
  expenseForm.reset();
  expenseForm.id.value = "";
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
  if (!tableBody) return;

  const q = document.getElementById("filter-q")?.value.trim() || "";
  const category = document.getElementById("filter-category")?.value.trim() || "";
  const from = document.getElementById("filter-from")?.value || "";
  const to = document.getElementById("filter-to")?.value || "";

  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (category) params.set("category", category);
  if (from) params.set("date_from", from);
  if (to) params.set("date_to", to);

  const path = params.toString() ? `/expenses/?${params.toString()}` : "/expenses/";

  try {
    const expenses = await request(path);
    tableBody.innerHTML = "";

    if (!expenses.length) {
      tableBody.innerHTML = `
        <tr class="empty-row">
          <td colspan="6">
            <div class="empty-state">
              <strong>Chua co giao dich nao</strong>
              <span>Hay them khoan chi dau tien de bat dau theo doi chi tieu.</span>
            </div>
          </td>
        </tr>
      `;
      updateSummary([]);
      return;
    }

    expenses.forEach((item) => tableBody.appendChild(expenseRow(item)));
    updateSummary(expenses);
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
    if (!confirm("Ban chac chan muon xoa giao dich nay?")) return;
    try {
      await request(`/expenses/${id}/`, { method: "DELETE" });
      flashMessage("Da xoa.", true);
      await loadExpenses();
      await loadStats("month");
    } catch (error) {
      flashMessage(error.message || "Loi khi xoa", false);
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
  if (!statsList) return;

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
  goTo("login.html");
}

function initRegisterPage() {
  if (getToken()) {
    goTo("index.html");
    return;
  }

  registerForm?.addEventListener("submit", handleRegisterSubmit);
  document.getElementById("link-to-login")?.addEventListener("click", (event) => {
    event.preventDefault();
    goTo("login.html");
  });
}

function initLoginPage() {
  if (getToken()) {
    goTo("index.html");
    return;
  }

  loginForm?.addEventListener("submit", handleLoginSubmit);
  loginForm?.elements.username?.focus();
  document.getElementById("link-to-register")?.addEventListener("click", (event) => {
    event.preventDefault();
    goTo("register.html");
  });
}

function initHomePage() {
  if (!getToken()) {
    showGuestGate();
    return;
  }

  showDashboard();
  expenseForm?.addEventListener("submit", saveExpense);
  document.getElementById("clear-form-btn")?.addEventListener("click", (event) => {
    event.preventDefault();
    clearExpenseForm();
    flashMessage("Form da reset.", true, 3);
  });
  document.getElementById("logout-btn")?.addEventListener("click", logout);
  document.getElementById("filter-btn")?.addEventListener("click", loadExpenses);
  document.getElementById("expense-table-body")?.addEventListener("click", handleTableClick);

  document.querySelectorAll(".stats-btn").forEach((btn) => {
    btn.addEventListener("click", () => loadStats(btn.dataset.group));
  });

  loadExpenses();
  loadStats("month");
  loadCategories();
  loadTrend(6);
}

async function loadCategories() {
  if (!filterCategoryList) return;
  try {
    const cats = await request("/expenses/categories/");
    filterCategoryList.innerHTML = "";
    cats.forEach((c) => {
      const option = document.createElement("option");
      option.value = c.category;
      option.label = `${c.category} (${c.count})`;
      filterCategoryList.appendChild(option);
    });
  } catch (error) {
    // ignore non-critical
  }
}

async function loadTrend(months = 6) {
  if (!trendList) return;
  try {
    const data = await request(`/expenses/trend/?months=${months}`);
    trendList.innerHTML = "";
    data.forEach((item) => {
      const li = document.createElement("li");
      const formatted = new Intl.NumberFormat("vi-VN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(item.total);
      li.textContent = `${item.period}: ${formatted} ₫`;
      trendList.appendChild(li);
    });
  } catch (error) {
    // ignore for now
  }
}

if (registerForm) {
  initRegisterPage();
} else if (loginForm) {
  initLoginPage();
} else if (appSection) {
  initHomePage();
}
