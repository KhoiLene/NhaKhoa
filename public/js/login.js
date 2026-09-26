/**
 * Unified Login Controller for Nha Khoa Nhóm 7
 * Cổng đăng nhập tập trung cho tất cả vai trò: Admin, Bác sĩ, Lễ tân, Bệnh nhân
 */

document.addEventListener('DOMContentLoaded', () => {
  renderTopNav(0, 'Đăng Nhập', 'Toàn bộ');

  const currentUser = Session.getUser();
  if (currentUser) {
    showToast('Bạn đang đăng nhập với tài khoản: ' + currentUser.name + ' (' + currentUser.role + ')', 'info');
  }
});

async function handleUnifiedLogin(e) {
  if (e) e.preventDefault();

  const usernameInput = document.getElementById('loginInput');
  const passwordInput = document.getElementById('passwordInput');
  const btn = document.getElementById('btnSubmitLogin');

  const username = usernameInput ? usernameInput.value.trim() : '';
  const password = passwordInput ? passwordInput.value : '';

  if (!username || !password) {
    showToast('Vui lòng nhập đầy đủ tài khoản và mật khẩu!', 'warning');
    return;
  }

  const originalBtnText = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>⏳ Đang xác thực thông tin...</span>';
  }

  try {
    const res = await fetch(API_BASE + '/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      showToast(data.message || 'Đăng nhập không thành công, vui lòng kiểm tra lại!', 'error');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalBtnText;
      }
      return;
    }

    // Save session
    Session.setUser(data.user);

    let roleGreeting = 'Khách hàng';
    let redirectUrl = 'index.html';

    if (data.user.role === 'ADMIN') {
      roleGreeting = 'Quản trị viên ' + data.user.name;
      redirectUrl = 'index.html';
    } else if (data.user.role === 'DOCTOR') {
      roleGreeting = 'Bác sĩ ' + data.user.name;
      redirectUrl = '13-examine-patient.html';
    } else if (data.user.role === 'RECEPTIONIST') {
      roleGreeting = 'Lễ tân ' + data.user.name;
      redirectUrl = '12-receive-patient.html';
    } else if (data.user.role === 'PATIENT') {
      roleGreeting = 'Bệnh nhân ' + data.user.name;
      redirectUrl = '08-create-appointment.html';
    }

    showToast('🎉 Xin chào ' + roleGreeting + '! Đăng nhập thành công.', 'success');

    const urlParams = new URLSearchParams(window.location.search);
    const returnUrl = urlParams.get('redirect');
    if (returnUrl) {
      redirectUrl = returnUrl;
    }

    setTimeout(() => {
      window.location.href = redirectUrl;
    }, 800);

  } catch (err) {
    console.error('Lỗi kết nối khi đăng nhập:', err);
    showToast('Lỗi kết nối đến máy chủ Docker. Vui lòng kiểm tra lại!', 'error');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalBtnText;
    }
  }
}

function quickFillAndLogin(username, password) {
  const usernameInput = document.getElementById('loginInput');
  const passwordInput = document.getElementById('passwordInput');
  if (usernameInput) usernameInput.value = username;
  if (passwordInput) passwordInput.value = password;

  handleUnifiedLogin();
}

function togglePasswordVisibility() {
  const passwordInput = document.getElementById('passwordInput');
  const btn = document.querySelector('.pwd-toggle');
  if (!passwordInput) return;

  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    if (btn) btn.innerText = '🙈';
  } else {
    passwordInput.type = 'password';
    if (btn) btn.innerText = '👁️';
  }
}

function alertForgotPwd() {
  alert('Để khôi phục mật khẩu, vui lòng liên hệ Lễ tân Huy hoặc Quản trị viên Chung qua hotline 1900 6868!');
}
