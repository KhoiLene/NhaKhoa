/**
 * Chức năng 8: Đặt lịch
 * Người thực hiện: Bệnh nhân / Admin
 * Hàm gợi ý: createAppointment()
 */

document.addEventListener('DOMContentLoaded', async () => {
  renderTopNav(8, 'createAppointment()', 'Bệnh nhân / Admin');
  renderBanner(
    8,
    'Đặt lịch khám nha khoa',
    'Bệnh nhân / Admin',
    'createAppointment()',
    'Tạo lịch hẹn khám mới giữa bệnh nhân và bác sĩ chuyên khoa với đầy đủ thông tin dịch vụ và ngày giờ.'
  );

  const today = new Date().toISOString().split('T')[0];
  document.getElementById('apptDate').value = today;

  await loadFormData();
  prefillFromUrl();
});

async function loadFormData() {
  try {
    const [pRes, dRes, sRes] = await Promise.all([
      fetch(`${API_BASE}/patients`),
      fetch(`${API_BASE}/doctors`),
      fetch(`${API_BASE}/services`)
    ]);

    const [pData, dData, sData] = await Promise.all([pRes.json(), dRes.json(), sRes.json()]);
    const user = Session.getUser();

    const pSelect = document.getElementById('apptPatientSelect');
    pSelect.innerHTML = pData.data.map(p => `
      <option value="${p.id}" ${user && user.patientId === p.id ? 'selected' : ''}>
        ${p.name} (${p.phone} - ${p.id})
      </option>
    `).join('');

    const dSelect = document.getElementById('apptDoctorSelect');
    dSelect.innerHTML = dData.data.map(d => `
      <option value="${d.id}">${d.name} - ${d.specialty}</option>
    `).join('');

    const sSelect = document.getElementById('apptServiceSelect');
    sSelect.innerHTML = sData.data.map(s => `
      <option value="${s.id}">${s.name} (${formatCurrency(s.price)})</option>
    `).join('');

  } catch (err) {
    console.error('Lỗi khi tải dữ liệu form đặt lịch:', err);
  }
}

function prefillFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const docId = params.get('doctorId');
  const date = params.get('date');
  const time = params.get('time');

  if (docId) document.getElementById('apptDoctorSelect').value = docId;
  if (date) document.getElementById('apptDate').value = date;
  if (time) document.getElementById('apptTime').value = time;
}

async function createAppointment(appointmentData) {
  try {
    const res = await fetch(`${API_BASE}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appointmentData)
    });
    return await res.json();
  } catch (err) {
    console.error('Lỗi khi gọi createAppointment():', err);
    return { success: false, message: 'Lỗi kết nối máy chủ' };
  }
}

async function handleAppointmentSubmit(e) {
  e.preventDefault();

  const payload = {
    patientId: document.getElementById('apptPatientSelect').value,
    doctorId: document.getElementById('apptDoctorSelect').value,
    serviceId: document.getElementById('apptServiceSelect').value,
    date: document.getElementById('apptDate').value,
    time: document.getElementById('apptTime').value,
    notes: document.getElementById('apptNotes').value.trim()
  };

  const result = await createAppointment(payload);

  const resBox = document.getElementById('appointmentSuccessBox');
  if (result.success) {
    showToast(result.message, 'success');
    resBox.style.display = 'block';
    resBox.innerHTML = `
      <h3 style="color:#166534; margin-bottom:8px;">✅ Đặt lịch thành công!</h3>
      <p><strong>Mã lịch hẹn:</strong> <code>${result.data.id}</code></p>
      <p><strong>Bệnh nhân:</strong> ${result.data.patientName}</p>
      <p><strong>Bác sĩ:</strong> ${result.data.doctorName}</p>
      <p><strong>Dịch vụ:</strong> ${result.data.serviceName}</p>
      <p><strong>Thời gian:</strong> ${result.data.time} ngày ${result.data.date}</p>
      <p><strong>Trạng thái:</strong> <span class="status-pill status-waiting">${result.data.status}</span></p>
      <div style="margin-top:12px;">
        <a href="09-view-appointments.html" class="btn btn-primary btn-sm">Xem danh sách lịch hẹn →</a>
      </div>
    `;
    document.getElementById('appointmentForm').reset();
  } else {
    showToast(result.message, 'error');
  }
}
