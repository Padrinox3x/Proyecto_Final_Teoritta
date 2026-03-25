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
                    u.*,
                    p.strNombrePerfil AS NombrePerfil
                FROM Usuario u
                INNER JOIN ModuloPerfil p ON u.Perfil = p.idPerfil
                WHERE u.strNombreUsuario LIKE @buscar
                ORDER BY u.idUsuario DESC
                OFFSET @offset ROWS
                FETCH NEXT @limit ROWS ONLY;
                SELECT COUNT(*) AS total
                FROM Usuario
                WHERE strNombreUsuario LIKE @buscar;`);
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
    const { strNombreUsuario, Perfil, strPwd, estadoUsuario, strCorreo, strCelular } = req.body;

    const pool = await conectarDB();

    await pool.request()
        .input('strNombreUsuario', sql.NVarChar, strNombreUsuario)
        .input('Perfil', sql.Int, Perfil)
        .input('strPwd', sql.NVarChar, strPwd)
        .input('estadoUsuario', sql.Bit, estadoUsuario)
        .input('strCorreo', sql.NVarChar, strCorreo)
        .input('strCelular', sql.NVarChar, strCelular)
        .query(`
            INSERT INTO Usuario
            (strNombreUsuario, Perfil, strPwd, estadoUsuario, strCorreo, strCelular)
            VALUES
            (@strNombreUsuario, @Perfil, @strPwd, @estadoUsuario, @strCorreo, @strCelular)
        `);

    res.json({ ok: true });
});

/* UPDATE */
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { strNombreUsuario, Perfil, strPwd, estadoUsuario, strCorreo, strCelular } = req.body;

    const pool = await conectarDB();

    await pool.request()
        .input('id', sql.Int, id)
        .input('strNombreUsuario', sql.NVarChar, strNombreUsuario)
        .input('Perfil', sql.Int, Perfil)
        .input('strPwd', sql.NVarChar, strPwd)
        .input('estadoUsuario', sql.Bit, estadoUsuario)
        .input('strCorreo', sql.NVarChar, strCorreo)
        .input('strCelular', sql.NVarChar, strCelular)
        .query(`
            UPDATE Usuario SET
                strNombreUsuario = @strNombreUsuario,
                Perfil = @Perfil,
                strPwd = @strPwd,
                estadoUsuario = @estadoUsuario,
                strCorreo = @strCorreo,
                strCelular = @strCelular
            WHERE idUsuario = @id
        `);

    res.json({ ok: true });
});

/* DELETE */
router.delete('/:id', async (req, res) => {
    const pool = await conectarDB();

    await pool.request()
        .input('id', sql.Int, req.params.id)
        .query('DELETE FROM Usuario WHERE idUsuario = @id');

    res.json({ ok: true });
});

module.exports = router;