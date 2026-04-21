class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  async register(req, res) {
    try {
      const result = await this.authService.register(req.body);
      res.json(result);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  async login(req, res) {
    try {
      const { phone, password } = req.body;
      const result = await this.authService.login(phone, password);
      res.json(result);
    } catch (err) {
      res.status(401).json({ message: err.message });
    }
  }

  async getMe(req, res) {
    try {
      const user = await this.authService.getMe(req.userId);
      res.json(user);
    } catch (err) {
      res.status(404).json({ message: err.message });
    }
  }

  async updateUser(req, res) {
    try {
      const user = await this.authService.updateUser(req.userId, req.body);
      if (!user) {
        return res.status(404).json({ message: 'Пользователь не найден' });
      }
      res.json(user);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  async updateReminderPreferences(req, res) {
    try {
      const { roles } = require('../constants');
      if (req.userRole !== roles.PATIENT) {
        return res.status(403).json({ message: 'Только для пациентов' });
      }
      const user = await this.authService.updateReminderPreferences(req.userId, req.body);
      res.json(user);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  async checkUsername(req, res) {
    try {
      const u = req.query.u || req.query.username || '';
      const result = await this.authService.checkUsernameAvailability(u);
      res.json(result);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  async setUsername(req, res) {
    try {
      const { roles } = require('../constants');
      if (req.userRole !== roles.PATIENT) {
        return res.status(403).json({ message: 'Только для пациентов' });
      }
      const { username } = req.body || {};
      if (username == null || String(username).trim() === '') {
        return res.status(400).json({ message: 'Укажите username' });
      }
      const user = await this.authService.setUsername(req.userId, username);
      res.json(user);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  async uploadAvatar(req, res) {
    try {
      const { roles } = require('../constants');
      if (req.userRole !== roles.PATIENT) {
        return res.status(403).json({ message: 'Только для пациентов' });
      }
      if (!req.file) {
        return res.status(400).json({ message: 'Файл не загружен' });
      }
      const relPath = `/uploads/avatars/${req.file.filename}`;
      await this.authService.updateUser(req.userId, { avatarUrl: relPath });
      const user = await this.authService.getMe(req.userId);
      res.json(user);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Текущий и новый пароль обязательны' });
      }

      if (String(newPassword).length < 6) {
        return res.status(400).json({ message: 'Новый пароль должен быть не короче 6 символов' });
      }

      await this.authService.changePassword(req.userId, currentPassword, newPassword);
      res.json({ message: 'Пароль успешно изменен' });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
}

module.exports = AuthController;
