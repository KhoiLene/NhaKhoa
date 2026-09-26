/**
 * Chức năng 9: Xem lịch khám
 * Người thực hiện: Bệnh nhân / Admin
 * Hàm gợi ý: viewAppointments()
 */

let allAppointments = [];

document.addEventListener('DOMContentLoaded', async () => {
  renderTopNav(9, 'viewAppointments()', 'Bệnh nhân / Admin');
  renderBanner(
    9,
    'Xem danh sách lịch khám',
    'Bệnh nhân / Admin',
    'viewAppointments()',
    'Tra cứu và quản lý toàn diện các lịch khám bệnh theo ngày, bác sĩ phụ trách và trạng thái điều trị.'
  );

  await loadDoctorFilter();
  await viewAppointments();
});

async function loadDoctorFilter() {
  try {
    const res = await fetch(`${API_BASE}/doctors`);
    const data = await res.json();
    if (data.success) {
      const select = document.getElementById('filterDoctor');
      data.data.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.id;
        opt.innerText = d.name;
        select.appendChild(opt);
      });
    }
  } catch (e) {
    console.error('Lỗi tải bác sĩ cho bộ lọc:', e);
  }
}

async function viewAppointments(filters = {}) {
  try {
    const query = new URLSearchParams(filters).toString();
    const url = query ? `${API_BASE}/appointments?${query}` : `${API_BASE}/appointments`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.success) {
      allAppointments = data.data;
      renderTable(allAppointments);
      document.getElementById('apptCountBadge').innerText = `${data.count} lịch khám`;
      return data.data;
    }
  } catch (err) {
    console.error('Lỗi khi gọi viewAppointments():', err);
    showToast('Lỗi khi tải lịch khám', 'error');
  }
}

function handleFilterAppointments() {
  const date = document.getElementById('filterDate').value;
  const doctorId = document.getElementById('filterDoctor').value;
  const status = document.getElementById('filterStatus').value;

  const filters = {};
  if (date) filters.date = date;
  if (doctorId) filters.doctorId = doctorId;
  if (status) filters.status = status;

  viewAppointments(filters);
}

function resetFilters() {
  document.getElementById('filterDate').value = '';
  document.getElementById('filterDoctor').value = '';
  document.getElementById('filterStatus').value = '';
  viewAppointments({});
}

function renderTable(list) {
  const tbody = document.getElementById('appointmentsTableBody');
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:#94a3b8; padding:24px;">Không có lịch khám nào phù hợp</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(a => {
    let statusClass = 'status-waiting';
    if (a.status === 'Đã tiếp nhận') statusClass = 'status-received';
    else if (a.status === 'Đang điều trị') statusClass = 'status-treating';
    else if (a.status === 'Đã hoàn thành') statusClass = 'status-done';
    else if (a.status === 'Đã hủy') statusClass = 'status-cancelled';

    return `
      <tr>
        <td><strong>${a.id}</strong></td>
        <td>
          <strong>${a.patientName}</strong>
          <div style="font-size:0.75rem; color:#64748b;">${a.patientPhone || ''}</div>
        </td>
        <td>${a.doctorName}</td>
        <td>${a.serviceName}</td>
        <td>
          <strong>${a.time}</strong> - ${formatDate(a.date)}
        </td>
        <td>${a.room || 'Phòng chờ'}</td>
        <td><span class="status-pill ${statusClass}">${a.status}</span></td>
        <td style="text-align:right;">
          ${a.status !== 'Đã hủy' ? `
            <a href="12-receive-patient.html?id=${a.id}" class="btn btn-secondary btn-sm" title="Tiếp nhận BN">Tiếp nhận</a>
            <a href="11-reschedule-appointment.html?id=${a.id}" class="btn btn-secondary btn-sm" title="Đổi ngày giờ">Đổi lịch</a>
            <a href="10-cancel-appointment.html?id=${a.id}" class="btn btn-danger btn-sm" title="Hủy lịch hẹn">Hủy</a>
          ` : `<span style="font-size:0.8rem; color:#94a3b8;">Đã đóng</span>`}
        </td>
      </tr>
    `;
  }).join('');
}
