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
                SELECT *
                FROM ModuloPerfil
                WHERE strNombrePerfil LIKE @buscar
                ORDER BY idPerfil DESC
                OFFSET @offset ROWS
                FETCH NEXT @limit ROWS ONLY;

                SELECT COUNT(*) AS total
                FROM Modulo_Perfil
                WHERE strNombrePerfil LIKE @buscar;
            `);

        res.json({
            data: result.recordsets[0],
            total: result.recordsets[1][0].total
        });

    } catch (error) {
        console.error('🔥 Error al listar perfil:', error);
        res.status(500).json({ ok: false, error: error.message });
    }
});

/* CREAR */
router.post('/', async (req, res) => {
    try {
        const { strNombrePerfil, bitAdministrador } = req.body;

        const pool = await conectarDB();

        await pool.request()
            .input('strNombrePerfil', sql.NVarChar, strNombrePerfil)
            .input('bitAdministrador', sql.Bit, bitAdministrador)
            .query(`
                INSERT INTO ModuloPerfil (strNombrePerfil, bitAdministrador)
                VALUES (@strNombrePerfil, @bitAdministrador)
            `);

        res.json({ ok: true });

    } catch (error) {
        console.error('🔥 Error al crear perfil:', error);
        res.status(500).json({ ok: false, error: error.message });
    }
});

/* UPDATE */
router.put('/:id', async (req, res) => {
    try {
        const pool = await conectarDB();

        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('strNombrePerfil', sql.NVarChar, req.body.strNombrePerfil)
            .input('bitAdministrador', sql.Bit, req.body.bitAdministrador)
            .query(`
                UPDATE ModuloPerfil SET
                    strNombrePerfil = @strNombrePerfil,
                    bitAdministrador = @bitAdministrador
                WHERE idPerfil = @id
            `);

        res.json({ ok: true });

    } catch (error) {
        console.error('🔥 Error al actualizar perfil:', error);
        res.status(500).json({ ok: false, error: error.message });
    }
});

/* DELETE */
router.delete('/:id', async (req, res) => {
    try {
        const pool = await conectarDB();

        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM ModuloPerfil WHERE idPerfil = @id');

        res.json({ ok: true });

    } catch (error) {
        console.error('🔥 Error al eliminar perfil:', error);
        res.status(500).json({ ok: false, error: error.message });
    }
});

module.exports = router;