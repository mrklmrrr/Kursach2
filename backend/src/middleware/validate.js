const ApiError = require('../utils/ApiError');
const { z } = require('zod');

module.exports = function validate(schema) {
  const runtimeSchema = typeof schema.safeParse === 'function'
    ? schema
    : z.object(schema);

  return (req, res, next) => {
    const result = runtimeSchema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query
    });

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message
      }));
      return next(ApiError.badRequest('Ошибка валидации запроса', details));
    }

    req.body = result.data.body;
    req.params = result.data.params;
    req.query = result.data.query;
    return next();
  };
};
