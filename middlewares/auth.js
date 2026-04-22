module.exports = (req, res, next) => {
    // Si no hay sesión o no hay objeto de usuario en ella
    if (!req.session || !req.session.user) {
        // Limpiamos cualquier rastro de sesión inválida
        return res.redirect('/login');
    }
    // Si todo está bien, permitimos el acceso
    next();
};