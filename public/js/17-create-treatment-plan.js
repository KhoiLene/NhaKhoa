/**
 * Chức năng 17: Lập kế hoạch điều trị
 * Người thực hiện: Bác sĩ
 * Hàm gợi ý: createTreatmentPlan()
 */

let stageCounter = 0;

document.addEventListener('DOMContentLoaded', async () => {
  renderTopNav(17, 'createTreatmentPlan()', 'Bác sĩ');
  renderBanner(
    17,
    'Lập kế hoạch & Phác đồ điều trị',
    'Bác sĩ',
    'createTreatmentPlan()',
    'Bác sĩ phân chia lộ trình điều trị thành các giai đoạn cụ thể, dự kiến thời gian và chi phí từng đợt.'
  );

  await loadSelectOptions();
  addStageInputRow('Giai đoạn 1: Vệ sinh nha chu & Kiểm soát viêm', '1 buổi', 250000);
  addStageInputRow('Giai đoạn 2: Phục hình & Trám thẩm mỹ', '1-2 buổi', 1500000);
  calculatePlanTotalPreview();

  await loadTreatmentPlans();
});

async function loadSelectOptions() {
  try {
    const [pRes, dRes] = await Promise.all([
      fetch(`${API_BASE}/patients`),
      fetch(`${API_BASE}/doctors`)
    ]);

    const [pData, dData] = await Promise.all([pRes.json(), dRes.json()]);

    const pSelect = document.getElementById('planPatientSelect');
    pSelect.innerHTML = pData.data.map(p => `<option value="${p.id}">${p.name} (${p.id})</option>`).join('');

    const dSelect = document.getElementById('planDoctorSelect');
    dSelect.innerHTML = dData.data.map(d => `<option value="${d.id}">${d.name}</option>`).join('');

    const urlParams = new URLSearchParams(window.location.search);
    const patId = urlParams.get('patientId');
    const docId = urlParams.get('doctorId');
    if (patId) pSelect.value = patId;
    if (docId) dSelect.value = docId;

  } catch (err) {
    console.error('Lỗi tải danh mục options:', err);
  }
}

function addStageInputRow(defaultTitle = '', defaultDuration = '1 buổi', defaultCost = 0) {
  stageCounter++;
  const container = document.getElementById('stagesContainer');
  const row = document.createElement('div');
  row.className = 'stage-row';
  row.id = `stageRow_${stageCounter}`;
  row.style.background = '#f8fafc';
  row.style.border = '1px solid #e2e8f0';
  row.style.padding = '8px 12px';
  row.style.borderRadius = '6px';
  row.style.display = 'grid';
  row.style.gridTemplateColumns = '2fr 1fr 1.2fr 40px';
  row.style.gap = '8px';
  row.style.alignItems = 'center';

  row.innerHTML = `
    <input type="text" class="form-control stage-title" placeholder="Tên giai đoạn ${stageCounter}" value="${defaultTitle}" required>
    <input type="text" class="form-control stage-duration" placeholder="Thời gian" value="${defaultDuration}">
    <input type="number" class="form-control stage-cost" placeholder="Chi phí (VNĐ)" value="${defaultCost}" min="0" oninput="calculatePlanTotalPreview()">
    <button type="button" class="btn btn-danger btn-sm" style="padding:4px 8px;" onclick="removeStageRow(${stageCounter})">&times;</button>
  `;

  container.appendChild(row);
  calculatePlanTotalPreview();
}

function removeStageRow(index) {
  const row = document.getElementById(`stageRow_${index}`);
  if (row) row.remove();
  calculatePlanTotalPreview();
}

function calculatePlanTotalPreview() {
  const costInputs = document.querySelectorAll('.stage-cost');
  let total = 0;
  costInputs.forEach(inp => {
    total += Number(inp.value) || 0;
  });

  const discount = Number(document.getElementById('planDiscount').value) || 0;
  const net = Math.max(0, total - discount);

  document.getElementById('planTotalEstimatedPreview').innerText = `${formatCurrency(net)} (Gốc: ${formatCurrency(total)})`;
}

async function loadTreatmentPlans() {
  try {
    const res = await fetch(`${API_BASE}/treatment-plans`);
    const data = await res.json();
    const container = document.getElementById('plansListContainer');

    if (data.success && data.data.length) {
      container.innerHTML = data.data.map(p => {
        const stageList = p.stages.map(s => `
          <li>
            <strong>GĐ ${s.stageNumber}:</strong> ${s.title} (${s.duration}) - <em>${formatCurrency(s.estimatedCost)}</em>
          </li>
        `).join('');

        return `
          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:14px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <strong style="color:var(--primary-dark);">${p.id} - ${p.planName}</strong>
              <span class="status-pill ${p.patientConfirmed ? 'status-done' : 'status-waiting'}">
                ${p.status}
              </span>
            </div>
            <p style="font-size:0.85rem; color:#64748b; margin-top:4px;">
              Bệnh nhân: <strong>${p.patientName}</strong> | Bác sĩ: ${p.doctorName}
            </p>
            <ul style="margin:8px 0 8px 20px; font-size:0.85rem; color:#334155;">
              ${stageList}
            </ul>
            <p style="font-size:0.9rem; font-weight:700; color:#0f766e;">
              Tổng chi phí phác đồ: ${formatCurrency(p.finalCost)} ${p.discount ? `(Giảm ${formatCurrency(p.discount)})` : ''}
            </p>
            <div style="margin-top:10px; display:flex; gap:8px;">
              ${!p.patientConfirmed ? `
                <a href="19-confirm-treatment.html?planId=${p.id}" class="btn btn-primary btn-sm" style="font-size:0.75rem;">
                  ✍️ Xác nhận phác đồ →
                </a>
              ` : `
                <span style="font-size:0.8rem; color:#15803d; font-weight:600;">✓ Đã được bệnh nhân ký duyệt</span>
              `}
              <a href="18-calculate-cost.html?patientId=${p.patientId}" class="btn btn-secondary btn-sm" style="font-size:0.75rem;">Báo giá</a>
            </div>
          </div>
        `;
      }).join('');
    } else {
      container.innerHTML = '<p style="color:#94a3b8; text-align:center; padding:16px;">Chưa có kế hoạch điều trị nào.</p>';
    }
  } catch (err) {
    console.error('Lỗi khi tải danh sách phác đồ:', err);
  }
}

async function createTreatmentPlan(planData) {
  try {
    const res = await fetch(`${API_BASE}/treatment-plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(planData)
    });
    return await res.json();
  } catch (err) {
    console.error('Lỗi khi gọi createTreatmentPlan():', err);
    return { success: false, message: 'Lỗi kết nối máy chủ' };
  }
}

async function handlePlanSubmit(e) {
  e.preventDefault();

  const patientId = document.getElementById('planPatientSelect').value;
  const doctorId = document.getElementById('planDoctorSelect').value;
  const planName = document.getElementById('planName').value.trim();
  const discount = Number(document.getElementById('planDiscount').value) || 0;

  const stageRows = document.querySelectorAll('.stage-row');
  if (!stageRows.length) {
    showToast('Cần ít nhất 1 giai đoạn điều trị', 'warning');
    return;
  }

  const stages = [];
  stageRows.forEach(row => {
    const title = row.querySelector('.stage-title').value.trim();
    const duration = row.querySelector('.stage-duration').value.trim();
    const cost = Number(row.querySelector('.stage-cost').value) || 0;
    if (title) {
      stages.push({ title, duration, estimatedCost: cost });
    }
  });

  const payload = { patientId, doctorId, planName, stages, discount };
  const result = await createTreatmentPlan(payload);

  if (result.success) {
    showToast(result.message, 'success');
    document.getElementById('planName').value = '';
    await loadTreatmentPlans();
  } else {
    showToast(result.message, 'error');
  }
}
