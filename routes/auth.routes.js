const express = require('express');
const router = express.Router();
const { sql, conectarDB } = require('../db');

router.post('/login', async (req, res) => {
    try {
        const { usuario, password } = req.body;

        const pool = await conectarDB();

        // 🔐 1. VALIDAR USUARIO
        const result = await pool.request()
            .input('usuario', sql.NVarChar, usuario)
            .input('password', sql.NVarChar, password)
            .query(`
                SELECT 
                    u.idUsuario,
                    u.strNombreUsuario,
                    u.strCorreo,   
                    u.strCelular,  
                    u.FotoUrl,     
                    u.Perfil,
                    p.strNombrePerfil,
                    p.bitAdministrador
                FROM dbo.Modulo_Usuario u
                INNER JOIN dbo.Modulo_Perfil p ON u.Perfil = p.idPerfil
                WHERE u.strNombreUsuario = @usuario
                AND u.strPwd = @password
                AND u.estadoUsuario = 1
            `);

        if (result.recordset.length === 0) {
            return res.json({ ok: false, msg: 'Credenciales incorrectas' });
        }

        const user = result.recordset[0];

        // 🔥 2. OBTENER PERMISOS DEL PERFIL
        const permisosResult = await pool.request()
            .input('perfil', sql.Int, user.Perfil)
            .query(`
                SELECT 
                    m.strNombreModulo,
                    ISNULL(pp.bitAgregar,0) AS bitAgregar,
                    ISNULL(pp.bitEditar,0) AS bitEditar,
                    ISNULL(pp.bitEliminar,0) AS bitEliminar,
                    ISNULL(pp.bitConsulta,0) AS bitConsulta,
                    ISNULL(pp.bitDetalle,0) AS bitDetalle,
                    p.bitAdministrador
                FROM dbo.Modulo m
                LEFT JOIN dbo.Modulo_permisosPerfil pp 
                    ON m.idModulo = pp.Modulo 
                    AND pp.Perfil = @perfil
                INNER JOIN dbo.Modulo_Perfil p 
                    ON p.idPerfil = @perfil
            `);

        const permisos = permisosResult.recordset;

        // 🔥 3. GUARDAR TODO EN SESIÓN
        req.session.user = {
            ...user,
            permisos: permisos   // 👈 🔥 AQUÍ ESTÁ LA CLAVE
        };

        req.session.save(() => {
            res.json({ ok: true });
        });

    } catch (error) {
        console.error('💥 ERROR LOGIN:', error);
        res.status(500).json({ ok: false, msg: error.message });
    }
});

module.exports = router;