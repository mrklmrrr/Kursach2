const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const { isDoctor } = require('../middleware/roleAuth');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const { consultationSchemas } = require('../validation/schemas');

const router = express.Router();

module.exports = function(videoRoomController) {
  // Все маршруты защищены: auth + isDoctor (врач создает/управляет комнатами)
  // Пациенты присоединяются через socket + API getInfo

  // Создать видео комнату для консультации (врач и пациент могут создать)
  router.post('/',
    authMiddleware,
    validate(consultationSchemas.createVideoRoom),
    asyncHandler((...args) => videoRoomController.create(...args))
  );

  // Получить информацию о комнате
  router.get('/:roomId',
    authMiddleware,
    asyncHandler((...args) => videoRoomController.getInfo(...args))
  );

  // Присоединиться к комнате (для API подтверждения, основная логика в socket)
  router.post('/:roomId/join',
    authMiddleware,
    asyncHandler((...args) => videoRoomController.join(...args))
  );

  // Покинуть комнату
  router.post('/:roomId/leave',
    authMiddleware,
    asyncHandler((...args) => videoRoomController.leave(...args))
  );

  // Завершить комнату (только врач)
  router.post('/:roomId/end',
    authMiddleware,
    isDoctor,
    asyncHandler((...args) => videoRoomController.end(...args))
  );

  return router;
};

