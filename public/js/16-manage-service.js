/**
 * Chức năng 16: Quản lý dịch vụ
 * Người thực hiện: Admin
 * Hàm gợi ý: add/update/deleteService()
 */

let servicesList = [];

document.addEventListener('DOMContentLoaded', () => {
  renderTopNav(16, 'add/update/deleteService()', 'Admin');
  renderBanner(
    16,
    'Quản lý bảng giá dịch vụ',
    'Admin',
    'add/update/deleteService()',
    'Thiết lập danh mục dịch vụ điều trị nha khoa, đơn giá niêm yết, đơn vị tính và chính sách bảo hành.'
  );

  loadServices();
});

async function loadServices() {
  try {
    const res = await fetch(`${API_BASE}/services`);
    const data = await res.json();
    if (data.success) {
      servicesList = data.data;
      renderTable(servicesList);
    }
  } catch (err) {
    console.error('Lỗi tải danh mục dịch vụ:', err);
  }
}

function renderTable(list) {
  const tbody = document.getElementById('servicesTableBody');
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#94a3b8; padding:24px;">Chưa có dịch vụ nào</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(s => `
    <tr>
      <td><strong>${s.id}</strong></td>
      <td><strong>${s.name}</strong></td>
      <td><span style="color:#0f766e; font-weight:700;">${formatCurrency(s.price)}</span></td>
      <td>${s.unit || 'Lần'}</td>
      <td><span class="status-pill status-done">${s.warranty || 'Không'}</span></td>
      <td style="font-size:0.85rem; color:#475569; max-width:280px;">${s.description || '--'}</td>
      <td style="text-align:right;">
        <button class="btn btn-secondary btn-sm" onclick="openEditServiceModal('${s.id}')">Sửa</button>
        <button class="btn btn-danger btn-sm" onclick="deleteService('${s.id}')">Xóa</button>
      </td>
    </tr>
  `).join('');
}

async function addService(serviceData) {
  try {
    const res = await fetch(`${API_BASE}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(serviceData)
    });
    return await res.json();
  } catch (err) {
    console.error('Lỗi khi gọi addService():', err);
    return { success: false, message: 'Lỗi kết nối máy chủ' };
  }
}

async function updateService(id, serviceData) {
  try {
    const res = await fetch(`${API_BASE}/services/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(serviceData)
    });
    return await res.json();
  } catch (err) {
    console.error('Lỗi khi gọi updateService():', err);
    return { success: false, message: 'Lỗi kết nối máy chủ' };
  }
}

async function deleteService(id) {
  if (!confirm(`Bạn có chắc chắn muốn xóa dịch vụ [${id}]?`)) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/services/${id}`, {
      method: 'DELETE'
    });
    const result = await res.json();
    if (result.success) {
      showToast(result.message, 'success');
      loadServices();
    } else {
      showToast(result.message, 'error');
    }
  } catch (err) {
    console.error('Lỗi khi gọi deleteService():', err);
    showToast('Lỗi khi xóa dịch vụ', 'error');
  }
}

function openAddServiceModal() {
  document.getElementById('modalSrvTitle').innerText = 'Thêm Dịch Vụ Mới - addService()';
  document.getElementById('modalSrvId').value = '';
  document.getElementById('serviceForm').reset();
  document.getElementById('serviceModal').style.display = 'flex';
}

function openEditServiceModal(id) {
  const s = servicesList.find(item => item.id === id);
  if (!s) return;

  document.getElementById('modalSrvTitle').innerText = `Sửa Dịch Vụ [${id}] - updateService()`;
  document.getElementById('modalSrvId').value = s.id;
  document.getElementById('modalSrvName').value = s.name || '';
  document.getElementById('modalSrvPrice').value = s.price || 0;
  document.getElementById('modalSrvUnit').value = s.unit || 'Lần';
  document.getElementById('modalSrvWarranty').value = s.warranty || '';
  document.getElementById('modalSrvDesc').value = s.description || '';

  document.getElementById('serviceModal').style.display = 'flex';
}

function closeServiceModal() {
  document.getElementById('serviceModal').style.display = 'none';
}

async function handleServiceFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('modalSrvId').value;
  const payload = {
    name: document.getElementById('modalSrvName').value.trim(),
    price: Number(document.getElementById('modalSrvPrice').value) || 0,
    unit: document.getElementById('modalSrvUnit').value.trim(),
    warranty: document.getElementById('modalSrvWarranty').value.trim(),
    description: document.getElementById('modalSrvDesc').value.trim()
  };

  let result;
  if (id) {
    result = await updateService(id, payload);
  } else {
    result = await addService(payload);
  }

  if (result.success) {
    showToast(result.message, 'success');
    closeServiceModal();
    loadServices();
  } else {
    showToast(result.message, 'error');
  }
}
