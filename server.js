const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;
const DB_FILE = path.join(__dirname, 'data', 'database.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Database helper functions with thread-safe file handling
function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initialData = {
        patients: [],
        doctors: [],
        services: [],
        appointments: [],
        examinations: [],
        treatmentRecords: [],
        serviceAssignments: [],
        treatmentPlans: [],
        payments: [],
        followUps: [],
        accounts: []
      };
      fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf8');
      return initialData;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    if (!raw.trim()) {
      return {
        patients: [],
        doctors: [],
        services: [],
        appointments: [],
        examinations: [],
        treatmentRecords: [],
        serviceAssignments: [],
        treatmentPlans: [],
        payments: [],
        followUps: [],
        accounts: []
      };
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading database file:', err);
    return {
      patients: [],
      doctors: [],
      services: [],
      appointments: [],
      examinations: [],
      treatmentRecords: [],
      serviceAssignments: [],
      treatmentPlans: [],
      payments: [],
      followUps: [],
      accounts: []
    };
  }
}

function writeDB(data) {
  try {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing to database:', err);
    return false;
  }
}

// -------------------------------------------------------------
// 1. register() - Đăng ký bệnh nhân
// -------------------------------------------------------------
app.post('/api/register', (req, res) => {
  const { name, phone, email, dob, gender, address, medicalHistory, password } = req.body;
  if (!name || !phone || !password) {
    return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ họ tên, SĐT và mật khẩu' });
  }

  const db = readDB();
  const existingPatient = db.patients.find(p => p.phone === phone);
  if (existingPatient) {
    return res.status(400).json({ success: false, message: 'Số điện thoại này đã được đăng ký tài khoản bệnh nhân!' });
  }

  const newPatientId = 'BN' + String(db.patients.length + 1).padStart(3, '0');
  const patient = {
    id: newPatientId,
    name,
    phone,
    email: email || '',
    dob: dob || '',
    gender: gender || 'Khác',
    address: address || '',
    medicalHistory: medicalHistory || 'Không',
    createdAt: new Date().toISOString()
  };

  const account = {
    id: 'ACC' + String(db.accounts.length + 1).padStart(3, '0'),
    username: phone,
    password,
    role: 'PATIENT',
    fullName: name,
    phone,
    email: email || '',
    patientId: newPatientId,
    status: 'Hoạt động',
    createdAt: new Date().toISOString()
  };

  db.patients.push(patient);
  db.accounts.push(account);
  writeDB(db);

  return res.json({
    success: true,
    message: 'Đăng ký tài khoản bệnh nhân thành công!',
    patient,
    account: { id: account.id, username: account.username, role: account.role, fullName: account.fullName }
  });
});

// Helper to find account by username, phone, email, or aliases
function findAccountByCredentials(db, username, password) {
  if (!username || !password) return null;
  const rawInput = username.trim();
  const lowerUser = rawInput.toLowerCase();

  return (db.accounts || []).find(a => {
    if (a.password !== password) return false;
    const uMatch = a.username && a.username.toLowerCase() === lowerUser;
    const pMatch = a.phone && a.phone === rawInput;
    const eMatch = a.email && a.email.toLowerCase() === lowerUser;
    const aMatch = Array.isArray(a.aliases) && a.aliases.some(alias => alias.toLowerCase() === lowerUser);
    return uMatch || pMatch || eMatch || aMatch;
  });
}

function buildUserResponse(acc, db) {
  let patientData = null;
  if (acc.patientId) {
    patientData = (db.patients || []).find(p => p.id === acc.patientId) || {
      id: acc.patientId,
      name: acc.fullName,
      phone: acc.phone
    };
  }

  let doctorData = null;
  if (acc.doctorId) {
    doctorData = (db.doctors || []).find(d => d.id === acc.doctorId) || null;
  }

  return {
    id: acc.id,
    username: acc.username,
    name: acc.fullName,
    role: acc.role,
    phone: acc.phone,
    email: acc.email,
    patientId: acc.patientId || null,
    doctorId: acc.doctorId || null,
    patientData,
    doctorData
  };
}

// -------------------------------------------------------------
// Unified Login: Đăng nhập tập trung tất cả vai trò trên 1 trang
// -------------------------------------------------------------
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập Tên đăng nhập/SĐT/Email và Mật khẩu!' });
  }

  const db = readDB();
  const acc = findAccountByCredentials(db, username, password);

  if (!acc) {
    return res.status(401).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác!' });
  }

  if (acc.status !== 'Hoạt động') {
    return res.status(403).json({ success: false, message: 'Tài khoản đang bị tạm khóa!' });
  }

  const user = buildUserResponse(acc, db);
  return res.json({
    success: true,
    message: `Đăng nhập thành công với vai trò ${acc.role}!`,
    user
  });
});

// -------------------------------------------------------------
// 2. loginPatient() - Đăng nhập bệnh nhân
// -------------------------------------------------------------
app.post('/api/login-patient', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập SĐT/Email và mật khẩu' });
  }

  const db = readDB();
  const acc = findAccountByCredentials(db, username, password);

  if (!acc || acc.role !== 'PATIENT') {
    return res.status(401).json({ success: false, message: 'Thông tin đăng nhập bệnh nhân không chính xác hoặc sai mật khẩu!' });
  }

  if (acc.status !== 'Hoạt động') {
    return res.status(403).json({ success: false, message: 'Tài khoản bệnh nhân đang bị khóa!' });
  }

  const user = buildUserResponse(acc, db);
  return res.json({
    success: true,
    message: 'Đăng nhập bệnh nhân thành công!',
    user
  });
});

// -------------------------------------------------------------
// 3. loginAdmin() - Đăng nhập Admin / Bác sĩ / Lễ tân
// -------------------------------------------------------------
app.post('/api/login-admin', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập tên đăng nhập và mật khẩu' });
  }

  const db = readDB();
  const acc = findAccountByCredentials(db, username, password);

  if (!acc || !['ADMIN', 'DOCTOR', 'RECEPTIONIST'].includes(acc.role)) {
    return res.status(401).json({ success: false, message: 'Tài khoản quản trị không tồn tại hoặc mật khẩu sai!' });
  }

  if (acc.status !== 'Hoạt động') {
    return res.status(403).json({ success: false, message: 'Tài khoản đã bị tạm khóa!' });
  }

  const user = buildUserResponse(acc, db);
  return res.json({
    success: true,
    message: `Đăng nhập quyền [${acc.role}] thành công!`,
    user
  });
});

// -------------------------------------------------------------
// 4. logout() - Đăng xuất
// -------------------------------------------------------------
app.post('/api/logout', (req, res) => {
  return res.json({
    success: true,
    message: 'Đăng xuất thành công, phiên làm việc đã được đóng.'
  });
});

// -------------------------------------------------------------
// 5. add/update/delete/searchPatient() - Quản lý bệnh nhân
// -------------------------------------------------------------
app.get('/api/patients', (req, res) => {
  const { search } = req.query;
  const db = readDB();
  let list = db.patients || [];

  if (search) {
    const q = search.trim().toLowerCase();
    list = list.filter(p =>
      (p.id && p.id.toLowerCase().includes(q)) ||
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.phone && p.phone.toLowerCase().includes(q)) ||
      (p.email && p.email.toLowerCase().includes(q))
    );
  }
  return res.json({ success: true, count: list.length, data: list });
});

app.post('/api/patients', (req, res) => {
  const { name, phone, email, dob, gender, address, medicalHistory } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ success: false, message: 'Họ tên và số điện thoại là bắt buộc' });
  }

  const db = readDB();
  const id = 'BN' + String(db.patients.length + 1).padStart(3, '0');
  const patient = {
    id,
    name,
    phone,
    email: email || '',
    dob: dob || '',
    gender: gender || 'Khác',
    address: address || '',
    medicalHistory: medicalHistory || 'Không',
    createdAt: new Date().toISOString()
  };

  db.patients.push(patient);
  writeDB(db);

  return res.json({ success: true, message: 'Thêm mới bệnh nhân thành công!', data: patient });
});

app.put('/api/patients/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = db.patients.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy bệnh nhân với mã ' + id });
  }

  db.patients[index] = { ...db.patients[index], ...req.body, id };
  writeDB(db);
  return res.json({ success: true, message: 'Cập nhật thông tin bệnh nhân thành công!', data: db.patients[index] });
});

app.delete('/api/patients/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = db.patients.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy bệnh nhân' });
  }

  const deleted = db.patients.splice(index, 1);
  writeDB(db);
  return res.json({ success: true, message: 'Xóa bệnh nhân thành công!', data: deleted[0] });
});

// -------------------------------------------------------------
// 6. add/update/delete/searchDoctor() - Quản lý bác sĩ
// -------------------------------------------------------------
app.get('/api/doctors', (req, res) => {
  const { search } = req.query;
  const db = readDB();
  let list = db.doctors || [];

  if (search) {
    const q = search.trim().toLowerCase();
    list = list.filter(d =>
      (d.id && d.id.toLowerCase().includes(q)) ||
      (d.name && d.name.toLowerCase().includes(q)) ||
      (d.specialty && d.specialty.toLowerCase().includes(q)) ||
      (d.phone && d.phone.toLowerCase().includes(q))
    );
  }
  return res.json({ success: true, count: list.length, data: list });
});

app.post('/api/doctors', (req, res) => {
  const { name, specialty, phone, email, schedule, workHours, experience } = req.body;
  if (!name || !specialty || !phone) {
    return res.status(400).json({ success: false, message: 'Tên, chuyên khoa và SĐT bác sĩ là bắt buộc' });
  }

  const db = readDB();
  const id = 'BS' + String(db.doctors.length + 1).padStart(3, '0');
  const doctor = {
    id,
    name,
    specialty,
    phone,
    email: email || '',
    schedule: schedule || ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'],
    workHours: workHours || '08:00 - 17:30',
    experience: experience || 'Bác sĩ chuyên khoa Răng Hàm Mặt'
  };

  db.doctors.push(doctor);
  writeDB(db);
  return res.json({ success: true, message: 'Thêm bác sĩ thành công!', data: doctor });
});

app.put('/api/doctors/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = db.doctors.findIndex(d => d.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy bác sĩ ' + id });
  }

  db.doctors[index] = { ...db.doctors[index], ...req.body, id };
  writeDB(db);
  return res.json({ success: true, message: 'Cập nhật bác sĩ thành công!', data: db.doctors[index] });
});

app.delete('/api/doctors/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = db.doctors.findIndex(d => d.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy bác sĩ' });
  }

  const deleted = db.doctors.splice(index, 1);
  writeDB(db);
  return res.json({ success: true, message: 'Xóa bác sĩ thành công!', data: deleted[0] });
});

// -------------------------------------------------------------
// 7. checkDoctorSchedule() - Kiểm tra lịch bác sĩ
// -------------------------------------------------------------
app.get('/api/doctors/:id/schedule', (req, res) => {
  const { id } = req.params;
  const { date } = req.query;
  const db = readDB();
  const doctor = db.doctors.find(d => d.id === id);
  if (!doctor) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy bác sĩ ' + id });
  }

  const standardSlots = [
    '08:00', '08:45', '09:30', '10:15', '11:00',
    '13:30', '14:15', '15:00', '15:45', '16:30'
  ];

  const targetDate = date || new Date().toISOString().split('T')[0];
  const bookedAppointments = (db.appointments || []).filter(
    a => a.doctorId === id && a.date === targetDate && a.status !== 'Đã hủy'
  );
  const bookedTimes = bookedAppointments.map(a => a.time);

  const slotDetails = standardSlots.map(time => {
    const isBooked = bookedTimes.includes(time);
    const appt = bookedAppointments.find(a => a.time === time);
    return {
      time,
      available: !isBooked,
      bookedAppointmentId: isBooked ? appt.id : null,
      patientName: isBooked ? appt.patientName : null
    };
  });

  return res.json({
    success: true,
    doctor: {
      id: doctor.id,
      name: doctor.name,
      specialty: doctor.specialty,
      workHours: doctor.workHours,
      workingDays: doctor.schedule
    },
    date: targetDate,
    slots: slotDetails,
    summary: {
      totalSlots: standardSlots.length,
      availableSlots: slotDetails.filter(s => s.available).length,
      bookedSlots: slotDetails.filter(s => !s.available).length
    }
  });
});

// -------------------------------------------------------------
// 8. createAppointment() - Đặt lịch khám
// -------------------------------------------------------------
app.post('/api/appointments', (req, res) => {
  const { patientId, doctorId, serviceId, date, time, notes } = req.body;
  if (!patientId || !doctorId || !date || !time) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp bệnh nhân, bác sĩ, ngày và giờ khám' });
  }

  const db = readDB();
  const patient = db.patients.find(p => p.id === patientId);
  const doctor = db.doctors.find(d => d.id === doctorId);
  const service = db.services.find(s => s.id === serviceId);

  if (!patient) return res.status(400).json({ success: false, message: 'Bệnh nhân không tồn tại' });
  if (!doctor) return res.status(400).json({ success: false, message: 'Bác sĩ không tồn tại' });

  const isConflict = db.appointments.some(
    a => a.doctorId === doctorId && a.date === date && a.time === time && a.status !== 'Đã hủy'
  );
  if (isConflict) {
    return res.status(400).json({ success: false, message: `Bác sĩ ${doctor.name} đã có lịch khám vào lúc ${time} ngày ${date}!` });
  }

  const newId = 'LH' + String(db.appointments.length + 1).padStart(3, '0');
  const appointment = {
    id: newId,
    patientId,
    patientName: patient.name,
    patientPhone: patient.phone,
    doctorId,
    doctorName: doctor.name,
    serviceId: service ? service.id : '',
    serviceName: service ? service.name : 'Khám tổng quát',
    date,
    time,
    status: 'Chờ khám',
    room: 'Phòng khám ' + doctor.id.replace('BS', ''),
    notes: notes || '',
    createdAt: new Date().toISOString()
  };

  db.appointments.push(appointment);
  writeDB(db);

  return res.json({ success: true, message: 'Đặt lịch khám thành công!', data: appointment });
});

// -------------------------------------------------------------
// 9. viewAppointments() - Xem lịch khám
// -------------------------------------------------------------
app.get('/api/appointments', (req, res) => {
  const { date, doctorId, patientId, status } = req.query;
  const db = readDB();
  let list = db.appointments || [];

  if (date) list = list.filter(a => a.date === date);
  if (doctorId) list = list.filter(a => a.doctorId === doctorId);
  if (patientId) list = list.filter(a => a.patientId === patientId);
  if (status) list = list.filter(a => a.status === status);

  return res.json({ success: true, count: list.length, data: list });
});

// -------------------------------------------------------------
// 10. cancelAppointment() - Hủy lịch
// -------------------------------------------------------------
app.put('/api/appointments/:id/cancel', (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const db = readDB();
  const appt = db.appointments.find(a => a.id === id);

  if (!appt) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy lịch hẹn ' + id });
  }

  appt.status = 'Đã hủy';
  appt.cancelReason = reason || 'Bệnh nhân yêu cầu hủy';
  appt.cancelledAt = new Date().toISOString();

  writeDB(db);
  return res.json({ success: true, message: 'Hủy lịch hẹn thành công!', data: appt });
});

// -------------------------------------------------------------
// 11. rescheduleAppointment() - Đổi lịch
// -------------------------------------------------------------
app.put('/api/appointments/:id/reschedule', (req, res) => {
  const { id } = req.params;
  const { newDate, newTime, reason } = req.body;
  if (!newDate || !newTime) {
    return res.status(400).json({ success: false, message: 'Vui lòng chọn ngày và giờ khám mới' });
  }

  const db = readDB();
  const appt = db.appointments.find(a => a.id === id);
  if (!appt) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy lịch hẹn ' + id });
  }

  const conflict = db.appointments.some(
    a => a.id !== id && a.doctorId === appt.doctorId && a.date === newDate && a.time === newTime && a.status !== 'Đã hủy'
  );
  if (conflict) {
    return res.status(400).json({ success: false, message: `Bác sĩ đã có lịch khám vào ${newTime} ngày ${newDate}!` });
  }

  const oldDate = appt.date;
  const oldTime = appt.time;
  appt.date = newDate;
  appt.time = newTime;
  appt.status = 'Chờ khám';
  appt.rescheduleHistory = appt.rescheduleHistory || [];
  appt.rescheduleHistory.push({
    from: `${oldDate} ${oldTime}`,
    to: `${newDate} ${newTime}`,
    reason: reason || 'Đổi lịch theo yêu cầu',
    changedAt: new Date().toISOString()
  });

  writeDB(db);
  return res.json({ success: true, message: 'Đổi lịch hẹn khám thành công!', data: appt });
});

// -------------------------------------------------------------
// 12. receivePatient() - Tiếp nhận bệnh nhân
// -------------------------------------------------------------
app.put('/api/appointments/:id/receive', (req, res) => {
  const { id } = req.params;
  const { room, receptionistNote } = req.body;
  const db = readDB();
  const appt = db.appointments.find(a => a.id === id);

  if (!appt) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy lịch hẹn ' + id });
  }

  appt.status = 'Đã tiếp nhận';
  if (room) appt.room = room;
  appt.receivedAt = new Date().toISOString();
  appt.receptionistNote = receptionistNote || 'Bệnh nhân đã có mặt tại sảnh chờ';

  writeDB(db);
  return res.json({ success: true, message: 'Tiếp nhận bệnh nhân thành công, sẵn sàng khám!', data: appt });
});

// -------------------------------------------------------------
// 13. examinePatient() - Khám bệnh
// -------------------------------------------------------------
app.get('/api/examinations', (req, res) => {
  const { patientId } = req.query;
  const db = readDB();
  let list = db.examinations || [];
  if (patientId) list = list.filter(e => e.patientId === patientId);
  return res.json({ success: true, count: list.length, data: list });
});

app.post('/api/examinations', (req, res) => {
  const { appointmentId, patientId, doctorId, clinicalFindings, teeth, diagnosis, xrayRequired, recommendations } = req.body;
  if (!patientId || !doctorId || !diagnosis) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin khám và chẩn đoán' });
  }

  const db = readDB();
  const patient = db.patients.find(p => p.id === patientId);
  const doctor = db.doctors.find(d => d.id === doctorId);

  const newId = 'KB' + String(db.examinations.length + 1).padStart(3, '0');
  const examination = {
    id: newId,
    appointmentId: appointmentId || '',
    patientId,
    patientName: patient ? patient.name : '',
    doctorId,
    doctorName: doctor ? doctor.name : '',
    date: new Date().toISOString(),
    clinicalFindings: clinicalFindings || '',
    teeth: Array.isArray(teeth) ? teeth : (teeth ? [teeth] : []),
    diagnosis,
    xrayRequired: !!xrayRequired,
    recommendations: recommendations || ''
  };

  db.examinations.push(examination);

  if (appointmentId) {
    const appt = db.appointments.find(a => a.id === appointmentId);
    if (appt) {
      appt.status = 'Đang điều trị';
    }
  }

  writeDB(db);
  return res.json({ success: true, message: 'Lưu kết quả khám bệnh thành công!', data: examination });
});

// -------------------------------------------------------------
// 14. createTreatmentRecord() - Lập hồ sơ điều trị
// -------------------------------------------------------------
app.get('/api/treatment-records', (req, res) => {
  const { patientId } = req.query;
  const db = readDB();
  let list = db.treatmentRecords || [];
  if (patientId) list = list.filter(r => r.patientId === patientId);
  return res.json({ success: true, count: list.length, data: list });
});

app.post('/api/treatment-records', (req, res) => {
  const { examinationId, patientId, doctorId, diagnosis, treatmentMethod, progressNotes, doctorNotes } = req.body;
  if (!patientId || !doctorId || !treatmentMethod) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp bệnh nhân, bác sĩ và phương pháp điều trị' });
  }

  const db = readDB();
  const patient = db.patients.find(p => p.id === patientId);
  const doctor = db.doctors.find(d => d.id === doctorId);

  const newId = 'HS' + String(db.treatmentRecords.length + 1).padStart(3, '0');
  const record = {
    id: newId,
    examinationId: examinationId || '',
    patientId,
    patientName: patient ? patient.name : '',
    doctorId,
    doctorName: doctor ? doctor.name : '',
    date: new Date().toISOString(),
    diagnosis: diagnosis || '',
    treatmentMethod,
    progressNotes: progressNotes || '',
    doctorNotes: doctorNotes || ''
  };

  db.treatmentRecords.push(record);
  writeDB(db);
  return res.json({ success: true, message: 'Lập hồ sơ điều trị thành công!', data: record });
});

// -------------------------------------------------------------
// 15. assignService() - Chỉ định dịch vụ
// -------------------------------------------------------------
app.get('/api/service-assignments', (req, res) => {
  const { patientId } = req.query;
  const db = readDB();
  let list = db.serviceAssignments || [];
  if (patientId) list = list.filter(a => a.patientId === patientId);
  return res.json({ success: true, count: list.length, data: list });
});

app.post('/api/service-assignments', (req, res) => {
  const { patientId, doctorId, services } = req.body;
  if (!patientId || !doctorId || !services || !services.length) {
    return res.status(400).json({ success: false, message: 'Vui lòng chọn bệnh nhân, bác sĩ và ít nhất 1 dịch vụ chỉ định' });
  }

  const db = readDB();
  const patient = db.patients.find(p => p.id === patientId);
  const doctor = db.doctors.find(d => d.id === doctorId);

  let totalAmount = 0;
  const assignedServices = services.map(item => {
    const s = db.services.find(srv => srv.id === item.serviceId);
    const qty = parseInt(item.quantity, 10) || 1;
    const price = s ? s.price : 0;
    const subtotal = price * qty;
    totalAmount += subtotal;
    return {
      serviceId: item.serviceId,
      serviceName: s ? s.name : 'Dịch vụ tùy chọn',
      quantity: qty,
      price,
      subtotal
    };
  });

  const newId = 'CD' + String(db.serviceAssignments.length + 1).padStart(3, '0');
  const assignment = {
    id: newId,
    patientId,
    patientName: patient ? patient.name : '',
    doctorId,
    doctorName: doctor ? doctor.name : '',
    date: new Date().toISOString(),
    services: assignedServices,
    totalAmount,
    status: 'Đã chỉ định'
  };

  db.serviceAssignments.push(assignment);
  writeDB(db);
  return res.json({ success: true, message: 'Chỉ định dịch vụ thành công!', data: assignment });
});

// -------------------------------------------------------------
// 16. add/update/deleteService() - Quản lý dịch vụ
// -------------------------------------------------------------
app.get('/api/services', (req, res) => {
  const db = readDB();
  return res.json({ success: true, count: db.services.length, data: db.services });
});

app.post('/api/services', (req, res) => {
  const { name, price, unit, description, warranty } = req.body;
  if (!name || price === undefined) {
    return res.status(400).json({ success: false, message: 'Tên dịch vụ và giá là bắt buộc' });
  }

  const db = readDB();
  const id = 'DV' + String(db.services.length + 1).padStart(3, '0');
  const service = {
    id,
    name,
    price: Number(price),
    unit: unit || 'Lần',
    description: description || '',
    warranty: warranty || 'Không'
  };

  db.services.push(service);
  writeDB(db);
  return res.json({ success: true, message: 'Thêm mới dịch vụ thành công!', data: service });
});

app.put('/api/services/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = db.services.findIndex(s => s.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy dịch vụ ' + id });
  }

  db.services[index] = {
    ...db.services[index],
    ...req.body,
    price: req.body.price !== undefined ? Number(req.body.price) : db.services[index].price,
    id
  };
  writeDB(db);
  return res.json({ success: true, message: 'Cập nhật dịch vụ thành công!', data: db.services[index] });
});

app.delete('/api/services/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = db.services.findIndex(s => s.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy dịch vụ' });
  }

  const deleted = db.services.splice(index, 1);
  writeDB(db);
  return res.json({ success: true, message: 'Xóa dịch vụ thành công!', data: deleted[0] });
});

// -------------------------------------------------------------
// 17. createTreatmentPlan() - Lập kế hoạch điều trị
// -------------------------------------------------------------
app.get('/api/treatment-plans', (req, res) => {
  const { patientId } = req.query;
  const db = readDB();
  let list = db.treatmentPlans || [];
  if (patientId) list = list.filter(p => p.patientId === patientId);
  return res.json({ success: true, count: list.length, data: list });
});

app.post('/api/treatment-plans', (req, res) => {
  const { patientId, doctorId, planName, stages, discount } = req.body;
  if (!patientId || !doctorId || !planName || !stages || !stages.length) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ thông tin phác đồ và các giai đoạn điều trị' });
  }

  const db = readDB();
  const patient = db.patients.find(p => p.id === patientId);
  const doctor = db.doctors.find(d => d.id === doctorId);

  let totalEstimatedCost = 0;
  const formattedStages = stages.map((stg, i) => {
    const cost = Number(stg.estimatedCost) || 0;
    totalEstimatedCost += cost;
    return {
      stageNumber: i + 1,
      title: stg.title || `Giai đoạn ${i + 1}`,
      duration: stg.duration || '1 buổi',
      estimatedCost: cost,
      status: stg.status || 'Chưa thực hiện'
    };
  });

  const disc = Number(discount) || 0;
  const finalCost = Math.max(0, totalEstimatedCost - disc);

  const newId = 'KH' + String(db.treatmentPlans.length + 1).padStart(3, '0');
  const plan = {
    id: newId,
    patientId,
    patientName: patient ? patient.name : '',
    doctorId,
    doctorName: doctor ? doctor.name : '',
    planName,
    stages: formattedStages,
    totalEstimatedCost,
    discount: disc,
    finalCost,
    patientConfirmed: false,
    confirmedAt: null,
    status: 'Chờ bệnh nhân xác nhận',
    createdAt: new Date().toISOString()
  };

  db.treatmentPlans.push(plan);
  writeDB(db);
  return res.json({ success: true, message: 'Lập kế hoạch điều trị thành công!', data: plan });
});

// -------------------------------------------------------------
// 18. calculateCost() - Báo giá
// -------------------------------------------------------------
app.post('/api/calculate-cost', (req, res) => {
  const { items, discountPercent, discountAmount, insurancePercent } = req.body;
  if (!items || !items.length) {
    return res.status(400).json({ success: false, message: 'Danh sách dịch vụ báo giá không được rỗng' });
  }

  const db = readDB();
  let subtotal = 0;
  const calculatedItems = items.map(item => {
    const srv = db.services.find(s => s.id === item.serviceId);
    const price = srv ? srv.price : 0;
    const qty = Number(item.quantity) || 1;
    const amount = price * qty;
    subtotal += amount;
    return {
      serviceId: item.serviceId,
      serviceName: srv ? srv.name : 'Dịch vụ tùy chọn',
      unit: srv ? srv.unit : 'Lần',
      price,
      quantity: qty,
      amount
    };
  });

  const dPercent = Number(discountPercent) || 0;
  const dAmount = Number(discountAmount) || 0;
  const insPercent = Number(insurancePercent) || 0;

  const percentDiscountVal = (subtotal * dPercent) / 100;
  const totalDiscount = percentDiscountVal + dAmount;
  const insuranceCover = (subtotal * insPercent) / 100;

  const finalTotal = Math.max(0, subtotal - totalDiscount - insuranceCover);

  return res.json({
    success: true,
    message: 'Báo giá thành công!',
    breakdown: {
      items: calculatedItems,
      subtotal,
      discountPercent: dPercent,
      discountFromPercent: percentDiscountVal,
      discountDirectAmount: dAmount,
      totalDiscount,
      insurancePercent: insPercent,
      insuranceCover,
      finalTotal
    }
  });
});

// -------------------------------------------------------------
// 19. confirmTreatment() - Xác nhận điều trị
// -------------------------------------------------------------
app.put('/api/treatment-plans/:id/confirm', (req, res) => {
  const { id } = req.params;
  const { confirmedBy, signatureNote } = req.body;
  const db = readDB();
  const plan = db.treatmentPlans.find(p => p.id === id);

  if (!plan) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy kế hoạch điều trị ' + id });
  }

  plan.patientConfirmed = true;
  plan.confirmedAt = new Date().toISOString();
  plan.confirmedBy = confirmedBy || 'Bệnh nhân ' + plan.patientName;
  plan.signatureNote = signatureNote || 'Bệnh nhân đồng ý thực hiện phác đồ và cam kết tuân thủ hướng dẫn điều trị.';
  plan.status = 'Đã xác nhận - Đang điều trị';

  writeDB(db);
  return res.json({ success: true, message: 'Xác nhận kế hoạch điều trị thành công!', data: plan });
});

// -------------------------------------------------------------
// 20. makePayment() - Thanh toán
// -------------------------------------------------------------
app.get('/api/payments', (req, res) => {
  const { patientId } = req.query;
  const db = readDB();
  let list = db.payments || [];
  if (patientId) list = list.filter(p => p.patientId === patientId);
  return res.json({ success: true, count: list.length, data: list });
});

app.post('/api/payments', (req, res) => {
  const { patientId, treatmentPlanId, serviceAssignmentId, totalAmount, discount, amountPaid, paymentMethod, cashier } = req.body;
  if (!patientId || amountPaid === undefined) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp bệnh nhân và số tiền thanh toán' });
  }

  const db = readDB();
  const patient = db.patients.find(p => p.id === patientId);
  const total = Number(totalAmount) || Number(amountPaid);
  const disc = Number(discount) || 0;
  const paid = Number(amountPaid);
  const netTotal = Math.max(0, total - disc);
  const debt = Math.max(0, netTotal - paid);

  const newId = 'TT' + String(db.payments.length + 1).padStart(3, '0');
  const payment = {
    id: newId,
    patientId,
    patientName: patient ? patient.name : '',
    treatmentPlanId: treatmentPlanId || '',
    serviceAssignmentId: serviceAssignmentId || '',
    totalAmount: total,
    discount: disc,
    amountPaid: paid,
    debt,
    paymentMethod: paymentMethod || 'Tiền mặt',
    paymentDate: new Date().toISOString(),
    cashier: cashier || 'Thu ngân phòng khám',
    status: debt === 0 ? 'Đã thanh toán' : 'Còn công nợ'
  };

  db.payments.push(payment);
  writeDB(db);
  return res.json({ success: true, message: 'Lập phiếu thanh toán thành công!', data: payment });
});

// -------------------------------------------------------------
// 21. bookFollowUpAppointment() - Đặt lịch tái khám
// -------------------------------------------------------------
app.get('/api/follow-ups', (req, res) => {
  const { patientId } = req.query;
  const db = readDB();
  let list = db.followUps || [];
  if (patientId) list = list.filter(f => f.patientId === patientId);
  return res.json({ success: true, count: list.length, data: list });
});

app.post('/api/follow-ups', (req, res) => {
  const { patientId, doctorId, followUpDate, followUpTime, purpose } = req.body;
  if (!patientId || !doctorId || !followUpDate || !followUpTime) {
    return res.status(400).json({ success: false, message: 'Vui lòng chọn bệnh nhân, bác sĩ, ngày và giờ hẹn tái khám' });
  }

  const db = readDB();
  const patient = db.patients.find(p => p.id === patientId);
  const doctor = db.doctors.find(d => d.id === doctorId);

  const newId = 'TK' + String(db.followUps.length + 1).padStart(3, '0');
  const followUp = {
    id: newId,
    patientId,
    patientName: patient ? patient.name : '',
    patientPhone: patient ? patient.phone : '',
    doctorId,
    doctorName: doctor ? doctor.name : '',
    followUpDate,
    followUpTime,
    purpose: purpose || 'Tái khám định kỳ và kiểm tra tiến độ phục hồi',
    status: 'Đã lên lịch',
    createdAt: new Date().toISOString()
  };

  db.followUps.push(followUp);

  const newApptId = 'LH' + String(db.appointments.length + 1).padStart(3, '0');
  db.appointments.push({
    id: newApptId,
    patientId,
    patientName: patient ? patient.name : '',
    patientPhone: patient ? patient.phone : '',
    doctorId,
    doctorName: doctor ? doctor.name : '',
    serviceId: 'DV001',
    serviceName: 'Tái khám theo hẹn: ' + (purpose || 'Kiểm tra răng'),
    date: followUpDate,
    time: followUpTime,
    status: 'Chờ khám',
    room: 'Phòng khám ' + doctor.id.replace('BS', ''),
    notes: 'Lịch tái khám mã ' + newId,
    createdAt: new Date().toISOString()
  });

  writeDB(db);
  return res.json({ success: true, message: 'Đặt lịch tái khám thành công!', data: followUp });
});

// -------------------------------------------------------------
// 22. viewTreatmentHistory() - Xem lịch sử điều trị
// -------------------------------------------------------------
app.get('/api/patients/:id/history', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const patient = db.patients.find(p => p.id === id);

  if (!patient) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy bệnh nhân mã ' + id });
  }

  const appointments = (db.appointments || []).filter(a => a.patientId === id);
  const examinations = (db.examinations || []).filter(e => e.patientId === id);
  const treatmentRecords = (db.treatmentRecords || []).filter(r => r.patientId === id);
  const serviceAssignments = (db.serviceAssignments || []).filter(s => s.patientId === id);
  const treatmentPlans = (db.treatmentPlans || []).filter(p => p.patientId === id);
  const payments = (db.payments || []).filter(p => p.patientId === id);
  const followUps = (db.followUps || []).filter(f => f.patientId === id);

  return res.json({
    success: true,
    patient,
    history: {
      appointments,
      examinations,
      treatmentRecords,
      serviceAssignments,
      treatmentPlans,
      payments,
      followUps
    },
    stats: {
      totalAppointments: appointments.length,
      totalTreatments: treatmentRecords.length,
      totalPayments: payments.reduce((sum, p) => sum + (p.amountPaid || 0), 0)
    }
  });
});

// -------------------------------------------------------------
// 23. manageAccount() - Quản lý tài khoản
// -------------------------------------------------------------
app.get('/api/accounts', (req, res) => {
  const db = readDB();
  const safeAccounts = db.accounts.map(a => ({
    id: a.id,
    username: a.username,
    role: a.role,
    fullName: a.fullName,
    phone: a.phone || '',
    email: a.email || '',
    status: a.status || 'Hoạt động',
    patientId: a.patientId || null,
    doctorId: a.doctorId || null,
    createdAt: a.createdAt
  }));
  return res.json({ success: true, count: safeAccounts.length, data: safeAccounts });
});

app.post('/api/accounts', (req, res) => {
  const { username, password, role, fullName, phone, email, doctorId } = req.body;
  if (!username || !password || !role || !fullName) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp username, password, role và họ tên' });
  }

  const db = readDB();
  if (db.accounts.some(a => a.username === username)) {
    return res.status(400).json({ success: false, message: 'Tên đăng nhập đã tồn tại!' });
  }

  const newId = 'ACC' + String(db.accounts.length + 1).padStart(3, '0');
  const account = {
    id: newId,
    username,
    password,
    role,
    fullName,
    phone: phone || '',
    email: email || '',
    doctorId: doctorId || null,
    status: 'Hoạt động',
    createdAt: new Date().toISOString()
  };

  db.accounts.push(account);
  writeDB(db);
  return res.json({
    success: true,
    message: 'Tạo tài khoản thành công!',
    data: { id: account.id, username: account.username, role: account.role, fullName: account.fullName }
  });
});

app.put('/api/accounts/:id', (req, res) => {
  const { id } = req.params;
  const { password, status, fullName, phone, email, role } = req.body;
  const db = readDB();
  const acc = db.accounts.find(a => a.id === id);

  if (!acc) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản ' + id });
  }

  if (password) acc.password = password;
  if (status) acc.status = status;
  if (fullName) acc.fullName = fullName;
  if (phone !== undefined) acc.phone = phone;
  if (email !== undefined) acc.email = email;
  if (role) acc.role = role;

  writeDB(db);
  return res.json({ success: true, message: 'Cập nhật tài khoản thành công!', data: acc });
});

app.delete('/api/accounts/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = db.accounts.findIndex(a => a.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });
  }

  const deleted = db.accounts.splice(index, 1);
  writeDB(db);
  return res.json({ success: true, message: 'Xóa tài khoản thành công!', data: deleted[0] });
});

// Overview stats for Portal Dashboard
app.get('/api/stats', (req, res) => {
  const db = readDB();
  return res.json({
    success: true,
    stats: {
      patientCount: (db.patients || []).length,
      doctorCount: (db.doctors || []).length,
      serviceCount: (db.services || []).length,
      appointmentCount: (db.appointments || []).length,
      examinationCount: (db.examinations || []).length,
      treatmentRecordCount: (db.treatmentRecords || []).length,
      treatmentPlanCount: (db.treatmentPlans || []).length,
      paymentCount: (db.payments || []).length,
      totalRevenue: (db.payments || []).reduce((sum, p) => sum + (p.amountPaid || 0), 0),
      accountCount: (db.accounts || []).length
    }
  });
});

// Fallback to index.html for SPA/Portal root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server on Port 8080
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Nha Khoa Nhóm 7 Express Server running on port ${PORT}`);
  console.log(`👉 Open: http://localhost:${PORT}`);
  console.log(`📋 Total 23 Dental Clinic functions ready!`);
  console.log(`💾 Database file: ${DB_FILE}`);
  console.log(`====================================================`);
});
