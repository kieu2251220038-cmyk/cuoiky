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
  return new Intl.NumberFormat('vi-VN').format(Number(value || 0));
}

function formatPeriod(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

function App() {
  const [token, setToken] = useState(
    () => localStorage.getItem(tokenKey) || ''
  );

  const [username, setUsername] = useState(
    () => localStorage.getItem('moneytracker_username') || ''
  );

  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState(initialAuthForm);

  const [expenseForm, setExpenseForm] = useState(initialExpenseForm());

  const [filters, setFilters] = useState(initialFilters);

  const [message, setMessage] = useState({
    text: '',
    ok: true,
  });

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
      localStorage.removeItem(tokenKey);
      localStorage.removeItem('moneytracker_username');
      return;
    }

    localStorage.setItem(tokenKey, token);

    if (username) {
      localStorage.setItem('moneytracker_username', username);
    }
  }, [token, username]);

  useEffect(() => {
    if (!token) return;
    void refreshDashboard();
  }, [token, statsGroup]);

  const summary = useMemo(() => {
    const total = expenses.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    return {
      total,
      count: expenses.length,
    };
  }, [expenses]);

  function notify(text, ok = true) {
    setMessage({ text, ok });
  }

  function clearNoticeSoon(text, ok = true) {
    notify(text, ok);

    setTimeout(() => {
      setMessage({
        text: '',
        ok: true,
      });
    }, 3000);
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();

    try {
      if (authMode === 'register') {
        await request('/auth/register', {
          method: 'POST',
          body: JSON.stringify(authForm),
        });

        clearNoticeSoon('Đăng ký thành công. Vui lòng đăng nhập.');
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

      const accessToken = data?.access || data?.token || data?.access_token;
      if (!accessToken) {
        throw new Error('Không nhận được token từ server');
      }

      setToken(accessToken);
      setUsername(authForm.username);
      setAuthForm(initialAuthForm);
      clearNoticeSoon('Đăng nhập thành công');
    } catch (error) {
      clearNoticeSoon(error.message || 'Lỗi xác thực', false);
    }
  }

  function logout() {
    setToken('');
    setUsername('');
    setAuthForm(initialAuthForm);
    setExpenseForm(initialExpenseForm());
    setExpenses([]);
    setStats([]);
    setTrend([]);
    setCategories([]);
    setFilters(initialFilters);
    localStorage.removeItem(tokenKey);
    localStorage.removeItem('moneytracker_username');
  }

  async function refreshDashboard() {
    setLoading(true);

    try {
      await Promise.all([
        loadExpenses(),
        loadStats(statsGroup),
        loadCategories(),
        loadTrend(),
      ]);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  async function loadExpenses(filterState = filters) {
    try {
      const params = new URLSearchParams();

      if (filterState.q) params.set('q', filterState.q);
      if (filterState.category)
        params.set('category', filterState.category);

      if (filterState.from)
        params.set('date_from', filterState.from);

      if (filterState.to)
        params.set('date_to', filterState.to);

      const path = params.toString()
        ? `/expenses/?${params.toString()}`
        : '/expenses/';

      const data = await request(path);

      setExpenses(Array.isArray(data) ? data : []);
    } catch {
      setExpenses([]);
    }
  }

  async function loadStats(groupBy) {
    try {
      const data = await request(
        `/expenses/stats/?group_by=${groupBy}`
      );

      setStats(Array.isArray(data) ? data : []);
    } catch {
      setStats([]);
    }
  }

  async function loadCategories() {
    try {
      const data = await request('/expenses/categories/');

      setCategories(Array.isArray(data) ? data : []);
    } catch {
      setCategories([]);
    }
  }

  async function loadTrend() {
    try {
      const data = await request('/expenses/trend/?months=6');

      setTrend(Array.isArray(data) ? data : []);
    } catch {
      setTrend([]);
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

    try {
      if (expenseForm.id) {
        await request(`/expenses/${expenseForm.id}/`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });

        clearNoticeSoon('Cap nhat thanh cong');
      } else {
        await request('/expenses/', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        clearNoticeSoon('Them giao dich thanh cong');
      }

      setExpenseForm(initialExpenseForm());

      await refreshDashboard();
    } catch {
      clearNoticeSoon('Khong the luu giao dich', false);
    }
  }

  function editExpense(expense) {
    setExpenseForm({
      id: expense.id,
      title: expense.title,
      category: expense.category,
      amount: expense.amount,
      spent_at: expense.spent_at,
      note: expense.note,
    });

    setTimeout(() => {
      formRef.current?.scrollIntoView({
        behavior: 'smooth',
      });
    }, 200);
  }

  async function deleteExpense(id) {
    const confirmed = window.confirm(
      'Ban chac chan muon xoa?'
    );

    if (!confirmed) return;

    try {
      await request(`/expenses/${id}/`, {
        method: 'DELETE',
      });

      clearNoticeSoon('Da xoa');

      await refreshDashboard();
    } catch {
      clearNoticeSoon('Xoa that bai', false);
    }
  }

  async function applyFilters(event) {
    event.preventDefault();

    await loadExpenses(filters);
  }

  async function runHealthCheck() {
    try {
      await request('/health');

      clearNoticeSoon('Backend hoat dong binh thuong');
    } catch {
      clearNoticeSoon('Backend loi', false);
    }
  }

  if (!apiBaseUrl) {
    return (
      <div style={{ padding: 30 }}>
        <h1>Khong tim thay API URL</h1>
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <main className="container">
        <header className="hero hero-home">
          <div>
            <p className="eyebrow">FINTECH DASHBOARD</p>
            <h1>Expense Tracker quản lí chi tiêu thông minh</h1>
            <p>
              Đăng nhập để sử dụng các chức năng chính như quản lý chi tiêu,
              lọc dữ liệu, thống kê và kiểm tra hệ thống.
            </p>
          </div>
          <div className="hero-badge">
            <span>TRANSACTIONS</span>
            <strong>0</strong>
            <small>Chưa đăng nhập</small>
          </div>
        </header>

        <section className="card guest-gate">
          <div className="guest-copy">
            <p className="eyebrow">Các chức năng chính</p>
            <h2>Hệ thống hỗ trợ quản lý chi tiêu đầy đủ</h2>
            <p>
              Đăng ký, đăng nhập, quản lý chi tiêu CRUD, lọc theo category/ngày,
              thống kê, health check và lưu dữ liệu PostgreSQL.
            </p>
          </div>
          <div className="guest-actions">
            <button
              type="button"
              className={authMode === 'login' ? '' : 'btn-secondary'}
              onClick={() => setAuthMode('login')}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              className={authMode === 'register' ? '' : 'btn-secondary'}
              onClick={() => setAuthMode('register')}
            >
              Đăng ký
            </button>
          </div>
          <div className="guest-features feature-grid">
            <div className="feature-card">
              <strong>Quản lý người dùng</strong>
              <span>Đăng ký và đăng nhập để bảo mật dữ liệu cá nhân.</span>
            </div>
            <div className="feature-card">
              <strong>Quản lý chi tiêu</strong>
              <span>Thêm, sửa, xóa các khoản chi tiêu và lưu vào PostgreSQL.</span>
            </div>
            <div className="feature-card">
              <strong>Tra cứu</strong>
              <span>Tìm kiếm và lọc theo danh mục hoặc khoảng thời gian.</span>
            </div>
            <div className="feature-card">
              <strong>Thống kê</strong>
              <span>Xem tổng hợp chi tiêu theo ngày và tháng.</span>
            </div>
            <div className="feature-card">
              <strong>Health check</strong>
              <span>Kiểm tra trạng thái hệ thống qua <code>/api/health</code>.</span>
            </div>
          </div>
        </section>

        <section className="card auth-page">
          <div>
            <h2>{authMode === 'login' ? 'Đăng nhập' : 'Đăng ký'}</h2>
            <p className="auth-subtitle">
              {authMode === 'login'
                ? 'Đăng nhập để sử dụng hệ thống và đồng bộ dữ liệu.'
                : 'Tạo tài khoản mới để bắt đầu quản lý chi tiêu.'}
            </p>
            <form onSubmit={handleAuthSubmit} className="auth-form">
              <input
                name="username"
                placeholder="Username"
                required
                value={authForm.username}
                onChange={(event) =>
                  setAuthForm((current) => ({
                    ...current,
                    username: event.target.value,
                  }))
                }
              />
              {authMode === 'register' ? (
                <input
                  name="email"
                  placeholder="Email"
                  type="email"
                  required
                  value={authForm.email}
                  onChange={(event) =>
                    setAuthForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                />
              ) : null}
              <input
                name="password"
                placeholder="Password"
                type="password"
                required
                value={authForm.password}
                onChange={(event) =>
                  setAuthForm((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
              />
              <button type="submit">
                {authMode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
              </button>
            </form>
            <p className="auth-footer">
              {authMode === 'login' ? (
                <>Chưa có tài khoản? <button type="button" onClick={() => setAuthMode('register')}>Đăng ký</button></>
              ) : (
                <>Đã có tài khoản? <button type="button" onClick={() => setAuthMode('login')}>Đăng nhập</button></>
              )}
            </p>
          </div>
        </section>

        {message.text ? (
          <div id="message" className={message.ok ? 'ok' : 'error'}>
            {message.text}
          </div>
        ) : null}
      </main>
    );
  }

  return (
    <main className="container">

      {/* HERO */}
      <header className="hero hero-home">
        <div>
          <p className="eyebrow">FINTECH DASHBOARD</p>

          <h1>
            Expense Tracker quản lí chi tiêu thông minh
          </h1>

          <p>
            Quản lý toàn bộ giao dịch, thống kê,
            báo cáo và lịch sử chi tiêu trong
            một dashboard duy nhất.
          </p>
        </div>

        <div className="hero-badge">
          <span>TOTAL TRANSACTIONS</span>

          <strong>{summary.count}</strong>

          <small>Giao dịch hiện có</small>
        </div>
      </header>

      {/* QUICK ACTION */}
      <section className="card home-actions-card">
        <div className="home-actions-grid">

          <button
            className="home-action-btn"
            onClick={() =>
              document
                .getElementById('expense-form')
                ?.scrollIntoView({
                  behavior: 'smooth',
                })
            }
          >
            ➕ Thêm chi tiêu
          </button>

          <button
            className="home-action-btn"
            onClick={() =>
              document
                .getElementById('expense-table')
                ?.scrollIntoView({
                  behavior: 'smooth',
                })
            }
          >
            📋 Danh sách giao dịch
          </button>

          <button
            className="home-action-btn"
            onClick={() =>
              document
                .getElementById('stats-section')
                ?.scrollIntoView({
                  behavior: 'smooth',
                })
            }
          >
            📊 Xem thống kê
          </button>

          <button
            className="home-action-btn"
            onClick={runHealthCheck}
          >
            ❤️ Health Check
          </button>

          <button
            className="home-action-btn"
            onClick={logout}
          >
            🚪 Đăng xuất
          </button>
        </div>
      </section>

      {/* SUMMARY */}
      <section className="card dashboard-intro">

        <div className="dashboard-intro-grid">

          <article>
            <p className="panel-label">
              TỔNG QUAN
            </p>

            <h2>Thông tin chi tiêu</h2>

            <ul>
              <li>
                Tổng giao dịch: {summary.count}
              </li>

              <li>
                Tổng tiền:
                {' '}
                {formatCurrency(summary.total)} ₫
              </li>

              <li>
                Quản lý thêm / sửa / xoá
                giao dịch
              </li>

              <li>
                Lọc theo category và ngày
              </li>

              <li>
                Thống kê theo tháng/ngày
              </li>
            </ul>
          </article>

          <article>
            <p className="panel-label">
              NGƯỜI DÙNG
            </p>

            <h2>
              Xin chào {username || 'Admin'}
            </h2>

            <p>
              Đây là hệ thống quản lí chi tiêu
              cá nhân giúp theo dõi thu chi,
              thống kê và quản lý giao dịch.
            </p>
          </article>

        </div>

      </section>

      {/* MAIN DASHBOARD */}
      <section className="card">

        <div className="dashboard-grid">

          {/* LEFT */}
          <aside className="dashboard-panel dashboard-summary">

            <div className="summary-cards">

              <article className="summary-card accent">
                <span>Tổng chi tiêu</span>

                <strong>
                  {formatCurrency(summary.total)} ₫
                </strong>

                <small>
                  Tổng tiền giao dịch
                </small>
              </article>

              <article className="summary-card muted">
                <span>Số giao dịch</span>

                <strong>
                  {summary.count}
                </strong>

                <small>
                  Tổng dữ liệu
                </small>
              </article>

            </div>

            {/* STATS */}
            <div
              id="stats-section"
              className="stats stats-shell"
            >

              <div className="stats-actions">

                <button
                  onClick={() =>
                    setStatsGroup('day')
                  }
                >
                  Theo ngày
                </button>

                <button
                  onClick={() =>
                    setStatsGroup('month')
                  }
                >
                  Theo tháng
                </button>

              </div>

              <ul>
                {stats.map((item) => (
                  <li key={item.period}>
                    {formatPeriod(item.period)}
                    {' '}
                    -
                    {' '}
                    {formatCurrency(item.total)}
                    ₫
                  </li>
                ))}
              </ul>

              <div className="trend-shell">

                <h3>Xu hướng</h3>

                <ul>
                  {trend.map((item) => (
                    <li key={item.period}>
                      {formatPeriod(item.period)}
                      {' '}
                      :
                      {' '}
                      {formatCurrency(item.total)}
                      ₫
                    </li>
                  ))}
                </ul>

              </div>

            </div>

          </aside>

          {/* RIGHT */}
          <section className="dashboard-panel dashboard-main">

            {/* FORM */}
            <form
              id="expense-form"
              ref={formRef}
              onSubmit={handleExpenseSubmit}
              className="expense-form"
            >

              <h2>
                {expenseForm.id
                  ? 'Cập nhật giao dịch'
                  : 'Thêm giao dịch'}
              </h2>

              <input
                placeholder="Tên khoản chi"
                value={expenseForm.title}
                onChange={(e) =>
                  setExpenseForm({
                    ...expenseForm,
                    title: e.target.value,
                  })
                }
                required
              />

              <input
                placeholder="Category"
                value={expenseForm.category}
                onChange={(e) =>
                  setExpenseForm({
                    ...expenseForm,
                    category: e.target.value,
                  })
                }
                required
              />

              <input
                type="number"
                placeholder="Số tiền"
                value={expenseForm.amount}
                onChange={(e) =>
                  setExpenseForm({
                    ...expenseForm,
                    amount: e.target.value,
                  })
                }
                required
              />

              <input
                type="date"
                value={expenseForm.spent_at}
                onChange={(e) =>
                  setExpenseForm({
                    ...expenseForm,
                    spent_at: e.target.value,
                  })
                }
                required
              />

              <textarea
                placeholder="Ghi chú"
                value={expenseForm.note}
                onChange={(e) =>
                  setExpenseForm({
                    ...expenseForm,
                    note: e.target.value,
                  })
                }
              />

              <div
                style={{
                  display: 'flex',
                  gap: 10,
                }}
              >

                <button type="submit">
                  💾 Lưu giao dịch
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() =>
                    setExpenseForm(
                      initialExpenseForm()
                    )
                  }
                >
                  Clear
                </button>

              </div>

            </form>

            {/* FILTER */}
            <form
              className="filters"
              onSubmit={applyFilters}
            >

              <input
                placeholder="Tìm kiếm..."
                value={filters.q}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    q: e.target.value,
                  })
                }
              />

              <input
                placeholder="Category"
                value={filters.category}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    category: e.target.value,
                  })
                }
              />

              <input
                type="date"
                value={filters.from}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    from: e.target.value,
                  })
                }
              />

              <input
                type="date"
                value={filters.to}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    to: e.target.value,
                  })
                }
              />

              <button type="submit">
                🔍 Lọc
              </button>

            </form>

            {/* TABLE */}
            <div
              className="table-shell"
              id="expense-table"
            >

              <div className="table-shell-head">
                <h2>Danh sách giao dịch</h2>
              </div>

              <div className="table-wrap">

                <table>

                  <thead>
                    <tr>
                      <th>Tên</th>
                      <th>Loại</th>
                      <th>Số tiền</th>
                      <th>Ngày</th>
                      <th>Ghi chú</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>

                  <tbody>

                    {expenses.length ? (
                      expenses.map((expense) => (
                        <tr key={expense.id}>
                          <td>{expense.title}</td>

                          <td>
                            {expense.category}
                          </td>

                          <td>
                            {formatCurrency(
                              expense.amount
                            )}
                            ₫
                          </td>

                          <td>
                            {expense.spent_at}
                          </td>

                          <td>
                            {expense.note}
                          </td>

                          <td
                            style={{
                              display: 'flex',
                              gap: 8,
                            }}
                          >

                            <button
                              onClick={() =>
                                editExpense(
                                  expense
                                )
                              }
                            >
                              ✏️ Sửa
                            </button>

                            <button
                              onClick={() =>
                                deleteExpense(
                                  expense.id
                                )
                              }
                            >
                              🗑️ Xóa
                            </button>

                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6">
                          Không có dữ liệu
                        </td>
                      </tr>
                    )}

                  </tbody>

                </table>

              </div>

            </div>

            {loading && (
              <p>Đang tải dữ liệu...</p>
            )}

          </section>

        </div>

      </section>

      {message.text && (
        <div
          id="message"
          className={
            message.ok ? 'ok' : 'error'
          }
        >
          {message.text}
        </div>
      )}

    </main>
  );
}

export default App;