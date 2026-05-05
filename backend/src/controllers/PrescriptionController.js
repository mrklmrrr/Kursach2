const mongoose = require('mongoose');
const { Prescription, User } = require('../models');
const { roles } = require('../constants');
const { logAudit } = require('../utils/auditHelper');
const ApiError = require('../utils/ApiError');

class PrescriptionController {
  normalizeBlocks(inputBlocks, inputItems) {
    const cleanItem = (item) => ({
      name: String(item?.name || '').trim(),
      dosage: String(item?.dosage || '').trim(),
      notes: String(item?.notes || '').trim()
    });

    if (Array.isArray(inputBlocks) && inputBlocks.length > 0) {
      const blocks = inputBlocks
        .map((block, index) => ({
          title: String(block?.title || `Блок ${index + 1}`).trim(),
          items: (Array.isArray(block?.items) ? block.items : [])
            .map(cleanItem)
            .filter((item) => item.name)
        }))
        .filter((block) => block.items.length > 0);
      return blocks;
    }

    const fallbackItems = Array.isArray(inputItems) ? inputItems.map(cleanItem).filter((item) => item.name) : [];
    return fallbackItems.length > 0 ? [{ title: 'Основные назначения', items: fallbackItems }] : [];
  }

  flattenItems(blocks) {
    return (blocks || []).flatMap((block) => block.items || []);
  }

  serializePrescription(doc) {
    const blocks = this.normalizeBlocks(doc.blocks, doc.items);
    const fallbackSpecialty = typeof doc.doctorId === 'object' && doc.doctorId
      ? String(doc.doctorId.specialty || '').trim()
      : '';
    return {
      ...doc,
      doctorSpecialty: String(doc.doctorSpecialty || fallbackSpecialty || '').trim(),
      blocks,
      items: this.flattenItems(blocks)
    };
  }

  async listForPatient(req, res) {
    const list = await Prescription.find({ patientId: req.userId })
      .populate('doctorId', 'specialty')
      .sort({ createdAt: -1 })
      .lean();
    res.json(list.map((doc) => this.serializePrescription(doc)));
  }

  async listForDoctorPatient(req, res) {
    const { patientId } = req.params;
    if (!patientId) throw ApiError.badRequest('Укажите пациента');
    const list = await Prescription.find({ patientId })
      .populate('doctorId', 'specialty')
      .sort({ createdAt: -1 })
      .lean();
    res.json(list.map((doc) => this.serializePrescription(doc)));
  }

  async createByDoctor(req, res) {
    const { patientId, blocks, items, consultationId, recommendations } = req.body;
    const normalizedBlocks = this.normalizeBlocks(blocks, items);
    if (!patientId || normalizedBlocks.length === 0) {
      throw ApiError.badRequest('Укажите пациента и хотя бы одно назначение');
    }

    const patient = await User.findById(patientId).lean();
    if (!patient || patient.role !== roles.PATIENT) {
      throw ApiError.badRequest('Некорректный пациент');
    }

    const doctor = await User.findById(req.userId).lean();
    if (!doctor || doctor.role !== roles.DOCTOR) {
      throw ApiError.forbidden('Доступ только для врача');
    }

    const doctorName = `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim();
    const doctorSpecialty = String(doctor.specialty || '').trim();

    const recText = recommendations != null ? String(recommendations).trim() : '';
    const flatItems = this.flattenItems(normalizedBlocks);

    const doc = await Prescription.create({
      patientId,
      doctorId: req.userId,
      doctorName,
      doctorSpecialty,
      blocks: normalizedBlocks,
      items: flatItems,
      recommendations: recText,
      consultationId: consultationId ? new mongoose.Types.ObjectId(consultationId) : null
    });

    if (recText) {
      await User.updateOne({ _id: patientId }, { $set: { healthRecommendations: recText } });
    }

    const { notifyPrescriptionTelegram } = require('../services/prescriptionNotify.service');
    await notifyPrescriptionTelegram(patient, doc.toObject());

    await logAudit({
      actorId: req.userId,
      actorRole: roles.DOCTOR,
      action: 'prescription.create',
      resource: `Prescription:${doc._id}`,
      details: `Пациент ${patientId}`
    });

    res.status(201).json(this.serializePrescription(doc.toObject()));
  }

  async updateByDoctor(req, res) {
    const { id } = req.params;
    const { blocks, items, recommendations } = req.body;
    if (!id) throw ApiError.badRequest('Укажите назначение');

    const doc = await Prescription.findById(id);
    if (!doc) throw ApiError.notFound('Назначение не найдено');
    if (String(doc.doctorId) !== String(req.userId)) {
      throw ApiError.forbidden('Редактировать может только автор назначения');
    }

    const normalizedBlocks = this.normalizeBlocks(blocks, items);
    if (normalizedBlocks.length === 0) {
      throw ApiError.badRequest('Добавьте хотя бы одно назначение');
    }

    doc.blocks = normalizedBlocks;
    doc.items = this.flattenItems(normalizedBlocks);
    doc.recommendations = recommendations != null ? String(recommendations).trim() : '';
    await doc.save();

    await logAudit({
      actorId: req.userId,
      actorRole: roles.DOCTOR,
      action: 'prescription.update',
      resource: `Prescription:${doc._id}`,
      details: `Пациент ${doc.patientId}`
    });

    res.json(this.serializePrescription(doc.toObject()));
  }
}

module.exports = PrescriptionController;
