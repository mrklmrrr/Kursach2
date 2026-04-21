const express = require('express');
const mongoose = require('mongoose');
const asyncHandler = require('../middleware/asyncHandler');
const authMiddleware = require('../middleware/auth');
const { isDoctor } = require('../middleware/roleAuth');
const { ResearchType } = require('../models/Research');

const router = express.Router();

module.exports = function researchRoutes() {
  router.get(
    '/api/research-types',
    authMiddleware,
    isDoctor,
    asyncHandler(async (req, res) => {
      const types = await ResearchType.find({
        $or: [
          { createdBy: req.userId },
          { createdBy: null },
          { createdBy: { $exists: false } }
        ]
      }).sort({ name: 1 });
      res.json(types);
    })
  );

  router.post(
    '/api/research-types',
    authMiddleware,
    isDoctor,
    asyncHandler(async (req, res) => {
      const body = { ...req.body, createdBy: req.userId };
      const type = new ResearchType(body);
      await type.save();
      res.status(201).json(type);
    })
  );

  router.put(
    '/api/research-types/:id',
    authMiddleware,
    isDoctor,
    asyncHandler(async (req, res) => {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: 'Некорректный id' });
      }
      const doc = await ResearchType.findById(req.params.id);
      if (!doc) {
        return res.status(404).json({ message: 'Шаблон не найден' });
      }
      if (doc.createdBy == null) {
        return res.status(403).json({ message: 'Системные шаблоны нельзя изменять. Создайте копию как новый шаблон.' });
      }
      if (String(doc.createdBy) !== String(req.userId)) {
        return res.status(403).json({ message: 'Можно редактировать только свои шаблоны' });
      }
      const { name, category, templateMode, template, gridTemplate } = req.body;
      if (name != null) doc.name = String(name).trim();
      if (category != null) doc.category = category;
      if (templateMode != null) doc.templateMode = templateMode;
      if (template != null) doc.template = template;
      if (gridTemplate != null) doc.gridTemplate = gridTemplate;
      await doc.save();
      res.json(doc);
    })
  );

  router.delete(
    '/api/research-types/:id',
    authMiddleware,
    isDoctor,
    asyncHandler(async (req, res) => {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: 'Некорректный id' });
      }
      const doc = await ResearchType.findById(req.params.id);
      if (!doc) {
        return res.status(404).json({ message: 'Шаблон не найден' });
      }
      if (!doc.createdBy || String(doc.createdBy) !== String(req.userId)) {
        return res.status(403).json({ message: 'Удалять можно только созданные вами шаблоны' });
      }
      await ResearchType.deleteOne({ _id: doc._id });
      res.json({ ok: true });
    })
  );

  return router;
};
