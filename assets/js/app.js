const appState = {
  marketData: [
    { asset: 'XAU/USD', price: 2345.12, change: 12.48, pct: 0.54, status: 'Open' },
    { asset: 'EUR/USD', price: 1.0852, change: 0.0014, pct: 0.13, status: 'Live' },
    { asset: 'GBP/USD', price: 1.2718, change: -0.0011, pct: -0.09, status: 'Live' },
    { asset: 'BTC/USD', price: 64342.5, change: 842.15, pct: 1.33, status: 'Live' },
    { asset: 'ETH/USD', price: 3480.2, change: -26.7, pct: -0.76, status: 'Live' },
    { asset: 'NIFTY 50', price: 24890.6, change: 118.4, pct: 0.48, status: 'Open' },
    { asset: 'BANK NIFTY', price: 52144.8, change: 216.3, pct: 0.42, status: 'Open' },
    { asset: 'NASDAQ', price: 18362.4, change: 77.2, pct: 0.42, status: 'Open' },
    { asset: 'S&P 500', price: 5512.8, change: 18.9, pct: 0.34, status: 'Open' }
  ],
  charts: {
    'XAU/USD': [2532, 2550, 2544, 2562, 2578, 2588, 2594, 2607, 2599, 2615, 2628, 2632, 2642, 2644, 2638, 2648, 2660, 2654, 2668, 2677, 2681, 2672, 2668, 2675],
    'EUR/USD': [1.0810, 1.0818, 1.0824, 1.0837, 1.0841, 1.0849, 1.0858, 1.0856, 1.0862, 1.0857, 1.0864, 1.0852],
    'GBP/USD': [1.2742, 1.2731, 1.2724, 1.2718, 1.2728, 1.2726, 1.2732, 1.2724, 1.2719, 1.2715, 1.2710, 1.2718],
    'BTC/USD': [61200, 61800, 62450, 62920, 63210, 63640, 64000, 64350, 64520, 64220, 64880, 64342],
    'ETH/USD': [3510, 3498, 3506, 3490, 3478, 3492, 3524, 3508, 3493, 3475, 3510, 3480],
    'NIFTY 50': [24440, 24580, 24620, 24700, 24680, 24750, 24790, 24820, 24875, 24890, 24920, 24890],
    'NASDAQ': [18200, 18280, 18320, 18350, 18310, 18290, 18360, 18325, 18390, 18375, 18410, 18362],
    'S&P 500': [5485, 5489, 5498, 5505, 5512, 5508, 5516, 5518, 5510, 5512, 5518, 5512]
  }
};

function formatPrice(value) {
  if (value >= 1000) return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value);
  if (value >= 1) return new Intl.NumberFormat('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(value);
  if (value >= 0.01) return value.toFixed(4);
  return value.toFixed(2);
}

function renderMarketTable() {
  const tableBody = document.querySelector('#market-table-body');
  if (!tableBody) return;
  tableBody.innerHTML = appState.marketData.map((item) => `
    <tr>
      <td>${item.asset}</td>
      <td>${formatPrice(item.price)}</td>
      <td class="${item.change >= 0 ? 'up' : 'down'}">${item.change >= 0 ? '+' : ''}${formatPrice(item.change)}</td>
      <td class="${item.pct >= 0 ? 'up' : 'down'}">${item.pct >= 0 ? '+' : ''}${item.pct.toFixed(2)}%</td>
      <td><span class="status-pill ${item.status === 'Live' ? 'status-live' : 'status-delay'}">${item.status}</span></td>
    </tr>
  `).join('');
}

function renderMarketCards() {
  const container = document.querySelector('#market-card-grid');
  if (!container) return;
  container.innerHTML = appState.marketData.map((item) => `
    <article class="market-item">
      <div class="market-heading">
        <div>
          <div class="eyebrow">Market</div>
          <h3>${item.asset}</h3>
        </div>
        <span class="status-pill ${item.status === 'Live' ? 'status-live' : 'status-delay'}">${item.status}</span>
      </div>
      <div class="price">${formatPrice(item.price)}</div>
      <div class="market-card-grid">
        <div>
          <div class="mini-label">Change</div>
          <div class="mini-change ${item.change >= 0 ? 'up' : 'down'}">${item.change >= 0 ? '+' : ''}${formatPrice(item.change)}</div>
        </div>
        <div>
          <div class="mini-label">% Change</div>
          <div class="mini-change ${item.pct >= 0 ? 'up' : 'down'}">${item.pct >= 0 ? '+' : ''}${item.pct.toFixed(2)}%</div>
        </div>
      </div>
      <div class="chart-surface">
        ${sparklineMarkup(appState.charts[item.asset] || [0, 1, 2, 3, 4, 5])}
      </div>
    </article>
  `).join('');
}

function sparklineMarkup(values) {
  const width = 340; const height = 80; const min = Math.min(...values); const max = Math.max(...values); const range = max - min || 1;
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = height - ((value - min) / range) * (height - 12) - 6;
    return `${x},${y}`;
  }).join(' ');
  const area = `${points} ${width},${height} 0,${height}`;
  return `
    <svg class="chart-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-label="Sparkline">
      <g>
        <path d="M 0 ${height} L ${area}" class="fill-area" opacity="0.34"></path>
        <polyline points="${points}" class="gold-line"></polyline>
      </g>
    </svg>
  `;
}

function initMobileMenu() {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav-links');
  if (!toggle || !nav) return;
  toggle.addEventListener('click', () => nav.classList.toggle('open'));
}

function setupAuth() {
  const registerForm = document.querySelector('#register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(registerForm);
      const name = (formData.get('fullName') || '').toString().trim();
      const email = (formData.get('email') || '').toString().trim();
      const mobile = (formData.get('mobile') || '').toString().trim();
      const password = (formData.get('password') || '').toString();
      const confirm = (formData.get('confirmPassword') || '').toString();
      const alertBox = document.querySelector('#register-alert');
      if (!name || !email || !mobile || !password || !confirm) {
        showAlert(alertBox, 'Please complete all fields.', 'error');
        return;
      }
      if (password !== confirm) {
        showAlert(alertBox, 'Passwords do not match.', 'error');
        return;
      }
      const users = JSON.parse(localStorage.getItem('prm_users') || '[]');
      if (users.some((u) => u.email === email || u.mobile === mobile)) {
        showAlert(alertBox, 'An account with this email or mobile already exists.', 'error');
        return;
      }
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
      const derived = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 200000 }, key, 256);
      const hash = Array.from(new Uint8Array(derived)).map((b) => b.toString(16).padStart(2, '0')).join('');
      const user = { id: Date.now(), name, email, mobile, passwordHash: hash, salt: Array.from(salt).map((b) => b.toString(16).padStart(2, '0')).join(''), role: 'member', createdAt: new Date().toISOString(), plan: 'Free', subscriptionExpiry: null };
      users.push(user);
      localStorage.setItem('prm_users', JSON.stringify(users));
      localStorage.setItem('prm_current_user', JSON.stringify(user));
      showAlert(alertBox, 'Registration successful. Redirecting to your dashboard...', 'success');
      setTimeout(() => (window.location.href = 'dashboard.html'), 800);
    });
  }

  const loginForm = document.querySelector('#login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = new FormData(loginForm);
      const emailOrMobile = (form.get('email') || '').toString().trim();
      const password = (form.get('password') || '').toString();
      const alertBox = document.querySelector('#login-alert');
      const users = JSON.parse(localStorage.getItem('prm_users') || '[]');
      const user = users.find((item) => item.email === emailOrMobile || item.mobile === emailOrMobile);
      if (!user) {
        showAlert(alertBox, 'Invalid email/mobile or password.', 'error');
        return;
      }
      const salt = Uint8Array.from(user.salt.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
      const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
      const derived = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 200000 }, key, 256);
      const hash = Array.from(new Uint8Array(derived)).map((b) => b.toString(16).padStart(2, '0')).join('');
      if (hash !== user.passwordHash) {
        showAlert(alertBox, 'Invalid email/mobile or password.', 'error');
        return;
      }
      localStorage.setItem('prm_current_user', JSON.stringify(user));
      showAlert(alertBox, 'Login successful. Redirecting...', 'success');
      const redirect = user.role === 'admin' ? 'admin.html' : 'dashboard.html';
      setTimeout(() => (window.location.href = redirect), 800);
    });
  }
}

function showAlert(element, message, type) {
  if (!element) return;
  element.textContent = message;
  element.classList.remove('success', 'error');
  element.classList.add(type, 'show');
}

function initAppointmentForm() {
  const form = document.querySelector('#appointment-form');
  if (!form) return;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const appointment = {
      id: Date.now(),
      name: formData.get('name'),
      mobile: formData.get('mobile'),
      email: formData.get('email'),
      date: formData.get('date'),
      time: formData.get('time'),
      type: formData.get('consultationType'),
      message: formData.get('message'),
      status: 'Pending'
    };
    const appointments = JSON.parse(localStorage.getItem('prm_appointments') || '[]');
    appointments.push(appointment);
    localStorage.setItem('prm_appointments', JSON.stringify(appointments));
    const alert = document.querySelector('#appointment-alert');
    showAlert(alert, 'Appointment requested successfully. Our team will contact you shortly.', 'success');
    form.reset();
  });
}

function renderDashboard() {
  const user = JSON.parse(localStorage.getItem('prm_current_user') || 'null');
  const dashboardName = document.querySelector('#dashboard-user-name');
  if (dashboardName && user) dashboardName.textContent = user.name || 'Member';

  const accountStatus = document.querySelector('#membership-status');
  if (accountStatus && user) accountStatus.textContent = user.plan || 'Free';

  const userList = document.querySelector('#admin-user-list');
  if (userList) {
    const users = JSON.parse(localStorage.getItem('prm_users') || '[]');
    userList.innerHTML = users.map((item) => `
      <tr>
        <td>${item.name}</td>
        <td>${item.email}</td>
        <td>${item.role}</td>
        <td><span class="status-pill status-live">${item.plan || 'Free'}</span></td>
      </tr>
    `).join('');
  }

  const appointmentList = document.querySelector('#admin-appointment-list');
  if (appointmentList) {
    const appointments = JSON.parse(localStorage.getItem('prm_appointments') || '[]');
    appointmentList.innerHTML = appointments.map((item) => `
      <tr>
        <td>${item.name}</td>
        <td>${item.type}</td>
        <td>${item.date}</td>
        <td>${item.time}</td>
        <td><span class="status-pill status-delay">${item.status}</span></td>
      </tr>
    `).join('');
  }
}

function initMarketFilters() {
  const search = document.querySelector('#market-search');
  const filter = document.querySelector('#market-filter');
  const cards = document.querySelectorAll('.market-item');
  if (!search || !filter || !cards.length) return;
  const apply = () => {
    const term = search.value.toLowerCase();
    const selected = filter.value;
    cards.forEach((card) => {
      const label = card.dataset.asset.toLowerCase();
      const matchText = label.includes(term);
      const matchFilter = selected === 'all' || label.includes(selected.toLowerCase());
      card.style.display = matchText && matchFilter ? 'block' : 'none';
    });
  };
  search.addEventListener('input', apply);
  filter.addEventListener('change', apply);
}

function initChartTabs() {
  document.querySelectorAll('.chart-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.chart-tab').forEach((item) => item.classList.remove('active'));
      tab.classList.add('active');
    });
  });
}

function initPageDefaults() {
  renderMarketTable();
  renderMarketCards();
  initMobileMenu();
  setupAuth();
  initAppointmentForm();
  renderDashboard();
  initMarketFilters();
  initChartTabs();
}

document.addEventListener('DOMContentLoaded', initPageDefaults);
