// middlewares/injectPermissions.js
module.exports = (req, res, next) => {
    res.locals.permisos = req.user?.permisos || [];
    next();
};