const checkPermission = (modulo, accion) => {
    return (req, res, next) => {
        
        const permisos = req.user.permisos; 
        const permisoModulo = permisos.find(p => p.strNombreModulo === modulo);

        if (permisoModulo && permisoModulo[accion] === 1) {
            return next(); // Tiene permiso
        }
        
        return res.status(403).json({ ok: false, msg: 'No tienes permiso para esta acción.' });
    };
};

// Uso en tus rutas:
router.post('/usuarios', checkPermission('Usuario', 'bitAgregar'), usuarioController.crear);
router.delete('/usuarios/:id', checkPermission('Usuario', 'bitEliminar'), usuarioController.eliminar);