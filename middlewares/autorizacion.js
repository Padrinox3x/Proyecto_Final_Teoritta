// middlewares/autorizacion.js
const sql = require('../db'); 

const checkPermission = (idModulo, accion) => {
    return async (req, res, next) => {
        try {
            const idPerfil = req.user.idPerfil; // O req.session.user.idPerfil

            // Consultar los permisos para este perfil y módulo
            const [permisos] = await db.query(
                `SELECT bitAgregar, bitEditar, bitConsulta, bitEliminar, bitDetalle 
                 FROM Modulo_permisosPerfil 
                 WHERE Perfil = ? AND Modulo = ?`, 
                [idPerfil, idModulo]
            );

            if (!permisos || permisos.length === 0) {
                return res.status(403).json({ msg: "No tienes permisos para este módulo" });
            }

            // Verificar si el bit de la acción solicitada está en 1
            // Acción puede ser: 'bitAgregar', 'bitEditar', etc.
            if (permisos[0][accion] === 1) {
                return next();
            } else {
                return res.status(403).json({ msg: "Acción no permitida para tu perfil" });
            }

        } catch (error) {
            console.error(error);
            res.status(500).send("Error de servidor en validación de permisos");
        }
    };
};

module.exports = checkPermission;