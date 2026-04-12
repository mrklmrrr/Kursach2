const jwt = require('jsonwebtoken');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] }
});

app.use(cors());
app.use(express.json());

// ========== Хранилища данных (в памяти) ==========
let users = [];
let consultations = [];
let nextConsultationId = 1;
let dependents = [];
let nextDependentId = 1;

const calculateAge = (birthDate) => {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ========== Врачи ==========
app.get('/api/doctors', (req, res) => {
  res.json([
    { id: 1, name: 'Анна Иванова', specialty: 'Педиатр', rating: 4.9, isOnline: true, price: 59 },
    { id: 2, name: 'Сергей Петров', specialty: 'Терапевт', rating: 4.7, isOnline: true, price: 69 },
    { id: 3, name: 'Мария Сидорова', specialty: 'Травматолог', rating: 5.0, isOnline: false, price: 79 },
    { id: 4, name: 'Елена Смирнова', specialty: 'Психолог', rating: 4.8, isOnline: true, price: 65 },
    { id: 5, name: 'Дмитрий Козлов', specialty: 'Онколог', rating: 4.9, isOnline: true, price: 85 },
    { id: 6, name: 'Ирина Васильева', specialty: 'ЛОР', rating: 4.7, isOnline: true, price: 60 },
    { id: 7, name: 'Павел Новиков', specialty: 'Кардиолог', rating: 4.9, isOnline: false, price: 75 },
  ]);
});

app.get('/api/doctors/:id', (req, res) => {
  const doctors = [
    { id: 1, name: 'Анна Иванова', specialty: 'Педиатр', rating: 4.9, isOnline: true, price: 59 },
    { id: 2, name: 'Сергей Петров', specialty: 'Терапевт', rating: 4.7, isOnline: true, price: 69 },
    { id: 3, name: 'Мария Сидорова', specialty: 'Травматолог', rating: 5.0, isOnline: false, price: 79 },
    { id: 4, name: 'Елена Смирнова', specialty: 'Психолог', rating: 4.8, isOnline: true, price: 65 },
    { id: 5, name: 'Дмитрий Козлов', specialty: 'Онколог', rating: 4.9, isOnline: true, price: 85 },
    { id: 6, name: 'Ирина Васильева', specialty: 'ЛОР', rating: 4.7, isOnline: true, price: 60 },
    { id: 7, name: 'Павел Новиков', specialty: 'Кардиолог', rating: 4.9, isOnline: false, price: 75 },
  ];
  const doctor = doctors.find(d => d.id === parseInt(req.params.id));
  if (!doctor) return res.status(404).json({ message: 'Врач не найден' });
  res.json(doctor);
});

// ========== Авторизация ==========
app.post('/api/auth/register', async (req, res) => {
  const { firstName, lastName, phone, birthDate, gender } = req.body;
  const id = Date.now();
  const age = calculateAge(birthDate);
  const user = { id, firstName, lastName, phone, birthDate, gender, age };
  users.push(user);
  const token = jwt.sign({ id }, process.env.JWT_SECRET || 'secretkey', { expiresIn: '30d' });
  res.json({ token, user: { id, name: `${firstName} ${lastName}`, phone, birthDate, gender, age } });
});

app.post('/api/auth/login', (req, res) => {
  const { phone } = req.body;
  const user = users.find(u => u.phone === phone);
  if (!user) return res.status(401).json({ message: 'Неверный телефон' });
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secretkey');
  res.json({ token, user: { id: user.id, name: `${user.firstName} ${user.lastName}`, phone: user.phone, birthDate: user.birthDate, gender: user.gender, age: user.age } });
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Нет токена' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
    const user = users.find(u => u.id === decoded.id);
    if (!user) return res.status(401).json({ message: 'Пользователь не найден' });
    res.json({ id: user.id, name: `${user.firstName} ${user.lastName}`, phone: user.phone, birthDate: user.birthDate, gender: user.gender, age: user.age });
  } catch { res.status(401).json({ message: 'Неверный токен' }); }
});

app.put('/api/auth/user', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Нет токена' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
    const user = users.find(u => u.id === decoded.id);
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
    const { birthDate, gender } = req.body;
    if (birthDate) { user.birthDate = birthDate; user.age = calculateAge(birthDate); }
    if (gender) user.gender = gender;
    res.json({ id: user.id, name: `${user.firstName} ${user.lastName}`, phone: user.phone, birthDate: user.birthDate, gender: user.gender, age: user.age });
  } catch { res.status(401).json({ message: 'Неверный токен' }); }
});

// ========== Консультации и оплата ==========
app.post('/api/consultations', (req, res) => {
  const { doctorId, doctorName, specialty, price, duration, patientId, patientName, type = 'video' } = req.body;
  const consultation = {
    id: nextConsultationId++,
    doctorId,
    doctorName,
    specialty,
    price,
    duration,
    patientId,
    patientName,
    type, // 'video' или 'chat'
    status: 'pending',
    createdAt: new Date().toISOString(),
    paymentId: null,
    paidAt: null,
    messages: []
  };
  consultations.push(consultation);
  res.json({ consultationId: consultation.id, ...consultation });
});

app.post('/api/payments', (req, res) => {
  const { consultationId, cardNumber, expiry, cvc } = req.body;
  if (!cardNumber || !expiry || !cvc) return res.status(400).json({ success: false, message: 'Заполните все поля карты' });
  const paymentId = Date.now();
  const consultation = consultations.find(c => c.id === parseInt(consultationId));
  if (consultation) {
    consultation.status = 'paid';
    consultation.paymentId = paymentId;
    consultation.paidAt = new Date().toISOString();
  }
  res.json({ success: true, paymentId, consultationId });
});

app.get('/api/consultations/:id', (req, res) => {
  const consultation = consultations.find(c => c.id === parseInt(req.params.id));
  if (!consultation) return res.status(404).json({ message: 'Консультация не найдена' });
  res.json(consultation);
});

app.get('/api/consultations/patient/:patientId', (req, res) => {
  const patientId = parseInt(req.params.patientId);
  const userConsultations = consultations.filter(c => c.patientId === patientId);
  res.json(userConsultations);
});

// ========== Родственники ==========
app.get('/api/dependents', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Нет токена' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
    const userDependents = dependents.filter(d => d.userId === decoded.id);
    res.json(userDependents);
  } catch { res.status(401).json({ message: 'Неверный токен' }); }
});

app.post('/api/dependents', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Нет токена' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
    const { name, age, relation } = req.body;
    const dependent = { id: nextDependentId++, userId: decoded.id, name, age: parseInt(age), relation };
    dependents.push(dependent);
    res.json(dependent);
  } catch { res.status(401).json({ message: 'Неверный токен' }); }
});

// ========== Socket.io (чат) ==========
io.on('connection', (socket) => {
  console.log('✅ Новый клиент подключился');

  socket.on('join-chat', (chatId) => {
    socket.join(`chat-${chatId}`);
    console.log(`Клиент присоединился к комнате chat-${chatId}`);
    const consultation = consultations.find(c => c.id === parseInt(chatId));
    if (consultation && consultation.messages) {
      socket.emit('chat-history', consultation.messages);
    } else {
      socket.emit('chat-history', []); // если нет истории
    }
  });

  socket.on('send-message', (data) => {
    const { chatId, message, sender, timestamp } = data;
    const consultation = consultations.find(c => c.id === parseInt(chatId));
    if (consultation) {
      consultation.messages.push({ message, sender, timestamp });
    }
    io.to(`chat-${chatId}`).emit('new-message', { message, sender, timestamp, chatId });
  });

  socket.on('disconnect', () => console.log('❌ Клиент отключился'));
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`🚀 Сервер запущен на http://localhost:${PORT}`));