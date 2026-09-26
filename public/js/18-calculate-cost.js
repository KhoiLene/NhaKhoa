/**
 * Chức năng 18: Báo giá
 * Người thực hiện: Hệ thống / Admin
 * Hàm gợi ý: calculateCost()
 */

let servicesData = [];

document.addEventListener('DOMContentLoaded', async () => {
  renderTopNav(18, 'calculateCost()', 'Hệ thống / Admin');
  renderBanner(
    18,
    'Báo giá chi phí điều trị',
    'Hệ thống / Admin',
    'calculateCost()',
    'Hệ thống tự động tính toán tổng chi phí dịch vụ, áp dụng tỷ lệ chiết khấu, voucher giảm giá và phần trăm bảo hiểm chi trả.'
  );

  await loadServicesForCost();
});

async function loadServicesForCost() {
  try {
    const res = await fetch(`${API_BASE}/services`);
    const data = await res.json();
    if (data.success) {
      servicesData = data.data;
      const container = document.getElementById('costServicesList');

      container.innerHTML = servicesData.map((s, idx) => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid #f1f5f9;">
          <label style="display:flex; align-items:center; gap:8px; cursor:pointer; flex:1;">
            <input type="checkbox" class="cost-srv-chk" data-id="${s.id}" ${idx < 2 ? 'checked' : ''}>
            <span>${s.name} <strong style="color:#0f766e;">(${formatCurrency(s.price)})</strong></span>
          </label>
          <div style="display:flex; align-items:center; gap:4px;">
            <span style="font-size:0.8rem; color:#64748b;">SL:</span>
            <input type="number" id="cost_qty_${s.id}" class="form-control" value="1" min="1" max="20" style="width:60px; padding:3px 6px;">
          </div>
        </div>
      `).join('');

      handleCalculateSubmit(new Event('submit'));
    }
  } catch (err) {
    console.error('Lỗi tải danh mục dịch vụ:', err);
  }
}

async function calculateCost(costParams) {
  try {
    const res = await fetch(`${API_BASE}/calculate-cost`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(costParams)
    });
    return await res.json();
  } catch (err) {
    console.error('Lỗi khi gọi calculateCost():', err);
    return { success: false, message: 'Lỗi kết nối máy chủ' };
  }
}

async function handleCalculateSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();

  const checkedBoxes = document.querySelectorAll('.cost-srv-chk:checked');
  if (!checkedBoxes.length) {
    showToast('Vui lòng tích chọn ít nhất 1 dịch vụ để báo giá', 'warning');
    return;
  }

  const items = [];
  checkedBoxes.forEach(chk => {
    const serviceId = chk.dataset.id;
    const quantity = Number(document.getElementById(`cost_qty_${serviceId}`).value) || 1;
    items.push({ serviceId, quantity });
  });

  const discountPercent = Number(document.getElementById('costDiscountPercent').value) || 0;
  const discountAmount = Number(document.getElementById('costDiscountAmount').value) || 0;
  const insurancePercent = Number(document.getElementById('costInsurancePercent').value) || 0;

  const result = await calculateCost({ items, discountPercent, discountAmount, insurancePercent });

  if (result.success) {
    renderCostBreakdown(result.breakdown);
    showToast('Đã tính báo giá thành công!', 'info');
  } else {
    showToast(result.message, 'error');
  }
}

function renderCostBreakdown(b) {
  const container = document.getElementById('costResultContainer');

  const rows = b.items.map(item => `
    <tr>
      <td>${item.serviceName}</td>
      <td style="text-align:center;">${item.quantity}</td>
      <td style="text-align:right;">${formatCurrency(item.price)}</td>
      <td style="text-align:right; font-weight:600;">${formatCurrency(item.amount)}</td>
    </tr>
  `).join('');

  container.innerHTML = `
    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:16px;">
      <table class="data-table" style="background:#fff; margin-bottom:16px;">
        <thead>
          <tr>
            <th>Dịch vụ</th>
            <th style="text-align:center;">SL</th>
            <th style="text-align:right;">Đơn giá</th>
            <th style="text-align:right;">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <div style="display:flex; flex-direction:column; gap:6px; font-size:0.92rem; border-top:1px dashed #cbd5e1; padding-top:12px;">
        <div style="display:flex; justify-content:space-between;">
          <span>Tổng tiền dịch vụ niêm yết:</span>
          <strong>${formatCurrency(b.subtotal)}</strong>
        </div>
        ${b.discountPercent > 0 ? `
          <div style="display:flex; justify-content:space-between; color:#b45309;">
            <span>Chiết khấu khuyến mãi (${b.discountPercent}%):</span>
            <span>- ${formatCurrency(b.discountFromPercent)}</span>
          </div>
        ` : ''}
        ${b.discountDirectAmount > 0 ? `
          <div style="display:flex; justify-content:space-between; color:#b45309;">
            <span>Giảm trừ trực tiếp:</span>
            <span>- ${formatCurrency(b.discountDirectAmount)}</span>
          </div>
        ` : ''}
        ${b.insuranceCover > 0 ? `
          <div style="display:flex; justify-content:space-between; color:#0369a1;">
            <span>Bảo hiểm chi trả (${b.insurancePercent}%):</span>
            <span>- ${formatCurrency(b.insuranceCover)}</span>
          </div>
        ` : ''}
        <hr style="border:none; border-top:1px solid #e2e8f0; margin:6px 0;">
        <div style="display:flex; justify-content:space-between; font-size:1.25rem; font-weight:700; color:var(--primary-dark);">
          <span>Số tiền thực tế thanh toán:</span>
          <span>${formatCurrency(b.finalTotal)}</span>
        </div>
      </div>

      <div style="margin-top:16px; display:flex; gap:10px;">
        <a href="20-make-payment.html?amount=${b.finalTotal}" class="btn btn-primary btn-block">Chuyển sang Thanh toán viện phí →</a>
      </div>
    </div>
  `;
}
