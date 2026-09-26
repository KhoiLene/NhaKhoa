/**
 * Chức năng 4: Đăng xuất
 * Người thực hiện: Cả hai (Bệnh nhân & Admin)
 * Hàm gợi ý: logout()
 */

document.addEventListener('DOMContentLoaded', () => {
  renderTopNav(4, 'logout()', 'Cả hai');
  renderBanner(
    4,
    'Đăng xuất hệ thống',
    'Cả hai (Bệnh nhân & Quản trị)',
    'logout()',
    'Hủy bỏ phiên làm việc hiện tại, xóa thông tin đăng nhập và đưa người dùng về trạng thái khách.'
  );

  renderLogoutState();
});

function renderLogoutState() {
  const user = Session.getUser();
  const box = document.getElementById('logoutUserInfo');
  const btn = document.getElementById('btnLogout');

  if (user) {
    box.innerHTML = `
      <p style="font-size:1.05rem; margin-bottom:6px;">Bạn đang đăng nhập với tài khoản: <strong>${user.name || user.username}</strong></p>
      <p style="color:#64748b;">Vai trò hiện tại: <span class="role-badge role-${user.role.toLowerCase()}">${user.role}</span></p>
      <p style="margin-top:10px; font-size:0.9rem; color:#475569;">Bạn có chắc chắn muốn đăng xuất khỏi hệ thống phòng khám?</p>
    `;
    btn.disabled = false;
  } else {
    box.innerHTML = `
      <p style="color:#64748b;">Hiện tại chưa có phiên đăng nhập nào đang hoạt động.</p>
    `;
    btn.disabled = true;
  }
}

async function logout() {
  try {
    const response = await fetch(`${API_BASE}/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    Session.clearUser();
    return data;
  } catch (error) {
    console.error('Lỗi khi gọi logout():', error);
    Session.clearUser();
    return { success: true, message: 'Đã xóa phiên đăng nhập cục bộ' };
  }
}

async function handleLogoutClick() {
  const result = await logout();
  showToast(result.message, 'info');
  renderTopNav(4, 'logout()', 'Cả hai');
  renderLogoutState();

  setTimeout(() => {
    window.location.href = 'index.html';
  }, 1200);
}
