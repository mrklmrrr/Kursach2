const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  appointmentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Appointment', 
    required: true 
  },
  patientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  amount: { type: Number, required: true, min: 0 }, // сумма в рублях
  status: { 
    type: String, 
    default: 'pending', 
    enum: ['pending', 'completed', 'failed'] 
  },
  paymentMethod: { 
    type: String, 
    enum: ['card', 'online_banking', 'wallet'] 
  },
  transactionId: { type: String, unique: true, default: null }, // ID транзакции от платежной системы
  paymentDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);