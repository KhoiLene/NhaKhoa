/**
 * Chức năng 6: Quản lý bác sĩ
 * Người thực hiện: Admin
 * Hàm gợi ý: add/update/delete/searchDoctor()
 */

let doctorsCache = [];

document.addEventListener('DOMContentLoaded', () => {
  renderTopNav(6, 'add/update/delete/searchDoctor()', 'Admin');
  renderBanner(
    6,
    'Quản lý bác sĩ',
    'Admin',
    'add/update/delete/searchDoctor()',
    'Quản lý danh sách bác sĩ chuyên khoa răng hàm mặt, thời gian làm việc và lịch công tác.'
  );

  searchDoctor();
});

async function searchDoctor(keyword = '') {
  try {
    const url = keyword ? `${API_BASE}/doctors?search=${encodeURIComponent(keyword)}` : `${API_BASE}/doctors`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.success) {
      doctorsCache = data.data;
      renderDoctorTable(doctorsCache);
      document.getElementById('doctorCountBadge').innerText = `${data.count} bác sĩ`;
    }
  } catch (err) {
    console.error('Lỗi khi gọi searchDoctor():', err);
    showToast('Lỗi khi tải danh sách bác sĩ', 'error');
  }
}

async function addDoctor(doctorData) {
  try {
    const res = await fetch(`${API_BASE}/doctors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doctorData)
    });
    return await res.json();
  } catch (err) {
    console.error('Lỗi khi gọi addDoctor():', err);
    return { success: false, message: 'Lỗi kết nối máy chủ' };
  }
}

async function updateDoctor(id, doctorData) {
  try {
    const res = await fetch(`${API_BASE}/doctors/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doctorData)
    });
    return await res.json();
  } catch (err) {
    console.error('Lỗi khi gọi updateDoctor():', err);
    return { success: false, message: 'Lỗi kết nối máy chủ' };
  }
}

async function deleteDoctor(id) {
  if (!confirm(`Bạn có chắc chắn muốn xóa bác sĩ mã [${id}]?`)) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/doctors/${id}`, {
      method: 'DELETE'
    });
    const result = await res.json();
    if (result.success) {
      showToast(result.message, 'success');
      searchDoctor();
    } else {
      showToast(result.message, 'error');
    }
  } catch (err) {
    console.error('Lỗi khi gọi deleteDoctor():', err);
    showToast('Lỗi khi xóa bác sĩ', 'error');
  }
}

function handleSearchDoctor() {
  const query = document.getElementById('doctorSearchInput').value.trim();
  searchDoctor(query);
}

function renderDoctorTable(list) {
  const tbody = document.getElementById('doctorTableBody');
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#94a3b8; padding:24px;">Không tìm thấy bác sĩ nào</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(d => {
    const sched = Array.isArray(d.schedule) ? d.schedule.join(', ') : d.schedule;
    return `
      <tr>
        <td><strong>${d.id}</strong></td>
        <td>
          <strong>${d.name}</strong>
          <div style="font-size:0.8rem; color:#64748b;">${d.experience || ''}</div>
        </td>
        <td><span class="status-pill status-received">${d.specialty}</span></td>
        <td>${d.phone}</td>
        <td style="font-size:0.85rem;">${sched}</td>
        <td><code>${d.workHours || '08:00 - 17:30'}</code></td>
        <td style="text-align:right;">
          <a href="07-check-doctor-schedule.html?doctorId=${d.id}" class="btn btn-secondary btn-sm" title="Kiểm tra lịch rảnh">Xem lịch</a>
          <button class="btn btn-secondary btn-sm" onclick="openEditDoctorModal('${d.id}')">Sửa</button>
          <button class="btn btn-danger btn-sm" onclick="deleteDoctor('${d.id}')">Xóa</button>
        </td>
      </tr>
    `;
  }).join('');
}

function openAddDoctorModal() {
  document.getElementById('modalDocTitle').innerText = 'Thêm Bác sĩ Mới - addDoctor()';
  document.getElementById('modalDocId').value = '';
  document.getElementById('doctorForm').reset();
  document.getElementById('doctorModal').style.display = 'flex';
}

function openEditDoctorModal(id) {
  const d = doctorsCache.find(item => item.id === id);
  if (!d) return;

  document.getElementById('modalDocTitle').innerText = `Sửa Bác sĩ [${id}] - updateDoctor()`;
  document.getElementById('modalDocId').value = d.id;
  document.getElementById('modalDocName').value = d.name || '';
  document.getElementById('modalDocSpecialty').value = d.specialty || '';
  document.getElementById('modalDocPhone').value = d.phone || '';
  document.getElementById('modalDocEmail').value = d.email || '';
  document.getElementById('modalDocHours').value = d.workHours || '08:00 - 17:30';
  document.getElementById('modalDocSchedule').value = Array.isArray(d.schedule) ? d.schedule.join(', ') : (d.schedule || '');
  document.getElementById('modalDocExp').value = d.experience || '';

  document.getElementById('doctorModal').style.display = 'flex';
}

function closeDoctorModal() {
  document.getElementById('doctorModal').style.display = 'none';
}

async function handleDoctorFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('modalDocId').value;
  const schedStr = document.getElementById('modalDocSchedule').value.trim();
  const schedule = schedStr ? schedStr.split(',').map(s => s.trim()) : [];

  const payload = {
    name: document.getElementById('modalDocName').value.trim(),
    specialty: document.getElementById('modalDocSpecialty').value.trim(),
    phone: document.getElementById('modalDocPhone').value.trim(),
    email: document.getElementById('modalDocEmail').value.trim(),
    workHours: document.getElementById('modalDocHours').value.trim(),
    schedule,
    experience: document.getElementById('modalDocExp').value.trim()
  };

  let result;
  if (id) {
    result = await updateDoctor(id, payload);
  } else {
    result = await addDoctor(payload);
  }

  if (result.success) {
    showToast(result.message, 'success');
    closeDoctorModal();
    searchDoctor();
  } else {
    showToast(result.message, 'error');
  }
}
