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
}

module.exports = AuthController;
