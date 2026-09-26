/**
 * Chức năng 13: Khám
 * Người thực hiện: Bác sĩ
 * Hàm gợi ý: examinePatient()
 */

document.addEventListener('DOMContentLoaded', async () => {
  renderTopNav(13, 'examinePatient()', 'Bác sĩ');
  renderBanner(
    13,
    'Khám lâm sàng răng hàm mặt',
    'Bác sĩ',
    'examinePatient()',
    'Bác sĩ thực hiện thăm khám lâm sàng, xác định vị trí răng bệnh lý, chẩn đoán và chỉ định cận lâm sàng (chụp X-quang).'
  );

  await loadOptions();
  await loadExaminations();
});

async function loadOptions() {
  try {
    const [pRes, dRes] = await Promise.all([
      fetch(`${API_BASE}/patients`),
      fetch(`${API_BASE}/doctors`)
    ]);

    const [pData, dData] = await Promise.all([pRes.json(), dRes.json()]);

    const pSelect = document.getElementById('examPatientSelect');
    pSelect.innerHTML = pData.data.map(p => `<option value="${p.id}">${p.name} (${p.id})</option>`).join('');

    const dSelect = document.getElementById('examDoctorSelect');
    dSelect.innerHTML = dData.data.map(d => `<option value="${d.id}">${d.name} (${d.specialty})</option>`).join('');

    const urlParams = new URLSearchParams(window.location.search);
    const apptId = urlParams.get('appointmentId');
    const patId = urlParams.get('patientId');
    const docId = urlParams.get('doctorId');

    if (apptId) document.getElementById('examAppointmentId').value = apptId;
    if (patId) document.getElementById('examPatientSelect').value = patId;
    if (docId) document.getElementById('examDoctorSelect').value = docId;

  } catch (err) {
    console.error('Lỗi khi tải dữ liệu khám:', err);
  }
}

async function loadExaminations() {
  try {
    const res = await fetch(`${API_BASE}/examinations`);
    const data = await res.json();
    const listContainer = document.getElementById('examinationList');

    if (data.success && data.data.length) {
      listContainer.innerHTML = data.data.map(e => `
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:14px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong style="color:var(--primary-dark); font-size:0.95rem;">${e.id} - ${e.patientName}</strong>
            <span style="font-size:0.8rem; color:#64748b;">${formatDate(e.date)}</span>
          </div>
          <p style="margin-top:6px; font-size:0.88rem;"><strong>Bác sĩ:</strong> ${e.doctorName}</p>
          <p style="font-size:0.88rem;"><strong>Chẩn đoán:</strong> <span style="color:#b91c1c; font-weight:600;">${e.diagnosis}</span></p>
          <p style="font-size:0.85rem; color:#475569;"><strong>Vị trí răng:</strong> ${Array.isArray(e.teeth) ? e.teeth.join(', ') : e.teeth || 'Không chỉ định'}</p>
          <p style="font-size:0.85rem; color:#64748b; margin-top:4px;"><strong>Lâm sàng:</strong> ${e.clinicalFindings}</p>
          ${e.xrayRequired ? '<span class="status-pill status-treating" style="margin-top:6px;">📸 Có chụp X-quang</span>' : ''}
          <div style="margin-top:10px; display:flex; gap:6px;">
            <a href="14-create-treatment-record.html?examinationId=${e.id}&patientId=${e.patientId}&doctorId=${e.doctorId}" class="btn btn-secondary btn-sm" style="font-size:0.75rem;">Lập bệnh án →</a>
            <a href="15-assign-service.html?patientId=${e.patientId}&doctorId=${e.doctorId}" class="btn btn-secondary btn-sm" style="font-size:0.75rem;">Chỉ định dịch vụ →</a>
          </div>
        </div>
      `).join('');
    } else {
      listContainer.innerHTML = '<p style="color:#94a3b8; text-align:center; padding:16px;">Chưa có dữ liệu khám bệnh.</p>';
    }
  } catch (err) {
    console.error('Lỗi khi tải lịch sử khám:', err);
  }
}

async function examinePatient(examData) {
  try {
    const res = await fetch(`${API_BASE}/examinations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(examData)
    });
    return await res.json();
  } catch (err) {
    console.error('Lỗi khi gọi examinePatient():', err);
    return { success: false, message: 'Lỗi kết nối máy chủ' };
  }
}

async function handleExamineSubmit(e) {
  e.preventDefault();

  const teethStr = document.getElementById('examTeeth').value.trim();
  const teeth = teethStr ? teethStr.split(',').map(t => t.trim()) : [];

  const payload = {
    appointmentId: document.getElementById('examAppointmentId').value,
    patientId: document.getElementById('examPatientSelect').value,
    doctorId: document.getElementById('examDoctorSelect').value,
    clinicalFindings: document.getElementById('examClinicalFindings').value.trim(),
    teeth,
    diagnosis: document.getElementById('examDiagnosis').value.trim(),
    xrayRequired: document.getElementById('examXray').checked,
    recommendations: document.getElementById('examRecommendations').value.trim()
  };

  const result = await examinePatient(payload);

  if (result.success) {
    showToast(result.message, 'success');
    document.getElementById('examClinicalFindings').value = '';
    document.getElementById('examDiagnosis').value = '';
    document.getElementById('examTeeth').value = '';
    document.getElementById('examRecommendations').value = '';
    await loadExaminations();
  } else {
    showToast(result.message, 'error');
  }
}
