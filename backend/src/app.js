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
  RelativeInviteRepository,
  DoctorRepository,
  AppointmentRepository,
  MedicalRecordRepository,
  EmergencyRequestRepository
} = require('./repositories');

// Services
const {
  AuthService,
  DoctorService,
  ConsultationService,
  PaymentService,
  DependentService,
  AppointmentService,
  MedicalRecordService,
  VideoRoomService,
  EmergencyRequestService
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
  MedicalRecordController,
  PlatformController,
  PrescriptionController,
  VideoRoomController,
  EmergencyRequestController,
  MediaController
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
  researchRoutes,
  platformRoutes,
  prescriptionRoutes,
  videoRoomRoutes,
  emergencyRequestRoutes,
  mediaRoutes
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
    max: 2000,
    standardHeaders: true,
    legacyHeaders: false
  }));
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));
  app.use('/api/auth/login', rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false
  }));
  app.use('/api/admin/login', rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false
  }));
  app.use('/api/medical-record/me/lab-insights', rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 15,
    standardHeaders: true,
    legacyHeaders: false
  }));
  // Middleware to set Cross-Origin Resource Policy for uploads
  app.use(['/uploads', '/api/uploads', '/api/media'], (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  });
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  app.use('/api/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Health check
  app.get('/', (req, res) => {
    const frontendUrl = config.frontendOrigins[0] || 'http://localhost:5173';
    return res.redirect(frontendUrl);
  });
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.get('/api/readiness', (req, res) => res.json({ status: 'ready' }));

  // Dependency Injection
  const userRepository = new UserRepository();
  const consultationRepository = new ConsultationRepository();
  const dependentRepository = new DependentRepository();
  const relativeInviteRepository = new RelativeInviteRepository();
  const doctorRepository = new DoctorRepository();
  const appointmentRepository = new AppointmentRepository();
  const medicalRecordRepository = new MedicalRecordRepository();
  const emergencyRequestRepository = new EmergencyRequestRepository();

  const authService = new AuthService(userRepository);
  const doctorService = new DoctorService(doctorRepository, consultationRepository);
  const consultationService = new ConsultationService(consultationRepository);
  const paymentService = new PaymentService(consultationRepository);
  const dependentService = new DependentService(dependentRepository, userRepository, relativeInviteRepository);
  const appointmentService = new AppointmentService(
    appointmentRepository,
    userRepository,
    consultationRepository
  );
  const medicalRecordService = new MedicalRecordService(medicalRecordRepository, userRepository);
  const videoRoomService = new VideoRoomService(consultationRepository);
  const emergencyRequestService = new EmergencyRequestService(
    emergencyRequestRepository,
    userRepository,
    consultationRepository
  );

  const authController = new AuthController(authService);
  const doctorController = new DoctorController(doctorService);
  const consultationController = new ConsultationController(consultationService, userRepository, doctorRepository);
  const paymentController = new PaymentController(paymentService);
  const dependentController = new DependentController(dependentService);
  const adminController = new AdminController(doctorService, consultationService, authService);
  const emergencyRequestController = new EmergencyRequestController(emergencyRequestService);
  const doctorPanelController = new DoctorPanelController(
    doctorService,
    consultationService,
    dependentService,
    emergencyRequestService
  );
  const appointmentController = new AppointmentController(appointmentService, userRepository);
  const medicalRecordController = new MedicalRecordController(medicalRecordService, userRepository);
  const platformController = new PlatformController();
  const prescriptionController = new PrescriptionController();
  const videoRoomController = new VideoRoomController(videoRoomService);
  const mediaController = new MediaController(userRepository, consultationRepository);

  // Routes
  app.use(platformRoutes(platformController));
  app.use(prescriptionRoutes(prescriptionController));
  app.use(authRoutes(authController));
  app.use(mediaRoutes(mediaController));
  app.use(doctorRoutes(doctorController));
  app.use(consultationRoutes(consultationController));
  app.use(emergencyRequestRoutes(emergencyRequestController));
  app.use(paymentRoutes(paymentController));
  app.use(dependentRoutes(dependentController));
  app.use(appointmentRoutes(appointmentController));
  app.use(medicalRecordRoutes(medicalRecordController));
  app.use(researchRoutes());
  app.use('/api/video-rooms', videoRoomRoutes(videoRoomController));

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
