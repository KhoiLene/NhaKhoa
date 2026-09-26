/**
 * Chức năng 10: Hủy lịch
 * Người thực hiện: Bệnh nhân / Admin
 * Hàm gợi ý: cancelAppointment()
 */

let activeAppointments = [];

document.addEventListener('DOMContentLoaded', async () => {
  renderTopNav(10, 'cancelAppointment()', 'Bệnh nhân / Admin');
  renderBanner(
    10,
    'Hủy lịch hẹn khám',
    'Bệnh nhân / Admin',
    'cancelAppointment()',
    'Hủy lịch hẹn khám của bệnh nhân, ghi nhận lý do hủy và giải phóng khung giờ làm việc của bác sĩ.'
  );

  await loadActiveAppointments();
});

async function loadActiveAppointments() {
  try {
    const res = await fetch(`${API_BASE}/appointments`);
    const data = await res.json();
    if (data.success) {
      activeAppointments = data.data.filter(a => a.status !== 'Đã hủy');
      const select = document.getElementById('cancelApptSelect');
      const urlParams = new URLSearchParams(window.location.search);
      const preselectedId = urlParams.get('id');

      if (!activeAppointments.length) {
        select.innerHTML = '<option value="">-- Hiện không có lịch hẹn nào có thể hủy --</option>';
        document.getElementById('apptDetailBox').innerHTML = '<p style="color:#64748b;">Không có lịch hẹn cần hủy.</p>';
        return;
      }

      select.innerHTML = activeAppointments.map(a => `
        <option value="${a.id}" ${preselectedId === a.id ? 'selected' : ''}>
          [${a.id}] ${a.patientName} - BS: ${a.doctorName} (${a.time} ${a.date})
        </option>
      `).join('');

      loadAppointmentDetail();
    }
  } catch (err) {
    console.error('Lỗi khi tải lịch hẹn:', err);
  }
}

function loadAppointmentDetail() {
  const id = document.getElementById('cancelApptSelect').value;
  const appt = activeAppointments.find(a => a.id === id);
  const box = document.getElementById('apptDetailBox');

  if (appt) {
    box.innerHTML = `
      <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:8px; padding:16px;">
        <h4 style="color:#991b1b; margin-bottom:10px;">Lịch hẹn: ${appt.id}</h4>
        <p><strong>Bệnh nhân:</strong> ${appt.patientName} (${appt.patientPhone || 'Không có SĐT'})</p>
        <p><strong>Bác sĩ:</strong> ${appt.doctorName}</p>
        <p><strong>Dịch vụ:</strong> ${appt.serviceName}</p>
        <p><strong>Thời gian:</strong> <strong>${appt.time}</strong> ngày <strong>${formatDate(appt.date)}</strong></p>
        <p><strong>Phòng khám:</strong> ${appt.room}</p>
        <p><strong>Ghi chú:</strong> ${appt.notes || 'Không có'}</p>
        <p><strong>Trạng thái hiện tại:</strong> <span class="status-pill status-waiting">${appt.status}</span></p>
      </div>
    `;
  } else {
    box.innerHTML = '<p style="color:#64748b;">Chưa chọn lịch hẹn.</p>';
  }
}

async function cancelAppointment(appointmentId, reason) {
  try {
    const res = await fetch(`${API_BASE}/appointments/${appointmentId}/cancel`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    return await res.json();
  } catch (err) {
    console.error('Lỗi khi gọi cancelAppointment():', err);
    return { success: false, message: 'Lỗi kết nối máy chủ' };
  }
}

async function handleCancelSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('cancelApptSelect').value;
  const reason = document.getElementById('cancelReason').value.trim();

  if (!id) {
    showToast('Vui lòng chọn lịch hẹn cần hủy', 'warning');
    return;
  }

  if (!confirm(`Bạn có chắc chắn muốn hủy lịch hẹn mã [${id}]?`)) {
    return;
  }

  const result = await cancelAppointment(id, reason);

  if (result.success) {
    showToast(result.message, 'success');
    document.getElementById('cancelReason').value = '';
    await loadActiveAppointments();
  } else {
    showToast(result.message, 'error');
  }
}
