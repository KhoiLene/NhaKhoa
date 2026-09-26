/**
 * Chức năng 11: Đổi lịch
 * Người thực hiện: Bệnh nhân / Admin
 * Hàm gợi ý: rescheduleAppointment()
 */

let appointmentsList = [];

document.addEventListener('DOMContentLoaded', async () => {
  renderTopNav(11, 'rescheduleAppointment()', 'Bệnh nhân / Admin');
  renderBanner(
    11,
    'Đổi lịch khám nha khoa',
    'Bệnh nhân / Admin',
    'rescheduleAppointment()',
    'Dời ngày hoặc giờ khám của lịch hẹn sang thời điểm mới, kiểm tra slot trống và lưu lại vết lịch sử thay đổi.'
  );

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  document.getElementById('newDate').value = tomorrow.toISOString().split('T')[0];

  await loadAppointments();
});

async function loadAppointments() {
  try {
    const res = await fetch(`${API_BASE}/appointments`);
    const data = await res.json();
    if (data.success) {
      appointmentsList = data.data.filter(a => a.status !== 'Đã hủy');
      const select = document.getElementById('rescheduleApptSelect');
      const urlParams = new URLSearchParams(window.location.search);
      const preselectedId = urlParams.get('id');

      if (!appointmentsList.length) {
        select.innerHTML = '<option value="">-- Không có lịch hẹn khả dụng --</option>';
        return;
      }

      select.innerHTML = appointmentsList.map(a => `
        <option value="${a.id}" ${preselectedId === a.id ? 'selected' : ''}>
          [${a.id}] ${a.patientName} - BS: ${a.doctorName} (${a.time} ngày ${a.date})
        </option>
      `).join('');

      loadSelectedAppointment();
    }
  } catch (err) {
    console.error('Lỗi tải lịch hẹn:', err);
  }
}

function loadSelectedAppointment() {
  const id = document.getElementById('rescheduleApptSelect').value;
  const appt = appointmentsList.find(a => a.id === id);
  const box = document.getElementById('currentApptDetailBox');

  if (appt) {
    const historyHtml = (appt.rescheduleHistory || []).map(h => `
      <li style="font-size:0.85rem; color:#475569; margin-top:4px;">
        Dời từ <code>${h.from}</code> sang <code>${h.to}</code> (${h.reason})
      </li>
    `).join('');

    box.innerHTML = `
      <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; padding:16px;">
        <h4 style="color:#1d4ed8; margin-bottom:8px;">Lịch hiện tại: ${appt.id}</h4>
        <p><strong>Bệnh nhân:</strong> ${appt.patientName}</p>
        <p><strong>Bác sĩ:</strong> ${appt.doctorName}</p>
        <p><strong>Dịch vụ:</strong> ${appt.serviceName}</p>
        <p><strong>Thời gian hiện tại:</strong> <span style="color:#b91c1c; font-weight:700;">${appt.time} ngày ${formatDate(appt.date)}</span></p>
        <p><strong>Trạng thái:</strong> <span class="status-pill status-waiting">${appt.status}</span></p>
        
        <h5 style="margin-top:14px; color:#1e40af;">Lịch sử đổi lịch trước đó:</h5>
        ${historyHtml ? `<ul style="margin-left:20px;">${historyHtml}</ul>` : '<p style="font-size:0.85rem; color:#64748b;">Chưa từng đổi lịch.</p>'}
      </div>
    `;
  }
}

async function rescheduleAppointment(appointmentId, newDate, newTime, reason) {
  try {
    const res = await fetch(`${API_BASE}/appointments/${appointmentId}/reschedule`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newDate, newTime, reason })
    });
    return await res.json();
  } catch (err) {
    console.error('Lỗi khi gọi rescheduleAppointment():', err);
    return { success: false, message: 'Lỗi kết nối máy chủ' };
  }
}

async function handleRescheduleSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('rescheduleApptSelect').value;
  const newDate = document.getElementById('newDate').value;
  const newTime = document.getElementById('newTime').value;
  const reason = document.getElementById('rescheduleReason').value.trim();

  if (!id) {
    showToast('Vui lòng chọn lịch hẹn', 'warning');
    return;
  }

  const result = await rescheduleAppointment(id, newDate, newTime, reason);

  if (result.success) {
    showToast(result.message, 'success');
    document.getElementById('rescheduleReason').value = '';
    await loadAppointments();
  } else {
    showToast(result.message, 'error');
  }
}
