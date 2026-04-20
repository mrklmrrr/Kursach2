const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const config = require('./config');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Repositories
const {
  UserRepository,
  ConsultationRepository,
  DependentRepository,
  DoctorRepository,
  AppointmentRepository,
  MedicalRecordRepository
} = require('./repositories');

// Services
const {
  AuthService,
  DoctorService,
  ConsultationService,
  PaymentService,
  DependentService,
  AppointmentService,
  MedicalRecordService
} = require('./services');

// Controllers
const {
  AuthController,
  DoctorController,
  ConsultationController,
  PaymentController,
  DependentController,
  AdminController,
  DoctorPanelController,
  AppointmentController,
  MedicalRecordController
} = require('./controllers');

// Routes
const {
  authRoutes,
  doctorRoutes,
  consultationRoutes,
  paymentRoutes,
  dependentRoutes,
  adminRoutes,
  doctorPanelRoutes,
  appointmentRoutes,
  medicalRecordRoutes,
  researchRoutes
} = require('./routes');

// Socket
const { setupSocket } = require('./config/socket');

async function startApp() {
  // Подключение к MongoDB
  await connectDB();

  const app = express();
  const server = http.createServer(app);

  // Middleware
  app.use(helmet());
  app.use(cors({
    origin(origin, callback) {
      if (!origin || config.frontendOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Origin is not allowed by CORS'));
    },
    credentials: true
  }));
  app.use(mongoSanitize());
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 600,
    standardHeaders: true,
    legacyHeaders: false
  }));
  app.use(express.json());
  app.use('/api/auth/login', rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false
  }));
  app.use('/api/admin/login', rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false
  }));
  // Middleware to set Cross-Origin Resource Policy for uploads
  app.use('/uploads', (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  });
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Health check
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.get('/api/readiness', (req, res) => res.json({ status: 'ready' }));

  // Dependency Injection
  const userRepository = new UserRepository();
  const consultationRepository = new ConsultationRepository();
  const dependentRepository = new DependentRepository();
  const doctorRepository = new DoctorRepository();
  const appointmentRepository = new AppointmentRepository();
  const medicalRecordRepository = new MedicalRecordRepository();

  const authService = new AuthService(userRepository);
  const doctorService = new DoctorService(doctorRepository);
  const consultationService = new ConsultationService(consultationRepository);
  const paymentService = new PaymentService(consultationRepository);
  const dependentService = new DependentService(dependentRepository);
  const appointmentService = new AppointmentService(appointmentRepository, userRepository);
  const medicalRecordService = new MedicalRecordService(medicalRecordRepository, userRepository);

  const authController = new AuthController(authService);
  const doctorController = new DoctorController(doctorService);
  const consultationController = new ConsultationController(consultationService, userRepository, doctorRepository);
  const paymentController = new PaymentController(paymentService);
  const dependentController = new DependentController(dependentService);
  const adminController = new AdminController(doctorService, consultationService, authService);
  const doctorPanelController = new DoctorPanelController(doctorService, consultationService);
  const appointmentController = new AppointmentController(appointmentService, userRepository);
  const medicalRecordController = new MedicalRecordController(medicalRecordService, userRepository);

  // Routes
  app.use(authRoutes(authController));
  app.use(doctorRoutes(doctorController));
  app.use(consultationRoutes(consultationController));
  app.use(paymentRoutes(paymentController));
  app.use(dependentRoutes(dependentController));
  app.use(appointmentRoutes(appointmentController));
  app.use(medicalRecordRoutes(medicalRecordController));
  app.use(researchRoutes());

  // Админка и панель врача
  app.use(adminRoutes(adminController));
  app.use(doctorPanelRoutes(doctorPanelController));

  // Error handler (должен быть последним)
  app.use(errorHandler);

  // Socket.IO
  setupSocket(server, consultationRepository);

  return { app, server };
}

module.exports = { startApp };
