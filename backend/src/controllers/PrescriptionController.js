const mongoose = require('mongoose');
const { Prescription, User } = require('../models');
const { roles } = require('../constants');
const { logAudit } = require('../utils/auditHelper');

class PrescriptionController {
  async listForPatient(req, res) {
    const list = await Prescription.find({ patientId: req.userId })
      .sort({ createdAt: -1 })
      .lean();
    res.json(list);
  }

  async createByDoctor(req, res) {
    const { patientId, items, consultationId, recommendations } = req.body;
    if (!patientId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Укажите пациента и хотя бы одно назначение' });
    }

    const patient = await User.findById(patientId).lean();
    if (!patient || patient.role !== roles.PATIENT) {
      return res.status(400).json({ message: 'Некорректный пациент' });
    }

    const doctor = await User.findById(req.userId).lean();
    if (!doctor || doctor.role !== roles.DOCTOR) {
      return res.status(403).json({ message: 'Доступ только для врача' });
    }

    const doctorName = `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim();

    const recText = recommendations != null ? String(recommendations).trim() : '';

    const doc = await Prescription.create({
      patientId,
      doctorId: req.userId,
      doctorName,
      items: items.map((i) => ({
        name: String(i.name || '').trim(),
        dosage: String(i.dosage || ''),
        notes: String(i.notes || '')
      })).filter((i) => i.name),
      recommendations: recText,
      consultationId: consultationId ? new mongoose.Types.ObjectId(consultationId) : null
    });

    if (recText) {
      await User.updateOne({ _id: patientId }, { $set: { healthRecommendations: recText } });
    }

    const { notifyPrescriptionTelegram } = require('../services/prescriptionNotify.service');
    try {
      await notifyPrescriptionTelegram(patient, doc.toObject());
    } catch (e) {
      console.warn('[prescription] telegram notify', e.message);
    }

    await logAudit({
      actorId: req.userId,
      actorRole: roles.DOCTOR,
      action: 'prescription.create',
      resource: `Prescription:${doc._id}`,
      details: `Пациент ${patientId}`
    });

    res.status(201).json(doc);
  }
}

module.exports = PrescriptionController;
