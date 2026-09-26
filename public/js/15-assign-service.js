/**
 * Chức năng 15: Chỉ định dịch vụ
 * Người thực hiện: Bác sĩ
 * Hàm gợi ý: assignService()
 */

let availableServices = [];

document.addEventListener('DOMContentLoaded', async () => {
  renderTopNav(15, 'assignService()', 'Bác sĩ');
  renderBanner(
    15,
    'Chỉ định dịch vụ điều trị',
    'Bác sĩ',
    'assignService()',
    'Bác sĩ lựa chọn các thủ thuật và dịch vụ kỹ thuật cần can thiệp cho bệnh nhân kèm số lượng và tính tạm tính.'
  );

  await loadInitialData();
  await loadServiceAssignments();
});

async function loadInitialData() {
  try {
    const [pRes, dRes, sRes] = await Promise.all([
      fetch(`${API_BASE}/patients`),
      fetch(`${API_BASE}/doctors`),
      fetch(`${API_BASE}/services`)
    ]);

    const [pData, dData, sData] = await Promise.all([pRes.json(), dRes.json(), sRes.json()]);

    const pSelect = document.getElementById('assignPatientSelect');
    pSelect.innerHTML = pData.data.map(p => `<option value="${p.id}">${p.name} (${p.id})</option>`).join('');

    const dSelect = document.getElementById('assignDoctorSelect');
    dSelect.innerHTML = dData.data.map(d => `<option value="${d.id}">${d.name}</option>`).join('');

    availableServices = sData.data;
    renderServicesCheckbox(availableServices);

    const urlParams = new URLSearchParams(window.location.search);
    const patId = urlParams.get('patientId');
    const docId = urlParams.get('doctorId');
    if (patId) pSelect.value = patId;
    if (docId) dSelect.value = docId;

  } catch (err) {
    console.error('Lỗi khi tải dữ liệu ban đầu:', err);
  }
}

function renderServicesCheckbox(services) {
  const container = document.getElementById('servicesCheckboxList');
  container.innerHTML = services.map(s => `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #f1f5f9;">
      <label style="display:flex; align-items:center; gap:8px; cursor:pointer; flex:1;">
        <input type="checkbox" class="srv-chk" data-id="${s.id}" data-price="${s.price}" onchange="recalculateAssignedTotal()">
        <span><strong>${s.name}</strong> <span style="color:#64748b; font-size:0.85rem;">(${formatCurrency(s.price)} / ${s.unit})</span></span>
      </label>
      <div style="display:flex; align-items:center; gap:6px;">
        <span style="font-size:0.8rem; color:#64748b;">SL:</span>
        <input type="number" id="qty_${s.id}" class="form-control" value="1" min="1" max="32" style="width:65px; padding:4px 6px;" oninput="recalculateAssignedTotal()">
      </div>
    </div>
  `).join('');
}

function recalculateAssignedTotal() {
  const checkboxes = document.querySelectorAll('.srv-chk:checked');
  let total = 0;
  checkboxes.forEach(chk => {
    const id = chk.dataset.id;
    const price = Number(chk.dataset.price);
    const qty = Number(document.getElementById(`qty_${id}`).value) || 1;
    total += price * qty;
  });

  document.getElementById('assignTotalDisplay').innerText = formatCurrency(total);
}

async function loadServiceAssignments() {
  try {
    const res = await fetch(`${API_BASE}/service-assignments`);
    const data = await res.json();
    const container = document.getElementById('assignedListContainer');

    if (data.success && data.data.length) {
      container.innerHTML = data.data.map(a => {
        const srvItems = a.services.map(s => `<li>${s.serviceName} x ${s.quantity} = <strong>${formatCurrency(s.subtotal)}</strong></li>`).join('');
        return `
          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:14px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <strong style="color:var(--primary-dark);">${a.id} - ${a.patientName}</strong>
              <span class="status-pill status-received">${formatCurrency(a.totalAmount)}</span>
            </div>
            <p style="font-size:0.85rem; color:#64748b; margin-top:4px;">BS: ${a.doctorName} - ${formatDate(a.date)}</p>
            <ul style="margin:8px 0 8px 20px; font-size:0.85rem; color:#334155;">
              ${srvItems}
            </ul>
            <div style="display:flex; gap:8px; margin-top:8px;">
              <a href="17-create-treatment-plan.html?patientId=${a.patientId}&doctorId=${a.doctorId}" class="btn btn-secondary btn-sm" style="font-size:0.75rem;">Lập phác đồ →</a>
              <a href="18-calculate-cost.html?patientId=${a.patientId}" class="btn btn-secondary btn-sm" style="font-size:0.75rem;">Báo giá chi tiết →</a>
              <a href="20-make-payment.html?patientId=${a.patientId}&serviceAssignmentId=${a.id}&amount=${a.totalAmount}" class="btn btn-primary btn-sm" style="font-size:0.75rem;">Thanh toán →</a>
            </div>
          </div>
        `;
      }).join('');
    } else {
      container.innerHTML = '<p style="color:#94a3b8; text-align:center; padding:16px;">Chưa có phiếu chỉ định dịch vụ nào.</p>';
    }
  } catch (err) {
    console.error('Lỗi tải phiếu chỉ định:', err);
  }
}

async function assignService(patientId, doctorId, services) {
  try {
    const res = await fetch(`${API_BASE}/service-assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId, doctorId, services })
    });
    return await res.json();
  } catch (err) {
    console.error('Lỗi khi gọi assignService():', err);
    return { success: false, message: 'Lỗi kết nối máy chủ' };
  }
}

async function handleAssignSubmit(e) {
  e.preventDefault();

  const patientId = document.getElementById('assignPatientSelect').value;
  const doctorId = document.getElementById('assignDoctorSelect').value;
  const checkboxes = document.querySelectorAll('.srv-chk:checked');

  if (!checkboxes.length) {
    showToast('Vui lòng chọn ít nhất 1 dịch vụ chỉ định', 'warning');
    return;
  }

  const services = [];
  checkboxes.forEach(chk => {
    const serviceId = chk.dataset.id;
    const quantity = Number(document.getElementById(`qty_${serviceId}`).value) || 1;
    services.push({ serviceId, quantity });
  });

  const result = await assignService(patientId, doctorId, services);

  if (result.success) {
    showToast(result.message, 'success');
    checkboxes.forEach(chk => chk.checked = false);
    recalculateAssignedTotal();
    await loadServiceAssignments();
  } else {
    showToast(result.message, 'error');
  }
}
