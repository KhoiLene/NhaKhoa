/**
 * Chức năng 21: Đặt lịch tái khám
 * Người thực hiện: Bệnh nhân / Admin
 * Hàm gợi ý: bookFollowUpAppointment()
 */

document.addEventListener('DOMContentLoaded', async () => {
  renderTopNav(21, 'bookFollowUpAppointment()', 'Bệnh nhân / Admin');
  renderBanner(
    21,
    'Đặt lịch tái khám định kỳ',
    'Bệnh nhân / Admin',
    'bookFollowUpAppointment()',
    'Hẹn ngày giờ bệnh nhân quay lại phòng khám để kiểm tra hồi phục, tháo chỉ, trám vĩnh viễn hoặc theo dõi chỉnh nha.'
  );

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  document.getElementById('followUpDate').value = nextWeek.toISOString().split('T')[0];

  await loadInitialOptions();
  prefillPatient();
  await loadFollowUps();
});

async function loadInitialOptions() {
  try {
    const [pRes, dRes] = await Promise.all([
      fetch(`${API_BASE}/patients`),
      fetch(`${API_BASE}/doctors`)
    ]);

    const [pData, dData] = await Promise.all([pRes.json(), dRes.json()]);

    const pSelect = document.getElementById('followUpPatientSelect');
    pSelect.innerHTML = pData.data.map(p => `<option value="${p.id}">${p.name} (${p.id})</option>`).join('');

    const dSelect = document.getElementById('followUpDoctorSelect');
    dSelect.innerHTML = dData.data.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
  } catch (err) {
    console.error('Lỗi tải danh mục options tái khám:', err);
  }
}

function prefillPatient() {
  const params = new URLSearchParams(window.location.search);
  const patId = params.get('patientId');
  if (patId) document.getElementById('followUpPatientSelect').value = patId;
}

async function loadFollowUps() {
  try {
    const res = await fetch(`${API_BASE}/follow-ups`);
    const data = await res.json();
    const container = document.getElementById('followUpsListContainer');

    if (data.success && data.data.length) {
      container.innerHTML = data.data.map(f => `
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:14px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong style="color:var(--primary-dark); font-size:1.05rem;">${f.id} - ${f.patientName}</strong>
            <span class="status-pill status-received">${f.status}</span>
          </div>
          <p style="font-size:0.85rem; color:#64748b; margin-top:4px;">
            Bác sĩ: <strong>${f.doctorName}</strong> | SĐT: ${f.patientPhone || '--'}
          </p>
          <p style="margin-top:6px; font-size:0.9rem;">
            ⏰ Thời gian: <strong style="color:#0f766e;">${f.followUpTime} ngày ${formatDate(f.followUpDate)}</strong>
          </p>
          <p style="font-size:0.85rem; color:#334155; margin-top:4px;">
            <strong>Mục đích:</strong> ${f.purpose}
          </p>
          <div style="margin-top:10px; display:flex; gap:8px;">
            <a href="09-view-appointments.html" class="btn btn-secondary btn-sm" style="font-size:0.75rem;">
              Xem trong lịch khám chung →
            </a>
          </div>
        </div>
      `).join('');
    } else {
      container.innerHTML = '<p style="color:#94a3b8; text-align:center; padding:16px;">Chưa có lịch tái khám nào.</p>';
    }
  } catch (err) {
    console.error('Lỗi khi tải lịch tái khám:', err);
  }
}

async function bookFollowUpAppointment(followUpData) {
  try {
    const res = await fetch(`${API_BASE}/follow-ups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(followUpData)
    });
    return await res.json();
  } catch (err) {
    console.error('Lỗi khi gọi bookFollowUpAppointment():', err);
    return { success: false, message: 'Lỗi kết nối máy chủ' };
  }
}

async function handleFollowUpSubmit(e) {
  e.preventDefault();

  const patientId = document.getElementById('followUpPatientSelect').value;
  const doctorId = document.getElementById('followUpDoctorSelect').value;
  const followUpDate = document.getElementById('followUpDate').value;
  const followUpTime = document.getElementById('followUpTime').value;
  const purpose = document.getElementById('followUpPurpose').value.trim();

  const payload = { patientId, doctorId, followUpDate, followUpTime, purpose };
  const result = await bookFollowUpAppointment(payload);

  if (result.success) {
    showToast(result.message, 'success');
    document.getElementById('followUpPurpose').value = '';
    await loadFollowUps();
  } else {
    showToast(result.message, 'error');
  }
}
