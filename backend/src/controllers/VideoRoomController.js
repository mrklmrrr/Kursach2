const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

const VideoRoomController = class {
  constructor(videoRoomService) {
    this.videoRoomService = videoRoomService;
  }

  async create(req, res) {
    try {
      const { consultationId } = req.body;
      const userRole = req.userRole || (req.user?.role ? req.user.role : 'unknown');
      const room = await this.videoRoomService.createRoom(consultationId, req.userId, userRole);
      res.status(201).json({
        success: true,
        data: {
          roomId: room.roomId,
          status: room.status,
          message: 'Video room created successfully'
        }
      });
    } catch (err) {
      logger.error(`Create video room failed: ${err.message}`);
      throw err;
    }
  }

  async join(req, res) {
    try {
      const { roomId } = req.params;
      const { role } = req.userRole; // From middleware
      const room = await this.videoRoomService.joinRoom(roomId, req.userId, role);
      res.json({
        success: true,
        data: {
          roomId: room.roomId,
          status: room.status,
          participants: room.participants,
          message: 'Joined video room'
        }
      });
    } catch (err) {
      logger.error(`Join video room failed: ${err.message}`);
      throw err;
    }
  }

  async leave(req, res) {
    try {
      const { roomId } = req.params;
      await this.videoRoomService.leaveRoom(roomId, req.userId);
      res.json({
        success: true,
        message: 'Left video room'
      });
    } catch (err) {
      logger.error(`Leave video room failed: ${err.message}`);
      throw err;
    }
  }

  async end(req, res) {
    try {
      const { roomId } = req.params;
      const room = await this.videoRoomService.endRoom(roomId, req.userId);
      res.json({
        success: true,
        data: {
          roomId: room.roomId,
          duration: room.duration,
          message: 'Video room ended'
        }
      });
    } catch (err) {
      logger.error(`End video room failed: ${err.message}`);
      throw err;
    }
  }

  async getInfo(req, res) {
    try {
      const { roomId } = req.params;
      const room = await this.videoRoomService.getRoomInfo(roomId);
      if (!room) {
        return res.status(404).json({ success: false, message: 'Room not found' });
      }
      res.json({
        success: true,
        data: room
      });
    } catch (err) {
      logger.error(`Get room info failed: ${err.message}`);
      throw err;
    }
  }
};

module.exports = VideoRoomController;

