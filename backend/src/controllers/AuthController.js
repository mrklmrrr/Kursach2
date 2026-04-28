const ApiError = require('../utils/ApiError');

class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  async register(req, res, next) {
    const result = await this.authService.register(req.body);
    res.json(result);
  }

  async login(req, res) {
    const { phone, password } = req.body;
    const result = await this.authService.login(phone, password);
    res.json(result);
  }

  async getMe(req, res) {
    const user = await this.authService.getMe(req.userId);
    res.json(user);
  }

  async updateUser(req, res) {
    const user = await this.authService.updateUser(req.userId, req.body);
    if (!user) {
      throw ApiError.notFound('Пользователь не найден');
    }
    res.json(user);
  }

  async updateReminderPreferences(req, res) {
    const { roles } = require('../constants');
    if (req.userRole !== roles.PATIENT) {
      throw ApiError.forbidden('Только для пациентов');
    }
    const user = await this.authService.updateReminderPreferences(req.userId, req.body);
    res.json(user);
  }

  async checkUsername(req, res) {
    const u = req.query.u || req.query.username || '';
    const result = await this.authService.checkUsernameAvailability(u);
    res.json(result);
  }

  async setUsername(req, res) {
    const { roles } = require('../constants');
    if (req.userRole !== roles.PATIENT) {
      throw ApiError.forbidden('Только для пациентов');
    }
    const { username } = req.body || {};
    if (username == null || String(username).trim() === '') {
      throw ApiError.badRequest('Укажите username');
    }
    const user = await this.authService.setUsername(req.userId, username);
    res.json(user);
  }

  async uploadAvatar(req, res) {
    const { roles } = require('../constants');
    if (req.userRole !== roles.PATIENT && req.userRole !== roles.DOCTOR) {
      throw ApiError.forbidden('Только для пациентов и врачей');
    }
    if (!req.file) {
      throw ApiError.badRequest('Файл не загружен');
    }
    const relPath = `/uploads/avatars/${req.file.filename}`;
    await this.authService.updateUser(req.userId, { avatarUrl: relPath });
    const user = await this.authService.getMe(req.userId);
    res.json(user);
  }

  async changePassword(req, res) {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw ApiError.badRequest('Текущий и новый пароль обязательны');
    }

    if (String(newPassword).length < 6) {
      throw ApiError.badRequest('Новый пароль должен быть не короче 6 символов');
    }

    await this.authService.changePassword(req.userId, currentPassword, newPassword);
    res.json({ message: 'Пароль успешно изменен' });
  }
}

module.exports = AuthController;
