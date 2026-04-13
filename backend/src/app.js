const express = require('express');
const cors = require('cors');
const http = require('http');
const config = require('./config');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Repositories
const {
  UserRepository,
  ConsultationRepository,
  DependentRepository,
  DoctorRepository
} = require('./repositories');

// Services
const {
  AuthService,
  DoctorService,
  ConsultationService,
  PaymentService,
  DependentService
} = require('./services');

// Controllers
const {
  AuthController,
  DoctorController,
  ConsultationController,
  PaymentController,
  DependentController,
  AdminController,
  DoctorPanelController
} = require('./controllers');

// Routes
const {
  authRoutes,
  doctorRoutes,
  consultationRoutes,
  paymentRoutes,
  dependentRoutes,
  adminRoutes,
  doctorPanelRoutes
} = require('./routes');

// Socket
const { setupSocket } = require('./config/socket');

async function startApp() {
  // Подключение к MongoDB
  await connectDB();

  const app = express();
  const server = http.createServer(app);

  // Middleware
  app.use(cors({
    origin: config.frontendUrl,
    credentials: true
  }));
  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  // Dependency Injection
  const userRepository = new UserRepository();
  const consultationRepository = new ConsultationRepository();
  const dependentRepository = new DependentRepository();
  const doctorRepository = new DoctorRepository();

  const authService = new AuthService(userRepository);
  const doctorService = new DoctorService(doctorRepository);
  const consultationService = new ConsultationService(consultationRepository);
  const paymentService = new PaymentService(consultationRepository);
  const dependentService = new DependentService(dependentRepository);

  const authController = new AuthController(authService);
  const doctorController = new DoctorController(doctorService);
  const consultationController = new ConsultationController(consultationService, userRepository);
  const paymentController = new PaymentController(paymentService);
  const dependentController = new DependentController(dependentService);
  const adminController = new AdminController(doctorService, consultationService, authService);
  const doctorPanelController = new DoctorPanelController(doctorService, consultationService);

  // Routes
  app.use(authRoutes(authController));
  app.use(doctorRoutes(doctorController));
  app.use(consultationRoutes(consultationController));
  app.use(paymentRoutes(paymentController));
  app.use(dependentRoutes(dependentController));

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
