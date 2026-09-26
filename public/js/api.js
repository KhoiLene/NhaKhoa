/**
 * Shared API & UI Helper for Nha Khoa System
 */

const API_BASE = window.location.origin + '/api';

const Session = {
  getUser() {
    try {
      const data = localStorage.getItem('nhakhoa_user');
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },
  setUser(user) {
    localStorage.setItem('nhakhoa_user', JSON.stringify(user));
  },
  clearUser() {
    localStorage.removeItem('nhakhoa_user');
  }
};

function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${message}</span>
    <button style="background:none;border:none;color:#fff;font-size:1.2rem;cursor:pointer;margin-left:10px;" onclick="this.parentElement.remove()">&times;</button>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentElement) toast.remove();
  }, 4000);
}

function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '0 đ';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function formatDate(isoString) {
  if (!isoString) return '--/--/----';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    if (isoString.length > 10) {
      return `${hours}:${minutes} ${day}/${month}/${year}`;
    }
    return `${day}/${month}/${year}`;
  } catch (e) {
    return isoString;
  }
}

function renderTopNav(activeFuncNumber, funcName, roleTitle) {
  const user = Session.getUser();
  let userBadge = '<span class="role-badge role-guest">Khách chưa đăng nhập</span>';
  let userName = '';
  let authActions = `
    <a href="02-login-patient.html" class="btn btn-sm btn-secondary">BN Đăng nhập</a>
    <a href="03-login-admin.html" class="btn btn-sm btn-primary">Admin / BS Đăng nhập</a>
  `;

  if (user) {
    let roleClass = 'role-guest';
    let roleName = user.role;
    if (user.role === 'ADMIN') { roleClass = 'role-admin'; roleName = 'Quản trị viên'; }
    else if (user.role === 'DOCTOR') { roleClass = 'role-doctor'; roleName = 'Bác sĩ'; }
    else if (user.role === 'RECEPTIONIST') { roleClass = 'role-receptionist'; roleName = 'Lễ tân'; }
    else if (user.role === 'PATIENT') { roleClass = 'role-patient'; roleName = 'Bệnh nhân'; }

    userBadge = `<span class="role-badge ${roleClass}">${roleName}</span>`;
    userName = `<strong>${user.name || user.username}</strong>`;
    authActions = `
      <a href="04-logout.html" class="btn btn-sm btn-secondary" style="color:var(--danger);">Đăng xuất</a>
    `;
  }

  const navHtml = `
    <header class="clinic-header">
      <div class="clinic-header-inner">
        <a href="index.html" class="brand">
          <span class="brand-icon">🦷</span>
          <span>Nha Khoa Nhóm 7</span>
        </a>
        <div class="header-user-status">
          ${userBadge}
          ${userName}
          ${authActions}
        </div>
      </div>
    </header>
  `;

  const mount = document.getElementById('nav-container');
  if (mount) {
    mount.innerHTML = navHtml;
  } else {
    document.body.insertAdjacentHTML('afterbegin', navHtml);
  }
}

function renderBanner(stt, title, roleName, funcName, description) {
  const bannerMount = document.getElementById('banner-container');
  if (!bannerMount) return;

  bannerMount.innerHTML = `
    <a href="index.html" class="nav-back-link">← Quay lại Bảng tổng hợp 23 chức năng</a>
    <div class="feature-banner">
      <h1>
        <span>STT ${stt}: ${title}</span>
      </h1>
      <p>${description}</p>
      <div class="feature-meta">
        <span class="meta-chip">👤 Người thực hiện: <strong>${roleName}</strong></span>
        <span class="meta-chip">⚡ Hàm xử lý: <code>${funcName}</code></span>
        <span class="meta-chip">🐳 Dữ liệu: Docker REST API :8080</span>
      </div>
    </div>
  `;
}
