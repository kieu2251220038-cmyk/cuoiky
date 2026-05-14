import { useEffect, useMemo, useRef, useState } from 'react';
import { getApiBaseUrl, request } from './api';

const tokenKey = 'moneytracker_access_token';

const initialExpenseForm = () => ({
  id: '',
  title: '',
  category: '',
  amount: '',
  spent_at: new Date().toISOString().slice(0, 10),
  note: '',
});

const initialAuthForm = {
  username: '',
  email: '',
  password: '',
};

const initialFilters = {
  q: '',
  category: '',
  from: '',
  to: '',
};

function formatCurrency(value) {
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatPeriod(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

function App() {
  const [token, setToken] = useState(() => globalThis.localStorage?.getItem(tokenKey) || '');
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState(initialAuthForm);
  const [expenseForm, setExpenseForm] = useState(initialExpenseForm());
  const [filters, setFilters] = useState(initialFilters);
  const [message, setMessage] = useState({ text: '', ok: true });
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState([]);
  const [trend, setTrend] = useState([]);
  const [categories, setCategories] = useState([]);
  const [statsGroup, setStatsGroup] = useState('month');
  const [loading, setLoading] = useState(false);
  const formRef = useRef(null);

  const apiBaseUrl = getApiBaseUrl();
  const isAuthed = Boolean(token);

  useEffect(() => {
    if (!token) {
      globalThis.localStorage?.removeItem(tokenKey);
      return;
    }

    globalThis.localStorage?.setItem(tokenKey, token);
  }, [token]);

  useEffect(() => {
    if (!isAuthed) {
      setExpenses([]);
      setStats([]);
      setTrend([]);
      setCategories([]);
      setExpenseForm(initialExpenseForm());
      return;
    }

    void refreshDashboard();
  }, [isAuthed, statsGroup]);

  const summary = useMemo(() => {
    const total = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    return {
      total,
      count: expenses.length,
    };
  }, [expenses]);

  function notify(text, ok = true) {
    setMessage({ text, ok });
  }

  function clearNoticeSoon(text, ok = true, seconds = 5) {
    notify(text, ok);
    window.clearTimeout(clearNoticeSoon._timeout);
    clearNoticeSoon._timeout = window.setTimeout(() => {
      setMessage({ text: '', ok: true });
    }, seconds * 1000);
  }

  function logout() {
    setToken('');
    setAuthForm(initialAuthForm);
    setAuthMode('login');
    setMessage({ text: '', ok: true });
  }

  async function refreshDashboard() {
    setLoading(true);
    try {
      await Promise.all([
        loadExpenses(filters),
        loadStats(statsGroup),
        loadCategories(filters),
        loadTrend(6),
      ]);
    } catch (error) {
      clearNoticeSoon(error.message || 'Khong the tai dashboard', false);
    } finally {
      setLoading(false);
    }
  }

  async function loadExpenses(filterState = filters) {
    const params = new URLSearchParams();
    if (filterState.q) params.set('q', filterState.q);
    if (filterState.category) params.set('category', filterState.category);
    if (filterState.from) params.set('date_from', filterState.from);
    if (filterState.to) params.set('date_to', filterState.to);

    const path = params.toString() ? `/expenses/?${params.toString()}` : '/expenses/';
    const data = await request(path);
    setExpenses(Array.isArray(data) ? data : []);
  }

  async function loadStats(groupBy) {
    const data = await request(`/expenses/stats/?group_by=${groupBy}`);
    setStats(Array.isArray(data) ? data : []);
  }

  async function loadCategories(filterState = filters) {
    const params = new URLSearchParams();
    if (filterState.q) params.set('q', filterState.q);
    if (filterState.category) params.set('category', filterState.category);
    if (filterState.from) params.set('date_from', filterState.from);
    if (filterState.to) params.set('date_to', filterState.to);

    const path = params.toString() ? `/expenses/categories/?${params.toString()}` : '/expenses/categories/';
    const data = await request(path);
    setCategories(Array.isArray(data) ? data : []);
  }

  async function loadTrend(months = 6) {
    const data = await request(`/expenses/trend/?months=${months}`);
    setTrend(Array.isArray(data) ? data : []);
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();

    try {
      if (authMode === 'register') {
        await request('/auth/register', {
          method: 'POST',
          body: JSON.stringify(authForm),
        });
        clearNoticeSoon('Dang ky thanh cong. Hay dang nhap de tiep tuc.', true);
        setAuthMode('login');
        setAuthForm(initialAuthForm);
        return;
      }

      const data = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: authForm.username,
          password: authForm.password,
        }),
      });
      setToken(data.access);
      setAuthForm(initialAuthForm);
      clearNoticeSoon('Dang nhap thanh cong.', true);
    } catch (error) {
      clearNoticeSoon(error.message || 'Loi xac thuc', false);
    }
  }

  async function handleExpenseSubmit(event) {
    event.preventDefault();

    const payload = {
      title: expenseForm.title,
      category: expenseForm.category,
      amount: parseFloat(expenseForm.amount),
      spent_at: expenseForm.spent_at,
      note: expenseForm.note,
    };

    if (!payload.amount || Number.isNaN(payload.amount) || payload.amount <= 0) {
      clearNoticeSoon('So tien phai lon hon 0', false);
      return;
    }

    try {
      if (expenseForm.id) {
        await request(`/expenses/${expenseForm.id}/`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        clearNoticeSoon('Cap nhat giao dich thanh cong.', true);
      } else {
        await request('/expenses/', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        clearNoticeSoon('Them giao dich thanh cong.', true);
      }

      setExpenseForm(initialExpenseForm());
      await refreshDashboard();
    } catch (error) {
      clearNoticeSoon(error.message || 'Khong luu duoc giao dich', false);
    }
  }

  function editExpense(expense) {
    setExpenseForm({
      id: expense.id,
      title: expense.title || '',
      category: expense.category || '',
      amount: String(expense.amount ?? ''),
      spent_at: expense.spent_at || new Date().toISOString().slice(0, 10),
      note: expense.note || '',
    });
    window.setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  }

  async function deleteExpense(id) {
    const confirmed = window.confirm('Ban chac chan muon xoa giao dich nay?');
    if (!confirmed) return;

    try {
      await request(`/expenses/${id}/`, { method: 'DELETE' });
      clearNoticeSoon('Da xoa giao dich.', true);
      await refreshDashboard();
    } catch (error) {
      clearNoticeSoon(error.message || 'Khong xoa duoc giao dich', false);
    }
  }

  async function applyFilters(event) {
    event.preventDefault();
    try {
      await Promise.all([
        loadExpenses(filters),
        loadCategories(filters),
      ]);
    } catch (error) {
      clearNoticeSoon(error.message || 'Khong loc duoc du lieu', false);
    }
  }

  if (!apiBaseUrl) {
    return (
      <main className="container">
        <section className="card">
          <p className="eyebrow">Config error</p>
          <h1>Thieu API base URL</h1>
          <p>Hay cung cap <code>window.__APP_CONFIG__.API_BASE_URL</code> hoac <code>VITE_API_BASE_URL</code> truoc khi chay frontend React.</p>
        </section>
      </main>
    );
  }

  if (!isAuthed) {
    return (
      <main className="container">
        <header className="hero hero-home">
          <div>
            <p className="eyebrow">Fintech Dashboard</p>
            <h1>Expense Tracker chuyen nghiep cho quan ly chi tieu</h1>
            <p>Theo doi transactions, them khoan chi, xem tong chi theo ngay/thang va giu toan bo du lieu nam trong mot dashboard goc.</p>
          </div>
          <div className="hero-badge">
            <span>Transactions</span>
            <strong>0</strong>
            <small>Giao dịch đang hiển thị</small>
          </div>
        </header>

        <section className="card guest-gate">
          <div className="guest-copy">
            <p className="eyebrow">Account Access</p>
            <h2>Dang nhap de mo dashboard va du lieu backend</h2>
            <p>He thong se ket noi truc tiep voi API de quan ly tai khoan, them chi tieu, xem thong ke va loc du lieu.</p>
          </div>

          <div className="guest-actions">
            <button type="button" className={authMode === 'login' ? '' : 'btn-secondary'} onClick={() => setAuthMode('login')}>Dang nhap</button>
            <button type="button" className={authMode === 'register' ? '' : 'btn-secondary'} onClick={() => setAuthMode('register')}>Dang ky</button>
          </div>

          <div className="guest-features">
            <div>
              <strong>Auth</strong>
              <span>Dang ky / dang nhap / dang xuat</span>
            </div>
            <div>
              <strong>Transactions</strong>
              <span>CRUD chi tieu + loc ngay/loai</span>
            </div>
            <div>
              <strong>Reports</strong>
              <span>Tong hop theo ngay / thang</span>
            </div>
          </div>
        </section>

        <section className="card auth-page">
          <div>
            <h2>{authMode === 'login' ? 'Dang nhap' : 'Dang ky'}</h2>
            <p className="auth-subtitle">
              {authMode === 'login' ? 'Dang nhap vao tai khoan cua ban' : 'Tao tai khoan moi de bat dau theo doi chi tieu'}
            </p>
            <form onSubmit={handleAuthSubmit} className="auth-form">
              <input
                name="username"
                placeholder="Username"
                required
                autoFocus={authMode === 'login'}
                value={authForm.username}
                onChange={(event) => setAuthForm((current) => ({ ...current, username: event.target.value }))}
              />
              {authMode === 'register' ? (
                <input
                  name="email"
                  placeholder="Email"
                  type="email"
                  required
                  value={authForm.email}
                  onChange={(event) => setAuthForm((current) => ({ ...current, email: event.target.value }))}
                />
              ) : null}
              <input
                name="password"
                placeholder="Password"
                type="password"
                required
                value={authForm.password}
                onChange={(event) => setAuthForm((current) => ({ ...current, password: event.target.value }))}
              />
              <button type="submit">{authMode === 'login' ? 'Dang nhap' : 'Tao tai khoan'}</button>
            </form>
            <p className="auth-footer">
              {authMode === 'login' ? (
                <>Chua co tai khoan? <button type="button" onClick={() => setAuthMode('register')}>Dang ky</button></>
              ) : (
                <>Da co tai khoan? <button type="button" onClick={() => setAuthMode('login')}>Dang nhap</button></>
              )}
            </p>
          </div>
        </section>

        {message.text ? <div id="message" className={message.ok ? 'ok' : 'error'}>{message.text}</div> : null}
      </main>
    );
  }

  return (
    <main className="container">
      <header className="hero hero-home">
        <div>
          <p className="eyebrow">Fintech Dashboard</p>
          <h1>Expense Tracker chuyen nghiep cho quan ly chi tieu</h1>
          <p>Theo doi transactions, them khoan chi, xem tong chi theo ngay/thang va giu toan bo du lieu nam trong mot dashboard goc.</p>
        </div>
        <div className="hero-badge">
          <span>Transactions</span>
          <strong>{summary.count}</strong>
          <small>Giao dịch đang hiển thị</small>
        </div>
      </header>

      <section className="card" id="app-section">
        <div className="dashboard-grid">
          <aside className="dashboard-panel dashboard-summary">
            <div className="panel-title-row">
              <div>
                <p className="panel-label">Tong quan</p>
                <h2>Chi tieu hom nay</h2>
              </div>
              <button type="button" className="btn-secondary" onClick={logout}>Dang xuat</button>
            </div>

            <div className="summary-cards">
              <article className="summary-card accent">
                <span>Tong chi</span>
                <strong>{formatCurrency(summary.total)} ₫</strong>
                <small>Gia tri cua danh sach hien tai</small>
              </article>
              <article className="summary-card muted">
                <span>Giao dich</span>
                <strong>{summary.count}</strong>
                <small>So dong du lieu dang xem</small>
              </article>
            </div>

            <div className="stats stats-shell">
              <div className="panel-title-row compact">
                <div>
                  <p className="panel-label">Thong ke</p>
                  <h3>Tong chi theo thoi gian</h3>
                </div>
              </div>
              <div className="stats-actions">
                <button type="button" data-group="day" className="stats-btn" onClick={() => setStatsGroup('day')}>Theo ngay</button>
                <button type="button" data-group="month" className="stats-btn" onClick={() => setStatsGroup('month')}>Theo thang</button>
              </div>
              <ul>
                {stats.map((item) => (
                  <li key={item.period}>
                    {formatPeriod(item.period)}: {formatCurrency(item.total)} ({item.count} giao dich)
                  </li>
                ))}
              </ul>
              <div className="trend-shell">
                <p className="panel-label">Trend</p>
                <ul>
                  {trend.map((item) => (
                    <li key={item.period}>
                      {formatPeriod(item.period)}: {formatCurrency(item.total)} ₫
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>

          <section className="dashboard-panel dashboard-main">
            <div className="section-head">
              <div>
                <p className="panel-label">Them khoan chi tieu</p>
                <h2>Transactions</h2>
              </div>
            </div>

            <form ref={formRef} onSubmit={handleExpenseSubmit} className="expense-form expense-form--hero">
              <input
                type="hidden"
                name="id"
                value={expenseForm.id}
                readOnly
              />
              <input
                name="title"
                placeholder="Ten khoan chi"
                required
                value={expenseForm.title}
                onChange={(event) => setExpenseForm((current) => ({ ...current, title: event.target.value }))}
              />
              <input
                name="category"
                placeholder="Loai (Food, Travel...)"
                required
                value={expenseForm.category}
                onChange={(event) => setExpenseForm((current) => ({ ...current, category: event.target.value }))}
              />
              <input
                name="amount"
                placeholder="So tien"
                type="number"
                min="0.01"
                step="0.01"
                required
                value={expenseForm.amount}
                onChange={(event) => setExpenseForm((current) => ({ ...current, amount: event.target.value }))}
              />
              <input
                name="spent_at"
                type="date"
                required
                value={expenseForm.spent_at}
                onChange={(event) => setExpenseForm((current) => ({ ...current, spent_at: event.target.value }))}
              />
              <input
                name="note"
                placeholder="Ghi chu"
                value={expenseForm.note}
                onChange={(event) => setExpenseForm((current) => ({ ...current, note: event.target.value }))}
              />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit">Luu chi tieu</button>
                <button type="button" className="btn-secondary" onClick={() => setExpenseForm(initialExpenseForm())}>Clear</button>
              </div>
            </form>

            <form className="filters filters--hero" onSubmit={applyFilters}>
              <input
                name="q"
                placeholder="Tim theo tieu de/ghi chu"
                value={filters.q}
                onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
              />
              <input
                name="category"
                list="filter-category-list"
                placeholder="Loc theo category"
                value={filters.category}
                onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}
              />
              <datalist id="filter-category-list">
                {categories.map((item) => (
                  <option key={item.category} value={item.category} label={`${item.category} (${item.count})`} />
                ))}
              </datalist>
              <input
                name="from"
                type="date"
                value={filters.from}
                onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))}
              />
              <input
                name="to"
                type="date"
                value={filters.to}
                onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))}
              />
              <button type="submit">Loc</button>
            </form>

            <div className="table-shell">
              <div className="table-shell-head">
                <div>
                  <p className="panel-label">Bang du lieu</p>
                  <h3>transactions</h3>
                </div>
                <span className="table-hint">Xem, sua, xoa nhanh</span>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Tieu de</th>
                      <th>Loai</th>
                      <th>So tien</th>
                      <th>Ngay</th>
                      <th>Ghi chu</th>
                      <th>Hanh dong</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.length ? expenses.map((expense) => (
                      <tr key={expense.id}>
                        <td>{expense.title}</td>
                        <td>{expense.category}</td>
                        <td>{formatCurrency(expense.amount)}</td>
                        <td>{expense.spent_at}</td>
                        <td>{expense.note || ''}</td>
                        <td className="row-actions">
                          <button type="button" onClick={() => editExpense(expense)}>Sua</button>
                          <button type="button" onClick={() => deleteExpense(expense.id)}>Xoa</button>
                        </td>
                      </tr>
                    )) : (
                      <tr className="empty-row">
                        <td colSpan="6">
                          <div className="empty-state">
                            <strong>Chua co giao dich nao</strong>
                            <span>Hay them khoan chi dau tien de bat dau theo doi chi tieu.</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {loading ? <p className="auth-subtitle">Dang tai du lieu...</p> : null}
          </section>
        </div>
      </section>

      {message.text ? <div id="message" className={message.ok ? 'ok' : 'error'}>{message.text}</div> : null}
    </main>
  );
}

export default App;
