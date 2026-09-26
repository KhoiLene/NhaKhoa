/**
 * Chức năng 1: Đăng ký bệnh nhân
 * Người thực hiện: Bệnh nhân
 * Hàm gợi ý: register()
 */

document.addEventListener('DOMContentLoaded', () => {
  renderTopNav(1, 'register()', 'Bệnh nhân');
  renderBanner(
    1,
    'Đăng ký bệnh nhân',
    'Bệnh nhân',
    'register()',
    'Cho phép bệnh nhân mới tạo hồ sơ y bạ điện tử và tài khoản đăng nhập phòng khám.'
  );
});

async function register(patientData) {
  try {
    const response = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patientData)
    });
    return await response.json();
  } catch (error) {
    console.error('Lỗi khi gọi register():', error);
    return { success: false, message: 'Lỗi kết nối máy chủ Docker!' };
  }
}

async function handleRegisterSubmit(event) {
  event.preventDefault();

  const patientData = {
    name: document.getElementById('regName').value.trim(),
    phone: document.getElementById('regPhone').value.trim(),
    password: document.getElementById('regPassword').value,
    email: document.getElementById('regEmail').value.trim(),
    dob: document.getElementById('regDob').value,
    gender: document.getElementById('regGender').value,
    address: document.getElementById('regAddress').value.trim(),
    medicalHistory: document.getElementById('regMedicalHistory').value.trim()
  };

  const resBox = document.getElementById('registerResult');
  resBox.style.display = 'block';
  resBox.innerHTML = '<p>⏳ Đang xử lý đăng ký qua Docker REST API...</p>';

  const result = await register(patientData);

  if (result.success) {
    showToast(result.message, 'success');
    resBox.style.background = '#f0fdf4';
    resBox.style.borderColor = '#86efac';
    resBox.innerHTML = `
      <h3 style="color:#166534; margin-bottom:10px;">🎉 Đăng ký thành công!</h3>
      <p><strong>Mã bệnh nhân:</strong> ${result.patient.id}</p>
      <p><strong>Họ tên:</strong> ${result.patient.name}</p>
      <p><strong>Số điện thoại:</strong> ${result.patient.phone}</p>
      <p><strong>Tài khoản hệ thống:</strong> ${result.account.username}</p>
      <div style="margin-top:14px;">
        <a href="02-login-patient.html" class="btn btn-primary btn-sm">Chuyển sang Đăng nhập Bệnh nhân →</a>
      </div>
    `;
    document.getElementById('registerForm').reset();
  } else {
    showToast(result.message, 'error');
    resBox.style.background = '#fef2f2';
    resBox.style.borderColor = '#fca5a5';
    resBox.innerHTML = `
      <h3 style="color:#991b1b; margin-bottom:10px;">❌ Đăng ký thất bại</h3>
      <p style="color:#b91c1c;">${result.message}</p>
    `;
  }
}
