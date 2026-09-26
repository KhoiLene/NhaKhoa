/**
 * Chức năng 22: Xem lịch sử điều trị
 * Người thực hiện: Bệnh nhân / Admin
 * Hàm gợi ý: viewTreatmentHistory()
 */

document.addEventListener('DOMContentLoaded', async () => {
  renderTopNav(22, 'viewTreatmentHistory()', 'Bệnh nhân / Admin');
  renderBanner(
    22,
    'Hồ sơ bệnh án & Lịch sử điều trị',
    'Bệnh nhân / Admin',
    'viewTreatmentHistory()',
    'Tra cứu toàn diện lịch sử y bạ của bệnh nhân: từ các lần khám lâm sàng, thủ thuật can thiệp, phác đồ điều trị đến các đợt thanh toán viện phí.'
  );

  await loadPatientsDropdown();
  handlePatientSelectChange();
});

async function loadPatientsDropdown() {
  try {
    const res = await fetch(`${API_BASE}/patients`);
    const data = await res.json();
    if (data.success) {
      const select = document.getElementById('historyPatientSelect');
      const user = Session.getUser();
      const urlParams = new URLSearchParams(window.location.search);
      const urlPatId = urlParams.get('patientId');

      select.innerHTML = data.data.map(p => `
        <option value="${p.id}" ${(urlPatId === p.id || (user && user.patientId === p.id)) ? 'selected' : ''}>
          ${p.name} (${p.phone} - ${p.id})
        </option>
      `).join('');
    }
  } catch (err) {
    console.error('Lỗi tải danh sách bệnh nhân:', err);
  }
}

async function viewTreatmentHistory(patientId) {
  try {
    const res = await fetch(`${API_BASE}/patients/${patientId}/history`);
    return await res.json();
  } catch (err) {
    console.error('Lỗi khi gọi viewTreatmentHistory():', err);
    return { success: false, message: 'Lỗi kết nối máy chủ' };
  }
}

async function handlePatientSelectChange() {
  const patientId = document.getElementById('historyPatientSelect').value;
  if (!patientId) return;

  const result = await viewTreatmentHistory(patientId);

  if (result.success) {
    renderHistoryView(result);
    showToast(`Đã tải hồ sơ y bạ của ${result.patient.name}`, 'info');
  } else {
    showToast(result.message, 'error');
  }
}

function renderHistoryView(data) {
  const p = data.patient;
  const h = data.history;
  const s = data.stats;

  const sumCard = document.getElementById('patientSummaryCard');
  sumCard.style.display = 'block';
  sumCard.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:16px;">
      <div>
        <h2 style="color:var(--primary-dark); margin-bottom:4px;">${p.name} <span style="font-size:0.9rem; color:#64748b;">(${p.id})</span></h2>
        <p><strong>Ngày sinh:</strong> ${formatDate(p.dob)} | <strong>Giới tính:</strong> ${p.gender || '--'}</p>
        <p><strong>Số điện thoại:</strong> ${p.phone} | <strong>Email:</strong> ${p.email || '--'}</p>
        <p><strong>Địa chỉ:</strong> ${p.address || '--'}</p>
        <p style="margin-top:4px;"><strong style="color:#b45309;">Tiền sử bệnh lý:</strong> ${p.medicalHistory || 'Bình thường'}</p>
      </div>
      <div style="display:flex; gap:12px; flex-wrap:wrap;">
        <div style="background:#f0fdf4; border:1px solid #86efac; border-radius:8px; padding:12px 18px; text-align:center;">
          <div style="font-size:1.5rem; font-weight:700; color:#15803d;">${s.totalAppointments}</div>
          <div style="font-size:0.8rem; color:#166534;">Lịch khám</div>
        </div>
        <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; padding:12px 18px; text-align:center;">
          <div style="font-size:1.5rem; font-weight:700; color:#1e40af;">${s.totalTreatments}</div>
          <div style="font-size:0.8rem; color:#1d4ed8;">Bệnh án thủ thuật</div>
        </div>
        <div style="background:#fdf4ff; border:1px solid #f0abfc; border-radius:8px; padding:12px 18px; text-align:center;">
          <div style="font-size:1.4rem; font-weight:700; color:#86198f;">${formatCurrency(s.totalPayments)}</div>
          <div style="font-size:0.8rem; color:#701a75;">Tổng viện phí đã nộp</div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('historyDetailsSection').style.display = 'block';

  // Render Examinations
  const examsBox = document.getElementById('histExamsList');
  if (h.examinations.length) {
    examsBox.innerHTML = h.examinations.map(e => `
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:10px;">
        <div style="display:flex; justify-content:space-between; font-size:0.85rem;">
          <strong style="color:var(--primary-dark);">${e.id}</strong>
          <span>${formatDate(e.date)}</span>
        </div>
        <p style="font-size:0.9rem; margin-top:4px;"><strong>Chẩn đoán:</strong> <span style="color:#b91c1c;">${e.diagnosis}</span></p>
        <p style="font-size:0.85rem; color:#475569;">Bác sĩ: ${e.doctorName}</p>
        <p style="font-size:0.82rem; color:#64748b;">Lâm sàng: ${e.clinicalFindings}</p>
      </div>
    `).join('');
  } else {
    examsBox.innerHTML = '<p style="color:#94a3b8; font-size:0.85rem;">Chưa có dữ liệu khám.</p>';
  }

  // Render Treatment Records
  const recordsBox = document.getElementById('histRecordsList');
  if (h.treatmentRecords.length) {
    recordsBox.innerHTML = h.treatmentRecords.map(r => `
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:10px;">
        <div style="display:flex; justify-content:space-between; font-size:0.85rem;">
          <strong style="color:var(--primary-dark);">${r.id}</strong>
          <span>${formatDate(r.date)}</span>
        </div>
        <p style="font-size:0.9rem; margin-top:4px;"><strong>Phương pháp:</strong> ${r.treatmentMethod}</p>
        <p style="font-size:0.82rem; color:#475569;">Diễn biến: ${r.progressNotes || '--'}</p>
        <p style="font-size:0.82rem; color:#0369a1;">Dặn dò: ${r.doctorNotes || '--'}</p>
      </div>
    `).join('');
  } else {
    recordsBox.innerHTML = '<p style="color:#94a3b8; font-size:0.85rem;">Chưa có bệnh án thủ thuật.</p>';
  }

  // Render Plans & Assignments
  const plansBox = document.getElementById('histPlansList');
  if (h.treatmentPlans.length) {
    plansBox.innerHTML = h.treatmentPlans.map(pl => `
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:10px;">
        <div style="display:flex; justify-content:space-between; font-size:0.85rem;">
          <strong style="color:var(--primary-dark);">${pl.id} - ${pl.planName}</strong>
          <span class="status-pill ${pl.patientConfirmed ? 'status-done' : 'status-waiting'}">${pl.status}</span>
        </div>
        <p style="font-size:0.88rem; margin-top:4px;">Tổng chi phí: <strong>${formatCurrency(pl.finalCost)}</strong></p>
        ${pl.patientConfirmed ? `<p style="font-size:0.8rem; color:#166534;">✓ Ký xác nhận bởi ${pl.confirmedBy}</p>` : ''}
      </div>
    `).join('');
  } else {
    plansBox.innerHTML = '<p style="color:#94a3b8; font-size:0.85rem;">Chưa có phác đồ điều trị.</p>';
  }

  // Render Payments
  const paymentsBox = document.getElementById('histPaymentsList');
  if (h.payments.length) {
    paymentsBox.innerHTML = h.payments.map(py => `
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:10px;">
        <div style="display:flex; justify-content:space-between; font-size:0.85rem;">
          <strong style="color:var(--primary-dark);">${py.id}</strong>
          <span class="status-pill ${py.debt === 0 ? 'status-done' : 'status-waiting'}">${py.status}</span>
        </div>
        <p style="font-size:0.9rem; margin-top:4px;">
          Số tiền nộp: <strong style="color:#0f766e;">${formatCurrency(py.amountPaid)}</strong> (${py.paymentMethod})
        </p>
        <p style="font-size:0.8rem; color:#64748b;">Thời gian: ${formatDate(py.paymentDate)} | Thu ngân: ${py.cashier}</p>
      </div>
    `).join('');
  } else {
    paymentsBox.innerHTML = '<p style="color:#94a3b8; font-size:0.85rem;">Chưa có phiếu thanh toán.</p>';
  }
}
