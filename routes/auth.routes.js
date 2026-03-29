const express = require('express');
const router = express.Router();
const { sql, conectarDB } = require('../db');

router.post('/login', async (req, res) => {
    try {
        const { usuario, password } = req.body;

        console.log('LOGIN INTENTO:', usuario, password);

        const pool = await conectarDB();

        const result = await pool.request()
            .input('usuario', sql.NVarChar, usuario)
            .input('password', sql.NVarChar, password)
            .query(`
                 SELECT 
                 u.idUsuario,
                 u.strNombreUsuario,
                 u.Perfil,
                 p.strNombrePerfil,
                 p.bitAdministrador
                FROM dbo.Modulo_Usuario u
                INNER JOIN dbo.Modulo_Perfil p ON u.Perfil = p.idPerfil
                WHERE u.strNombreUsuario = @usuario
                AND u.strPwd = @password
                AND u.estadoUsuario = 1
`);

        console.log('RESULTADO SQL:', result.recordset);

        if (result.recordset.length === 0) {
            return res.json({ ok: false, msg: 'Credenciales incorrectas' });
        }

        const user = result.recordset[0];

        req.session.user = user;

        console.log('✅ LOGIN OK');

        res.json({ ok: true });

    } catch (error) {
    console.error('💥 ERROR LOGIN DETALLADO:', error);

    res.status(500).json({ 
        ok: false, 
        msg: error.message // 🔥 AQUÍ VERÁS EL ERROR REAL
    });
}
});

module.exports = router;