/**
 * Chức năng 14: Lập hồ sơ điều trị
 * Người thực hiện: Bác sĩ / Admin
 * Hàm gợi ý: createTreatmentRecord()
 */

document.addEventListener('DOMContentLoaded', async () => {
  renderTopNav(14, 'createTreatmentRecord()', 'Bác sĩ / Admin');
  renderBanner(
    14,
    'Lập hồ sơ điều trị & Bệnh án',
    'Bác sĩ / Admin',
    'createTreatmentRecord()',
    'Lưu trữ hồ sơ thủ thuật nha khoa chính xác, phương pháp can thiệp, thuốc sử dụng và hướng dẫn bệnh nhân sau can thiệp.'
  );

  await loadOptions();
  await loadTreatmentRecords();
});

async function loadOptions() {
  try {
    const [pRes, dRes] = await Promise.all([
      fetch(`${API_BASE}/patients`),
      fetch(`${API_BASE}/doctors`)
    ]);

    const [pData, dData] = await Promise.all([pRes.json(), dRes.json()]);

    const pSelect = document.getElementById('recPatientSelect');
    pSelect.innerHTML = pData.data.map(p => `<option value="${p.id}">${p.name} (${p.id})</option>`).join('');

    const dSelect = document.getElementById('recDoctorSelect');
    dSelect.innerHTML = dData.data.map(d => `<option value="${d.id}">${d.name} (${d.specialty})</option>`).join('');

    const urlParams = new URLSearchParams(window.location.search);
    const examId = urlParams.get('examinationId');
    const patId = urlParams.get('patientId');
    const docId = urlParams.get('doctorId');

    if (examId) document.getElementById('recExamId').value = examId;
    if (patId) document.getElementById('recPatientSelect').value = patId;
    if (docId) document.getElementById('recDoctorSelect').value = docId;

  } catch (err) {
    console.error('Lỗi khi tải thông tin form bệnh án:', err);
  }
}

async function loadTreatmentRecords() {
  try {
    const res = await fetch(`${API_BASE}/treatment-records`);
    const data = await res.json();
    const container = document.getElementById('recordsContainer');

    if (data.success && data.data.length) {
      container.innerHTML = data.data.map(r => `
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:14px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong style="color:var(--primary-dark);">${r.id} - ${r.patientName}</strong>
            <span style="font-size:0.8rem; color:#64748b;">${formatDate(r.date)}</span>
          </div>
          <p style="margin-top:6px; font-size:0.88rem;"><strong>Bác sĩ:</strong> ${r.doctorName}</p>
          <p style="font-size:0.88rem;"><strong>Chẩn đoán:</strong> <span style="color:#b91c1c; font-weight:600;">${r.diagnosis}</span></p>
          <p style="font-size:0.85rem; color:#1e293b; margin-top:4px;"><strong>Phương pháp:</strong> ${r.treatmentMethod}</p>
          <p style="font-size:0.82rem; color:#475569; margin-top:4px;"><strong>Diễn biến:</strong> ${r.progressNotes || 'Bình thường'}</p>
          <p style="font-size:0.82rem; color:#0369a1; margin-top:4px;"><strong>Dặn dò:</strong> ${r.doctorNotes || 'Theo dõi'}</p>
        </div>
      `).join('');
    } else {
      container.innerHTML = '<p style="color:#94a3b8; text-align:center; padding:16px;">Chưa có hồ sơ bệnh án nào.</p>';
    }
  } catch (err) {
    console.error('Lỗi khi tải danh sách bệnh án:', err);
  }
}

async function createTreatmentRecord(recordData) {
  try {
    const res = await fetch(`${API_BASE}/treatment-records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recordData)
    });
    return await res.json();
  } catch (err) {
    console.error('Lỗi khi gọi createTreatmentRecord():', err);
    return { success: false, message: 'Lỗi kết nối máy chủ' };
  }
}

async function handleRecordSubmit(e) {
  e.preventDefault();

  const payload = {
    examinationId: document.getElementById('recExamId').value,
    patientId: document.getElementById('recPatientSelect').value,
    doctorId: document.getElementById('recDoctorSelect').value,
    diagnosis: document.getElementById('recDiagnosis').value.trim(),
    treatmentMethod: document.getElementById('recMethod').value.trim(),
    progressNotes: document.getElementById('recProgress').value.trim(),
    doctorNotes: document.getElementById('recNotes').value.trim()
  };

  const result = await createTreatmentRecord(payload);

  if (result.success) {
    showToast(result.message, 'success');
    document.getElementById('recDiagnosis').value = '';
    document.getElementById('recMethod').value = '';
    document.getElementById('recProgress').value = '';
    document.getElementById('recNotes').value = '';
    await loadTreatmentRecords();
  } else {
    showToast(result.message, 'error');
  }
}
