const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const { sql, conectarDB } = require('../db');

const SECRET_KEY = '6Lc9wUQsAAAAAFTuSFxoK12ZbCVwoJBP_nBtXZI-'; // ⚠️ cambia esto

router.post('/login', async (req, res) => {
    try {
        const { usuario, password, captcha } = req.body;

        /* =======================
           VALIDAR CAPTCHA
        ======================= */
        const verifyUrl = `https://www.google.com/recaptcha/api/siteverify`;

        const captchaRes = await fetch(verifyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `secret=${SECRET_KEY}&response=${captcha}`
        });

        const captchaData = await captchaRes.json();

       if (!captchaData.success) {
       return res.json({ ok: false, msg: 'Captcha inválido' });
       }

        /* =======================
           LOGIN DB
        ======================= */
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
                FROM Usuario u
                INNER JOIN ModuloPerfil p ON u.Perfil = p.idPerfil
                WHERE u.strNombreUsuario = @usuario
                  AND u.strPwd = @password
                  AND u.estadoUsuario = 1
            `);

        if (result.recordset.length === 0) {
            return res.json({ ok: false, msg: 'Credenciales incorrectas' });
        }

        const user = result.recordset[0];

        req.session.user = user;

        res.json({ ok: true });

    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false });
    }
});

module.exports = router;