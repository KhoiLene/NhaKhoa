/**
 * Chức năng 5: Quản lý bệnh nhân
 * Người thực hiện: Admin
 * Hàm gợi ý: add/update/delete/searchPatient()
 */

let patientsCache = [];

document.addEventListener('DOMContentLoaded', () => {
  renderTopNav(5, 'add/update/delete/searchPatient()', 'Admin');
  renderBanner(
    5,
    'Quản lý bệnh nhân',
    'Admin',
    'add/update/delete/searchPatient()',
    'Tìm kiếm, thêm mới, cập nhật thông tin và xóa hồ sơ bệnh nhân nha khoa.'
  );

  searchPatient();
});

async function searchPatient(keyword = '') {
  try {
    const url = keyword ? `${API_BASE}/patients?search=${encodeURIComponent(keyword)}` : `${API_BASE}/patients`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.success) {
      patientsCache = data.data;
      renderPatientTable(patientsCache);
      document.getElementById('patientCountBadge').innerText = `${data.count} bệnh nhân`;
    }
  } catch (err) {
    console.error('Lỗi khi gọi searchPatient():', err);
    showToast('Lỗi khi tải danh sách bệnh nhân', 'error');
  }
}

async function addPatient(patientData) {
  try {
    const res = await fetch(`${API_BASE}/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patientData)
    });
    return await res.json();
  } catch (err) {
    console.error('Lỗi khi gọi addPatient():', err);
    return { success: false, message: 'Lỗi kết nối máy chủ' };
  }
}

async function updatePatient(id, patientData) {
  try {
    const res = await fetch(`${API_BASE}/patients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patientData)
    });
    return await res.json();
  } catch (err) {
    console.error('Lỗi khi gọi updatePatient():', err);
    return { success: false, message: 'Lỗi kết nối máy chủ' };
  }
}

async function deletePatient(id) {
  if (!confirm(`Bạn có chắc chắn muốn xóa bệnh nhân mã [${id}] khỏi hệ thống?`)) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/patients/${id}`, {
      method: 'DELETE'
    });
    const result = await res.json();
    if (result.success) {
      showToast(result.message, 'success');
      searchPatient();
    } else {
      showToast(result.message, 'error');
    }
  } catch (err) {
    console.error('Lỗi khi gọi deletePatient():', err);
    showToast('Lỗi khi xóa bệnh nhân', 'error');
  }
}

function handleSearchPatient() {
  const query = document.getElementById('patientSearchInput').value.trim();
  searchPatient(query);
}

function renderPatientTable(list) {
  const tbody = document.getElementById('patientTableBody');
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:#94a3b8; padding:24px;">Không tìm thấy bệnh nhân nào</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(p => `
    <tr>
      <td><strong>${p.id}</strong></td>
      <td><strong>${p.name}</strong></td>
      <td>${p.phone}</td>
      <td>${formatDate(p.dob)}</td>
      <td>${p.gender || '--'}</td>
      <td><span style="color:#b45309;">${p.medicalHistory || 'Bình thường'}</span></td>
      <td>${p.address || '--'}</td>
      <td style="text-align:right;">
        <button class="btn btn-secondary btn-sm" onclick="openEditPatientModal('${p.id}')">Sửa</button>
        <button class="btn btn-danger btn-sm" onclick="deletePatient('${p.id}')">Xóa</button>
      </td>
    </tr>
  `).join('');
}

function openAddPatientModal() {
  document.getElementById('modalTitle').innerText = 'Thêm Bệnh nhân Mới - addPatient()';
  document.getElementById('modalPatientId').value = '';
  document.getElementById('patientForm').reset();
  document.getElementById('patientModal').style.display = 'flex';
}

function openEditPatientModal(id) {
  const p = patientsCache.find(item => item.id === id);
  if (!p) return;

  document.getElementById('modalTitle').innerText = `Sửa Bệnh nhân [${id}] - updatePatient()`;
  document.getElementById('modalPatientId').value = p.id;
  document.getElementById('modalName').value = p.name || '';
  document.getElementById('modalPhone').value = p.phone || '';
  document.getElementById('modalEmail').value = p.email || '';
  document.getElementById('modalDob').value = p.dob || '';
  document.getElementById('modalGender').value = p.gender || 'Nam';
  document.getElementById('modalAddress').value = p.address || '';
  document.getElementById('modalMedicalHistory').value = p.medicalHistory || '';

  document.getElementById('patientModal').style.display = 'flex';
}

function closePatientModal() {
  document.getElementById('patientModal').style.display = 'none';
}

async function handlePatientFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('modalPatientId').value;
  const payload = {
    name: document.getElementById('modalName').value.trim(),
    phone: document.getElementById('modalPhone').value.trim(),
    email: document.getElementById('modalEmail').value.trim(),
    dob: document.getElementById('modalDob').value,
    gender: document.getElementById('modalGender').value,
    address: document.getElementById('modalAddress').value.trim(),
    medicalHistory: document.getElementById('modalMedicalHistory').value.trim()
  };

  let result;
  if (id) {
    result = await updatePatient(id, payload);
  } else {
    result = await addPatient(payload);
  }

  if (result.success) {
    showToast(result.message, 'success');
    closePatientModal();
    searchPatient();
  } else {
    showToast(result.message, 'error');
  }
}
