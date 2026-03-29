const express = require('express');
const router = express.Router();
const { sql, conectarDB } = require('../db');

/* LISTAR */
router.get('/', async (req, res) => {
    try {
        const buscar = req.query.buscar || '';
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 10, 20);
        const offset = (page - 1) * limit;

        const pool = await conectarDB();

        const result = await pool.request()
            .input('buscar', sql.NVarChar, `%${buscar}%`)
            .input('offset', sql.Int, offset)
            .input('limit', sql.Int, limit)
            .query(`
                SELECT 
                    u.idUsuario,
                    u.strNombreUsuario,
                    u.strCorreo,
                    u.strCelular,
                    u.estadoUsuario,
                    u.Perfil,
                    p.strNombrePerfil AS NombrePerfil
                FROM Modulo_Usuario u
                INNER JOIN Modulo_Perfil p ON u.Perfil = p.idPerfil
                WHERE u.strNombreUsuario LIKE @buscar
                ORDER BY u.idUsuario DESC
                OFFSET @offset ROWS
                FETCH NEXT @limit ROWS ONLY;

                SELECT COUNT(*) AS total
                FROM Modulo_Usuario
                WHERE strNombreUsuario LIKE @buscar;
            `);

        res.json({
            data: result.recordsets[0],
            total: result.recordsets[1][0].total
        });

    } catch (error) {
        console.error('🔥 Error usuarios:', error);
        res.status(500).json({ ok: false, error: error.message });
    }
});

/* CREAR */
router.post('/', async (req, res) => {
    try {
        const { strNombreUsuario, Perfil, strPwd, estadoUsuario, strCorreo, strCelular } = req.body;

        const pool = await conectarDB();

        await pool.request()
            .input('strNombreUsuario', sql.NVarChar, strNombreUsuario)
            .input('Perfil', sql.Int, Perfil)
            .input('strPwd', sql.NVarChar, strPwd)
            .input('estadoUsuario', sql.Bit, parseInt(estadoUsuario))
            .input('strCorreo', sql.NVarChar, strCorreo)
            .input('strCelular', sql.NVarChar, strCelular)
            .query(`
                INSERT INTO Modulo_Usuario
                (strNombreUsuario, Perfil, strPwd, estadoUsuario, strCorreo, strCelular)
                VALUES
                (@strNombreUsuario, @Perfil, @strPwd, @estadoUsuario, @strCorreo, @strCelular)
            `);

        res.json({ ok: true });

    } catch (error) {
        console.error('🔥 Error crear usuario:', error);
        res.status(500).json({ ok: false, error: error.message });
    }
});

/* UPDATE */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { strNombreUsuario, Perfil, strPwd, estadoUsuario, strCorreo, strCelular } = req.body;

        const pool = await conectarDB();

        await pool.request()
            .input('id', sql.Int, id)
            .input('strNombreUsuario', sql.NVarChar, strNombreUsuario)
            .input('Perfil', sql.Int, Perfil)
            .input('strPwd', sql.NVarChar, strPwd)
            .input('estadoUsuario', sql.Bit, parseInt(estadoUsuario))
            .input('strCorreo', sql.NVarChar, strCorreo)
            .input('strCelular', sql.NVarChar, strCelular)
            .query(`
                UPDATE Modulo_Usuario SET
                    strNombreUsuario = @strNombreUsuario,
                    Perfil = @Perfil,
                    strPwd = @strPwd,
                    estadoUsuario = @estadoUsuario,
                    strCorreo = @strCorreo,
                    strCelular = @strCelular
                WHERE idUsuario = @id
            `);

        res.json({ ok: true });

    } catch (error) {
        console.error('🔥 Error update usuario:', error);
        res.status(500).json({ ok: false, error: error.message });
    }
});

/* DELETE */
router.delete('/:id', async (req, res) => {
    try {
        const pool = await conectarDB();

        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM Modulo_Usuario WHERE idUsuario = @id');

        res.json({ ok: true });

    } catch (error) {
        console.error('🔥 Error delete usuario:', error);
        res.status(500).json({ ok: false, error: error.message });
    }
});

module.exports = router;