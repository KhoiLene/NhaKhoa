/**
 * Chức năng 23: Quản lý tài khoản
 * Người thực hiện: Admin
 * Hàm gợi ý: manageAccount()
 */

let accountsList = [];

document.addEventListener('DOMContentLoaded', () => {
  renderTopNav(23, 'manageAccount()', 'Admin');
  renderBanner(
    23,
    'Quản lý tài khoản người dùng',
    'Admin',
    'manageAccount()',
    'Quản trị danh sách tài khoản, phân bổ vai trò quyền hạn (Admin, Bác sĩ, Lễ tân, Bệnh nhân), đổi mật khẩu và khóa/mở khóa tài khoản.'
  );

  manageAccount();
});

async function manageAccount() {
  try {
    const res = await fetch(`${API_BASE}/accounts`);
    const data = await res.json();
    if (data.success) {
      accountsList = data.data;
      renderAccountTable(accountsList);
      return accountsList;
    }
  } catch (err) {
    console.error('Lỗi khi gọi manageAccount():', err);
    showToast('Lỗi khi tải danh sách tài khoản', 'error');
  }
}

function renderAccountTable(list) {
  const tbody = document.getElementById('accountsTableBody');
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:#94a3b8; padding:24px;">Không có tài khoản nào</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(a => {
    let roleClass = 'role-guest';
    if (a.role === 'ADMIN') roleClass = 'role-admin';
    else if (a.role === 'DOCTOR') roleClass = 'role-doctor';
    else if (a.role === 'RECEPTIONIST') roleClass = 'role-receptionist';
    else if (a.role === 'PATIENT') roleClass = 'role-patient';

    const isActive = a.status === 'Hoạt động';

    return `
      <tr>
        <td><strong>${a.id}</strong></td>
        <td><code>${a.username}</code></td>
        <td><strong>${a.fullName}</strong></td>
        <td><span class="role-badge ${roleClass}">${a.role}</span></td>
        <td>${a.phone || '--'}</td>
        <td>
          <span class="status-pill ${isActive ? 'status-done' : 'status-cancelled'}">
            ${a.status}
          </span>
        </td>
        <td style="font-size:0.85rem; color:#64748b;">${formatDate(a.createdAt)}</td>
        <td style="text-align:right;">
          <button class="btn btn-secondary btn-sm" onclick="openEditAccountModal('${a.id}')">Sửa</button>
          <button class="btn btn-danger btn-sm" onclick="deleteAccount('${a.id}')" ${a.username === 'admin' ? 'disabled title="Không thể xóa admin gốc"' : ''}>Xóa</button>
        </td>
      </tr>
    `;
  }).join('');
}

function openAddAccountModal() {
  document.getElementById('modalAccTitle').innerText = 'Tạo Tài Khoản Mới - manageAccount()';
  document.getElementById('modalAccId').value = '';
  document.getElementById('modalAccUsername').disabled = false;
  document.getElementById('accountForm').reset();
  document.getElementById('accountModal').style.display = 'flex';
}

function openEditAccountModal(id) {
  const acc = accountsList.find(item => item.id === id);
  if (!acc) return;

  document.getElementById('modalAccTitle').innerText = `Sửa Tài Khoản [${id}] - manageAccount()`;
  document.getElementById('modalAccId').value = acc.id;
  document.getElementById('modalAccUsername').value = acc.username;
  document.getElementById('modalAccUsername').disabled = true;
  document.getElementById('modalAccPassword').value = '';
  document.getElementById('modalAccFullName').value = acc.fullName;
  document.getElementById('modalAccRole').value = acc.role;
  document.getElementById('modalAccPhone').value = acc.phone || '';
  document.getElementById('modalAccEmail').value = acc.email || '';
  document.getElementById('modalAccStatus').value = acc.status || 'Hoạt động';

  document.getElementById('accountModal').style.display = 'flex';
}

function closeAccountModal() {
  document.getElementById('accountModal').style.display = 'none';
}

async function handleAccountFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('modalAccId').value;
  const username = document.getElementById('modalAccUsername').value.trim();
  const password = document.getElementById('modalAccPassword').value;
  const fullName = document.getElementById('modalAccFullName').value.trim();
  const role = document.getElementById('modalAccRole').value;
  const phone = document.getElementById('modalAccPhone').value.trim();
  const email = document.getElementById('modalAccEmail').value.trim();
  const status = document.getElementById('modalAccStatus').value;

  const payload = { fullName, role, phone, email, status };
  if (password) payload.password = password;

  let res;
  if (id) {
    res = await fetch(`${API_BASE}/accounts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } else {
    payload.username = username;
    payload.password = password || '123456';
    res = await fetch(`${API_BASE}/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  const result = await res.json();
  if (result.success) {
    showToast(result.message, 'success');
    closeAccountModal();
    manageAccount();
  } else {
    showToast(result.message, 'error');
  }
}

async function deleteAccount(id) {
  if (!confirm(`Bạn có chắc chắn muốn xóa tài khoản [${id}]?`)) return;

  try {
    const res = await fetch(`${API_BASE}/accounts/${id}`, {
      method: 'DELETE'
    });
    const result = await res.json();
    if (result.success) {
      showToast(result.message, 'success');
      manageAccount();
    } else {
      showToast(result.message, 'error');
    }
  } catch (err) {
    console.error('Lỗi xóa tài khoản:', err);
    showToast('Lỗi khi xóa tài khoản', 'error');
  }
}
