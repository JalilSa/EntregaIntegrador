
export const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
      return next();
    }
    res.status(403).send('Acceso denegado');
    console.log("User object:", req.user);
  console.log("Is authenticated?", req.isAuthenticated());

  };
  