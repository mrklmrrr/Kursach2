const express = require('express');
const cors = require('cors');
const http = require('http');
const {
  UserModel,
  ConsultationModel,
  DependentModel,
  DoctorModel
} = require('./models');
const { setupSocket } = require('./config/socket');
const authRoutes = require('./routes/auth.routes');
const doctorRoutes = require('./routes/doctor.routes');
const consultationRoutes = require('./routes/consultation.routes');
const paymentRoutes = require('./routes/payment.routes');
const dependentRoutes = require('./routes/dependent.routes');
const AuthService = require('./services/auth.service');
const DoctorService = require('./services/doctor.service');
const ConsultationService = require('./services/consultation.service');
const PaymentService = require('./services/payment.service');
const DependentService = require('./services/dependent.service');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const userModel = new UserModel();
const consultationModel = new ConsultationModel();
const dependentModel = new DependentModel();
const doctorModel = new DoctorModel();

app.use(authRoutes(userModel));
app.use(doctorRoutes(new DoctorService(doctorModel)));
app.use(consultationRoutes(new ConsultationService(consultationModel), userModel));
app.use(paymentRoutes(new PaymentService(consultationModel), consultationModel));
app.use(dependentRoutes(new DependentService(dependentModel)));

setupSocket(server, consultationModel);

module.exports = { app, server };
