// isUser.js
export const isUser = (req, res, next) => {
    if (req.user && req.user.role === 'user') {
      return next();
    }
    res.status(403).send('Acceso denegado');
  };
  