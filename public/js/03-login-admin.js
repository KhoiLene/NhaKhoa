/**
 * Chức năng 3: Đăng nhập Admin
 * Người thực hiện: Admin (và Doctor, Receptionist)
 * Hàm gợi ý: loginAdmin()
 */

document.addEventListener('DOMContentLoaded', () => {
  renderTopNav(3, 'loginAdmin()', 'Admin');
  renderBanner(
    3,
    'Đăng nhập Admin / Bác sĩ',
    'Admin',
    'loginAdmin()',
    'Xác thực quyền quản trị viên, bác sĩ khám bệnh hoặc lễ tân tiếp nhận phòng khám.'
  );
  checkAdminSession();
});

function quickLoginAdmin(u, p) {
  document.getElementById('adminUsername').value = u;
  document.getElementById('adminPassword').value = p;
  document.getElementById('loginAdminForm').requestSubmit();
}

async function loginAdmin(username, password) {
  try {
    const response = await fetch(`${API_BASE}/login-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return await response.json();
  } catch (error) {
    console.error('Lỗi khi gọi loginAdmin():', error);
    return { success: false, message: 'Lỗi kết nối tới máy chủ Docker!' };
  }
}

async function handleAdminLogin(event) {
  event.preventDefault();
  const u = document.getElementById('adminUsername').value.trim();
  const p = document.getElementById('adminPassword').value;

  const result = await loginAdmin(u, p);

  if (result.success) {
    Session.setUser(result.user);
    showToast(result.message, 'success');
    renderTopNav(3, 'loginAdmin()', 'Admin');
    checkAdminSession();
  } else {
    showToast(result.message, 'error');
  }
}

function checkAdminSession() {
  const user = Session.getUser();
  const statusBox = document.getElementById('adminSessionStatus');

  if (user && ['ADMIN', 'DOCTOR', 'RECEPTIONIST'].includes(user.role)) {
    let roleText = 'Quản trị viên';
    let nextLinks = `
      <a href="05-manage-patient.html" class="btn btn-primary btn-sm">Quản lý Bệnh nhân</a>
      <a href="06-manage-doctor.html" class="btn btn-secondary btn-sm">Quản lý Bác sĩ</a>
      <a href="16-manage-service.html" class="btn btn-secondary btn-sm">Quản lý Dịch vụ</a>
      <a href="23-manage-account.html" class="btn btn-secondary btn-sm">Quản lý Tài khoản</a>
    `;

    if (user.role === 'DOCTOR') {
      roleText = 'Bác sĩ chuyên khoa';
      nextLinks = `
        <a href="13-examine-patient.html" class="btn btn-primary btn-sm">Khám lâm sàng</a>
        <a href="14-create-treatment-record.html" class="btn btn-secondary btn-sm">Lập bệnh án</a>
        <a href="17-create-treatment-plan.html" class="btn btn-secondary btn-sm">Lập phác đồ</a>
      `;
    } else if (user.role === 'RECEPTIONIST') {
      roleText = 'Lễ tân tiếp nhận';
      nextLinks = `
        <a href="12-receive-patient.html" class="btn btn-primary btn-sm">Tiếp nhận bệnh nhân</a>
        <a href="08-create-appointment.html" class="btn btn-secondary btn-sm">Đặt lịch khám</a>
        <a href="20-make-payment.html" class="btn btn-secondary btn-sm">Thu ngân / Thanh toán</a>
      `;
    }

    statusBox.innerHTML = `
      <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; padding:16px;">
        <h3 style="color:#1e40af; margin-bottom:8px;">✅ Đã xác thực: ${user.name}</h3>
        <p><strong>Vai trò:</strong> ${roleText} [<code>${user.role}</code>]</p>
        <p><strong>Tên đăng nhập:</strong> ${user.username}</p>
        ${user.doctorId ? `<p><strong>Mã bác sĩ:</strong> ${user.doctorId}</p>` : ''}
        <hr style="margin:12px 0; border:none; border-top:1px solid #dbeafe;">
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          ${nextLinks}
          <a href="04-logout.html" class="btn btn-danger btn-sm">Đăng xuất</a>
        </div>
      </div>
    `;
  } else {
    statusBox.innerHTML = `
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:16px;">
        <p style="color:#64748b;">Chưa có tài khoản quản trị nào đăng nhập.</p>
        <p style="font-size:0.85rem; margin-top:8px;">Vui lòng chọn tài khoản mẫu phía bên trái để đăng nhập thử nghiệm.</p>
      </div>
    `;
  }
}
