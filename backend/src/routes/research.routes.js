const express = require('express');
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
      const types = await ResearchType.find().sort({ name: 1 });
      res.json(types);
    })
  );

  router.post(
    '/api/research-types',
    authMiddleware,
    isDoctor,
    asyncHandler(async (req, res) => {
      const type = new ResearchType(req.body);
      await type.save();
      res.status(201).json(type);
    })
  );

  return router;
};