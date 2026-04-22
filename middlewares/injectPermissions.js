module.exports = (req, res, next) => {

    const user = req.session?.user;

    // 👇 AQUÍ está la clave
    res.locals.permisos = user?.permisos || [];

    next();
};