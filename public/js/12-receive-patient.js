/**
 * Chức năng 12: Tiếp nhận
 * Người thực hiện: Admin / Lễ tân
 * Hàm gợi ý: receivePatient()
 */

let appointmentsToReceive = [];

document.addEventListener('DOMContentLoaded', async () => {
  renderTopNav(12, 'receivePatient()', 'Admin / Lễ tân');
  renderBanner(
    12,
    'Tiếp nhận bệnh nhân đến khám',
    'Admin / Lễ tân',
    'receivePatient()',
    'Xác nhận bệnh nhân đã có mặt tại phòng khám, phân bổ ghế/phòng nha và chuyển trạng thái sẵn sàng cho bác sĩ khám.'
  );

  await loadPendingReceives();
});

async function loadPendingReceives() {
  try {
    const res = await fetch(`${API_BASE}/appointments`);
    const data = await res.json();
    if (data.success) {
      appointmentsToReceive = data.data.filter(a => a.status === 'Chờ khám' || a.status === 'Đã tiếp nhận');
      renderReceiveTable(appointmentsToReceive);
    }
  } catch (err) {
    console.error('Lỗi khi tải danh sách tiếp nhận:', err);
  }
}

function renderReceiveTable(list) {
  const tbody = document.getElementById('receiveTableBody');
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:#94a3b8; padding:24px;">Hiện không có bệnh nhân nào chờ tiếp nhận</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(a => {
    const isReceived = a.status === 'Đã tiếp nhận';
    return `
      <tr>
        <td><strong>${a.id}</strong></td>
        <td><strong>${a.patientName}</strong></td>
        <td>${a.patientPhone || '--'}</td>
        <td>${a.doctorName}</td>
        <td>${a.serviceName}</td>
        <td><strong>${a.time}</strong> ngày ${formatDate(a.date)}</td>
        <td>
          <span class="status-pill ${isReceived ? 'status-received' : 'status-waiting'}">
            ${a.status}
          </span>
        </td>
        <td style="text-align:right;">
          ${!isReceived ? `
            <button class="btn btn-success btn-sm" onclick="openReceiveModal('${a.id}', '${a.patientName}')">
              ✅ Tiếp nhận vào khám
            </button>
          ` : `
            <a href="13-examine-patient.html?appointmentId=${a.id}&patientId=${a.patientId}&doctorId=${a.doctorId}" class="btn btn-primary btn-sm">
              Chuyển Bác sĩ khám →
            </a>
          `}
        </td>
      </tr>
    `;
  }).join('');
}

function openReceiveModal(id, patientName) {
  document.getElementById('receiveApptId').value = id;
  document.getElementById('receiveModalTitle').innerText = `Tiếp nhận: ${patientName} [${id}]`;
  document.getElementById('receiveModal').style.display = 'flex';
}

function closeReceiveModal() {
  document.getElementById('receiveModal').style.display = 'none';
}

async function receivePatient(appointmentId, room, receptionistNote) {
  try {
    const res = await fetch(`${API_BASE}/appointments/${appointmentId}/receive`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room, receptionistNote })
    });
    return await res.json();
  } catch (err) {
    console.error('Lỗi khi gọi receivePatient():', err);
    return { success: false, message: 'Lỗi kết nối máy chủ' };
  }
}

async function handleReceiveSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('receiveApptId').value;
  const room = document.getElementById('receiveRoom').value;
  const note = document.getElementById('receiveNote').value.trim();

  const result = await receivePatient(id, room, note);

  if (result.success) {
    showToast(result.message, 'success');
    closeReceiveModal();
    await loadPendingReceives();
  } else {
    showToast(result.message, 'error');
  }
}
