const mongoose = require('mongoose');

/**
 * Универсальное разрешение ID (ObjectId или legacyId Number)
 * Возвращает объект { _id, legacyId } для поиска
 */
function resolveId(id) {
  if (!id || id === 'undefined' || id === 'null') return null;

  const result = { byObjectId: null, byLegacyId: null };

  // Пробуем как ObjectId
  try {
    if (mongoose.Types.ObjectId.isValid(id)) {
      result.byObjectId = id;
    }
  } catch {
    // Игнорируем
  }

  // Пробуем как legacyId (число)
  const numId = parseInt(id);
  if (!isNaN(numId)) {
    result.byLegacyId = numId;
  }

  return result.byObjectId || result.byLegacyId ? result : null;
}

/**
 * Поиск документа по ObjectId или legacyId
 */
async function findById(Model, id, extraFilter = {}) {
  const resolved = resolveId(id);
  if (!resolved) return null;

  // Сначала по ObjectId
  if (resolved.byObjectId) {
    const doc = await Model.findOne({ _id: resolved.byObjectId, ...extraFilter });
    if (doc) return doc;
  }

  // Потом по legacyId
  if (resolved.byLegacyId) {
    const doc = await Model.findOne({ legacyId: resolved.byLegacyId, ...extraFilter });
    if (doc) return doc;
  }

  return null;
}

/**
 * Обновление по ObjectId или legacyId
 */
async function updateById(Model, id, updates, extraFilter = {}) {
  const resolved = resolveId(id);
  if (!resolved) return null;

  if (resolved.byObjectId) {
    const doc = await Model.findOneAndUpdate(
      { _id: resolved.byObjectId, ...extraFilter },
      updates,
      { new: true, runValidators: true }
    );
    if (doc) return doc;
  }

  if (resolved.byLegacyId) {
    const doc = await Model.findOneAndUpdate(
      { legacyId: resolved.byLegacyId, ...extraFilter },
      updates,
      { new: true, runValidators: true }
    );
    if (doc) return doc;
  }

  return null;
}

/**
 * Удаление по ObjectId или legacyId
 */
async function deleteById(Model, id, extraFilter = {}) {
  const resolved = resolveId(id);
  if (!resolved) return null;

  if (resolved.byObjectId) {
    const doc = await Model.findOneAndDelete({ _id: resolved.byObjectId, ...extraFilter });
    if (doc) return doc;
  }

  if (resolved.byLegacyId) {
    const doc = await Model.findOneAndDelete({ legacyId: resolved.byLegacyId, ...extraFilter });
    if (doc) return doc;
  }

  return null;
}

module.exports = {
  resolveId,
  findById,
  updateById,
  deleteById
};
