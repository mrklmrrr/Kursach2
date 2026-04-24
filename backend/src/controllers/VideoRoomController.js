const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

const VideoRoomController = class {
  constructor(videoRoomService) {
    this.videoRoomService = videoRoomService;
  }

  async create(req, res) {
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
  }

  async join(req, res) {
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
  }

  async leave(req, res) {
    const { roomId } = req.params;
    await this.videoRoomService.leaveRoom(roomId, req.userId);
    res.json({
      success: true,
      message: 'Left video room'
    });
  }

  async end(req, res) {
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
  }

  async getInfo(req, res) {
    const { roomId } = req.params;
    const room = await this.videoRoomService.getRoomInfo(roomId);
    if (!room) {
      throw ApiError.notFound('Room not found');
    }
    res.json({
      success: true,
      data: room
    });
  }
};

module.exports = VideoRoomController;

