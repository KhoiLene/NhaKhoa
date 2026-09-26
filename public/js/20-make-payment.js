/**
 * Chức năng 20: Thanh toán
 * Người thực hiện: Bệnh nhân / Admin (Thu ngân)
 * Hàm gợi ý: makePayment()
 */

document.addEventListener('DOMContentLoaded', async () => {
  renderTopNav(20, 'makePayment()', 'Bệnh nhân / Admin');
  renderBanner(
    20,
    'Thanh toán viện phí nha khoa',
    'Bệnh nhân / Admin',
    'makePayment()',
    'Lập phiếu thu tiền viện phí, hỗ trợ nhiều hình thức (Chuyển khoản QR, Tiền mặt, Thẻ POS) và ghi nhận công nợ.'
  );

  await loadPatientsForPayment();
  prefillFromQuery();
  await loadPaymentHistory();
});

async function loadPatientsForPayment() {
  try {
    const res = await fetch(`${API_BASE}/patients`);
    const data = await res.json();
    if (data.success) {
      const select = document.getElementById('payPatientSelect');
      select.innerHTML = data.data.map(p => `<option value="${p.id}">${p.name} (${p.phone} - ${p.id})</option>`).join('');
    }
  } catch (err) {
    console.error('Lỗi tải bệnh nhân:', err);
  }
}

function prefillFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const patId = params.get('patientId');
  const amount = params.get('amount');

  if (patId) document.getElementById('payPatientSelect').value = patId;
  if (amount) {
    document.getElementById('payTotalAmount').value = amount;
    document.getElementById('payAmountPaid').value = amount;
    calcNetAndDebt();
  }
}

function calcNetAndDebt() {
  const total = Number(document.getElementById('payTotalAmount').value) || 0;
  const discount = Number(document.getElementById('payDiscount').value) || 0;
  const paid = Number(document.getElementById('payAmountPaid').value) || 0;

  const net = Math.max(0, total - discount);
  const debt = Math.max(0, net - paid);

  const debtDisplay = document.getElementById('payDebtDisplay');
  debtDisplay.innerText = formatCurrency(debt);
  if (debt === 0) {
    debtDisplay.style.color = '#15803d';
    debtDisplay.innerText = '0 đ (Đã thanh toán đủ)';
  } else {
    debtDisplay.style.color = '#dc2626';
  }
}

async function loadPaymentHistory() {
  try {
    const res = await fetch(`${API_BASE}/payments`);
    const data = await res.json();
    const container = document.getElementById('paymentsHistoryList');

    if (data.success && data.data.length) {
      container.innerHTML = data.data.map(p => `
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:14px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong style="color:var(--primary-dark); font-size:1.05rem;">${p.id} - ${p.patientName}</strong>
            <span class="status-pill ${p.debt === 0 ? 'status-done' : 'status-waiting'}">
              ${p.status}
            </span>
          </div>
          <p style="font-size:0.85rem; color:#64748b; margin-top:4px;">
            Ngày nộp: ${formatDate(p.paymentDate)} | Hình thức: <strong>${p.paymentMethod}</strong>
          </p>
          <div style="display:flex; justify-content:space-between; margin-top:8px; font-size:0.9rem;">
            <span>Tổng bill: ${formatCurrency(p.totalAmount)}</span>
            <span>Đã nộp: <strong style="color:#0f766e;">${formatCurrency(p.amountPaid)}</strong></span>
            ${p.debt > 0 ? `<span style="color:#b91c1c; font-weight:700;">Còn nợ: ${formatCurrency(p.debt)}</span>` : ''}
          </div>
          <div style="margin-top:10px; display:flex; gap:8px;">
            <a href="21-book-follow-up-appointment.html?patientId=${p.patientId}" class="btn btn-secondary btn-sm" style="font-size:0.75rem;">
              📅 Đặt lịch tái khám →
            </a>
            <a href="22-view-treatment-history.html?patientId=${p.patientId}" class="btn btn-secondary btn-sm" style="font-size:0.75rem;">
              Xem y bạ
            </a>
          </div>
        </div>
      `).join('');
    } else {
      container.innerHTML = '<p style="color:#94a3b8; text-align:center; padding:16px;">Chưa có phiếu thu nào.</p>';
    }
  } catch (err) {
    console.error('Lỗi tải lịch sử thanh toán:', err);
  }
}

async function makePayment(paymentData) {
  try {
    const res = await fetch(`${API_BASE}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    });
    return await res.json();
  } catch (err) {
    console.error('Lỗi khi gọi makePayment():', err);
    return { success: false, message: 'Lỗi kết nối máy chủ' };
  }
}

async function handlePaymentSubmit(e) {
  e.preventDefault();

  const patientId = document.getElementById('payPatientSelect').value;
  const totalAmount = Number(document.getElementById('payTotalAmount').value) || 0;
  const discount = Number(document.getElementById('payDiscount').value) || 0;
  const amountPaid = Number(document.getElementById('payAmountPaid').value) || 0;
  const paymentMethod = document.getElementById('payMethod').value;
  const cashier = document.getElementById('payCashier').value.trim();

  const payload = { patientId, totalAmount, discount, amountPaid, paymentMethod, cashier };
  const result = await makePayment(payload);

  if (result.success) {
    showToast(result.message, 'success');
    document.getElementById('payTotalAmount').value = '';
    document.getElementById('payAmountPaid').value = '';
    document.getElementById('payDiscount').value = '0';
    calcNetAndDebt();
    await loadPaymentHistory();
  } else {
    showToast(result.message, 'error');
  }
}
