/**
 * Chức năng 2: Đăng nhập bệnh nhân
 * Người thực hiện: Bệnh nhân
 * Hàm gợi ý: loginPatient()
 */

document.addEventListener('DOMContentLoaded', () => {
  renderTopNav(2, 'loginPatient()', 'Bệnh nhân');
  renderBanner(
    2,
    'Đăng nhập bệnh nhân',
    'Bệnh nhân',
    'loginPatient()',
    'Xác thực thông tin đăng nhập của bệnh nhân bằng số điện thoại và mật khẩu.'
  );
  checkCurrentSession();
});

function quickFill(phone, pass) {
  document.getElementById('loginUsername').value = phone;
  document.getElementById('loginPassword').value = pass;
}

async function loginPatient(username, password) {
  try {
    const response = await fetch(`${API_BASE}/login-patient`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return await response.json();
  } catch (error) {
    console.error('Lỗi khi gọi loginPatient():', error);
    return { success: false, message: 'Không thể kết nối đến máy chủ Docker!' };
  }
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  const u = document.getElementById('loginUsername').value.trim();
  const p = document.getElementById('loginPassword').value;

  const result = await loginPatient(u, p);

  if (result.success) {
    Session.setUser(result.user);
    showToast(result.message, 'success');
    renderTopNav(2, 'loginPatient()', 'Bệnh nhân');
    checkCurrentSession();
  } else {
    showToast(result.message, 'error');
  }
}

function checkCurrentSession() {
  const user = Session.getUser();
  const statusBox = document.getElementById('patientSessionStatus');

  if (user && user.role === 'PATIENT') {
    statusBox.innerHTML = `
      <div style="background:#f0fdf4; border:1px solid #86efac; border-radius:8px; padding:16px;">
        <h3 style="color:#166534; margin-bottom:8px;">✅ Đang đăng nhập: ${user.name}</h3>
        <p><strong>Mã bệnh nhân:</strong> ${user.patientId}</p>
        <p><strong>Số điện thoại:</strong> ${user.phone}</p>
        <p><strong>Email:</strong> ${user.email || 'Chưa cập nhật'}</p>
        <hr style="margin:12px 0; border:none; border-top:1px solid #bbf7d0;">
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <a href="08-create-appointment.html" class="btn btn-primary btn-sm">Đặt lịch khám ngay →</a>
          <a href="09-view-appointments.html" class="btn btn-secondary btn-sm">Xem lịch của tôi</a>
          <a href="22-view-treatment-history.html" class="btn btn-secondary btn-sm">Xem hồ sơ bệnh án</a>
          <a href="04-logout.html" class="btn btn-danger btn-sm">Đăng xuất</a>
        </div>
      </div>
    `;
  } else {
    statusBox.innerHTML = `
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:16px;">
        <p style="color:#64748b;">Hiện tại chưa có bệnh nhân nào đăng nhập.</p>
        <p style="font-size:0.85rem; margin-top:8px;">Vui lòng nhập SĐT & mật khẩu ở form bên cạnh hoặc tạo tài khoản mới tại <a href="01-register.html">Đăng ký bệnh nhân</a>.</p>
      </div>
    `;
  }
}
