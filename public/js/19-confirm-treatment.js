/**
 * Chức năng 19: Xác nhận điều trị
 * Người thực hiện: Bệnh nhân / Admin
 * Hàm gợi ý: confirmTreatment()
 */

let plansList = [];

document.addEventListener('DOMContentLoaded', async () => {
  renderTopNav(19, 'confirmTreatment()', 'Bệnh nhân / Admin');
  renderBanner(
    19,
    'Xác nhận kế hoạch điều trị',
    'Bệnh nhân / Admin',
    'confirmTreatment()',
    'Bệnh nhân xem xét kỹ lưỡng lộ trình can thiệp nha khoa và chi phí, sau đó ký xác nhận đồng ý điều trị.'
  );

  await loadPlansForConfirm();
});

async function loadPlansForConfirm() {
  try {
    const res = await fetch(`${API_BASE}/treatment-plans`);
    const data = await res.json();
    if (data.success) {
      plansList = data.data;
      const select = document.getElementById('confirmPlanSelect');
      const urlParams = new URLSearchParams(window.location.search);
      const preselectedId = urlParams.get('planId');

      if (!plansList.length) {
        select.innerHTML = '<option value="">-- Chưa có kế hoạch điều trị nào --</option>';
        return;
      }

      select.innerHTML = plansList.map(p => `
        <option value="${p.id}" ${preselectedId === p.id ? 'selected' : ''}>
          [${p.id}] ${p.planName} - BN: ${p.patientName} (${p.status})
        </option>
      `).join('');

      loadPlanDetailsForConfirm();
    }
  } catch (err) {
    console.error('Lỗi tải kế hoạch điều trị:', err);
  }
}

function loadPlanDetailsForConfirm() {
  const planId = document.getElementById('confirmPlanSelect').value;
  const plan = plansList.find(p => p.id === planId);
  const box = document.getElementById('planDetailForConfirmBox');

  if (plan) {
    document.getElementById('confirmedByInput').value = plan.patientName;

    const stagesHtml = plan.stages.map(s => `
      <li style="margin-bottom:6px;">
        <strong>Giai đoạn ${s.stageNumber}:</strong> ${s.title} (${s.duration}) - <em>${formatCurrency(s.estimatedCost)}</em>
        <br><span style="font-size:0.8rem; color:#64748b;">Trạng thái: ${s.status}</span>
      </li>
    `).join('');

    box.innerHTML = `
      <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:16px;">
        <h3 style="color:#166534; margin-bottom:8px;">${plan.planName}</h3>
        <p><strong>Bệnh nhân:</strong> ${plan.patientName} (${plan.patientId})</p>
        <p><strong>Bác sĩ phụ trách:</strong> ${plan.doctorName}</p>
        <p><strong>Trạng thái hiện tại:</strong> <span class="status-pill ${plan.patientConfirmed ? 'status-done' : 'status-waiting'}">${plan.status}</span></p>
        
        <h4 style="margin-top:14px; color:#14532d;">Các giai đoạn điều trị:</h4>
        <ul style="margin:8px 0 12px 20px; font-size:0.9rem;">
          ${stagesHtml}
        </ul>

        <div style="background:#fff; border:1px solid #dcfce7; border-radius:6px; padding:10px; margin-top:10px;">
          <p><strong>Tổng chi phí ước tính:</strong> ${formatCurrency(plan.totalEstimatedCost)}</p>
          <p><strong>Chiết khấu:</strong> - ${formatCurrency(plan.discount || 0)}</p>
          <p style="font-size:1.15rem; color:#15803d; font-weight:700;">Chi phí cuối cùng: ${formatCurrency(plan.finalCost)}</p>
        </div>

        ${plan.patientConfirmed ? `
          <div style="margin-top:12px; padding:10px; background:#dcfce7; border-radius:6px; color:#166534;">
            <strong>✓ Đã xác nhận:</strong> Ký bởi <em>${plan.confirmedBy}</em> lúc ${formatDate(plan.confirmedAt)}
          </div>
        ` : ''}
      </div>
    `;
  }
}

async function confirmTreatment(planId, confirmedBy, signatureNote) {
  try {
    const res = await fetch(`${API_BASE}/treatment-plans/${planId}/confirm`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmedBy, signatureNote })
    });
    return await res.json();
  } catch (err) {
    console.error('Lỗi khi gọi confirmTreatment():', err);
    return { success: false, message: 'Lỗi kết nối máy chủ' };
  }
}

async function handleConfirmSubmit(e) {
  e.preventDefault();
  const planId = document.getElementById('confirmPlanSelect').value;
  const confirmedBy = document.getElementById('confirmedByInput').value.trim();
  const signatureNote = document.getElementById('signatureNoteInput').value.trim();

  if (!planId) {
    showToast('Vui lòng chọn phác đồ điều trị', 'warning');
    return;
  }

  const result = await confirmTreatment(planId, confirmedBy, signatureNote);

  if (result.success) {
    showToast(result.message, 'success');
    await loadPlansForConfirm();
  } else {
    showToast(result.message, 'error');
  }
}
