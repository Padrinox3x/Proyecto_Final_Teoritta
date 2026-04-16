// middleware/permisos.js
const sql = require('../db'); // tu conexión

const verificarPermiso = (modulo, accion) => {
    return async (req, res, next) => {
        try {
            const usuario = req.session.usuario; // o JWT

            if (!usuario) {
                return res.redirect('/login');
            }

            const perfilId = usuario.perfil;

            const result = await sql.query(`
                SELECT 
                    bitAgregar,
                    bitEditar,
                    bitConsultar,
                    bitEliminar,
                    bitDetalle
                FROM Modulo_permisosPerfil
                WHERE Perfil = @perfil AND Modulo = @modulo
            `, {
                perfil: perfilId,
                modulo: modulo
            });

            if (result.recordset.length === 0) {
                return res.status(403).send('Sin acceso');
            }

            const permisos = result.recordset[0];

            const mapa = {
                agregar: permisos.bitAgregar,
                editar: permisos.bitEditar,
                consultar: permisos.bitConsultar,
                eliminar: permisos.bitEliminar,
                detalle: permisos.bitDetalle
            };

            if (!mapa[accion]) {
                return res.status(403).send('No tienes permiso');
            }

            next();

        } catch (error) {
            console.error(error);
            res.status(500).send('Error servidor');
        }
    };
};

module.exports = verificarPermiso;