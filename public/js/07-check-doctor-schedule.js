/**
 * Chức năng 7: Kiểm tra lịch bác sĩ
 * Người thực hiện: Admin / Bệnh nhân
 * Hàm gợi ý: checkDoctorSchedule()
 */

document.addEventListener('DOMContentLoaded', async () => {
  renderTopNav(7, 'checkDoctorSchedule()', 'Admin / Bệnh nhân');
  renderBanner(
    7,
    'Kiểm tra lịch bác sĩ',
    'Admin / Bệnh nhân',
    'checkDoctorSchedule()',
    'Tra cứu ca trực và kiểm tra chi tiết các khung giờ còn trống hoặc đã có hẹn của bác sĩ theo ngày.'
  );

  const today = new Date().toISOString().split('T')[0];
  document.getElementById('scheduleDateInput').value = today;

  await loadDoctorSelect();
});

async function loadDoctorSelect() {
  try {
    const res = await fetch(`${API_BASE}/doctors`);
    const data = await res.json();
    if (data.success && data.data.length) {
      const select = document.getElementById('scheduleDoctorSelect');
      const urlParams = new URLSearchParams(window.location.search);
      const preselectedId = urlParams.get('doctorId');

      select.innerHTML = data.data.map(d => `
        <option value="${d.id}" ${preselectedId === d.id ? 'selected' : ''}>
          ${d.name} (${d.specialty})
        </option>
      `).join('');

      handleDoctorChange();
    }
  } catch (e) {
    console.error('Lỗi khi tải bác sĩ:', e);
  }
}

async function checkDoctorSchedule(doctorId, date) {
  try {
    const res = await fetch(`${API_BASE}/doctors/${doctorId}/schedule?date=${date}`);
    return await res.json();
  } catch (err) {
    console.error('Lỗi khi gọi checkDoctorSchedule():', err);
    return { success: false, message: 'Lỗi kết nối máy chủ' };
  }
}

async function handleDoctorChange() {
  const doctorId = document.getElementById('scheduleDoctorSelect').value;
  const date = document.getElementById('scheduleDateInput').value;
  if (!doctorId || !date) return;

  const result = await checkDoctorSchedule(doctorId, date);

  if (result.success) {
    renderDoctorProfile(result.doctor);
    renderSlots(result.slots, result.summary, date, doctorId);
    showToast(`Đã kiểm tra lịch bác sĩ ${result.doctor.name}`, 'info');
  } else {
    showToast(result.message, 'error');
  }
}

function renderDoctorProfile(doc) {
  const box = document.getElementById('doctorProfileBox');
  const workingDays = Array.isArray(doc.workingDays) ? doc.workingDays.join(', ') : doc.workingDays;
  box.innerHTML = `
    <h4 style="color:var(--primary-dark); font-size:1.1rem; margin-bottom:8px;">${doc.name}</h4>
    <p><strong>Mã bác sĩ:</strong> ${doc.id}</p>
    <p><strong>Chuyên khoa:</strong> ${doc.specialty}</p>
    <p><strong>Giờ làm việc:</strong> <code>${doc.workHours}</code></p>
    <p><strong>Lịch trực tuần:</strong> ${workingDays}</p>
  `;
}

function renderSlots(slots, summary, date, doctorId) {
  const grid = document.getElementById('slotsGrid');
  const badge = document.getElementById('slotSummaryBadge');
  badge.innerText = `Còn trống ${summary.availableSlots}/${summary.totalSlots} khung giờ`;

  grid.innerHTML = slots.map(s => {
    if (s.available) {
      return `
        <div style="background:#f0fdf4; border:1px solid #86efac; border-radius:8px; padding:12px; text-align:center;">
          <div style="font-size:1.15rem; font-weight:700; color:#166534;">${s.time}</div>
          <span style="font-size:0.75rem; color:#15803d; font-weight:600;">🟢 Trống</span>
          <div style="margin-top:8px;">
            <a href="08-create-appointment.html?doctorId=${doctorId}&date=${date}&time=${s.time}" class="btn btn-primary btn-sm" style="font-size:0.75rem; padding:4px 8px;">Đặt giờ này</a>
          </div>
        </div>
      `;
    } else {
      return `
        <div style="background:#fef2f2; border:1px solid #fca5a5; border-radius:8px; padding:12px; text-align:center; opacity:0.85;">
          <div style="font-size:1.15rem; font-weight:700; color:#991b1b;">${s.time}</div>
          <span style="font-size:0.75rem; color:#b91c1c; font-weight:600;">🔴 Đã kín (${s.patientName})</span>
          <div style="margin-top:8px; font-size:0.75rem; color:#64748b;">
            Mã: ${s.bookedAppointmentId}
          </div>
        </div>
      `;
    }
  }).join('');
}
