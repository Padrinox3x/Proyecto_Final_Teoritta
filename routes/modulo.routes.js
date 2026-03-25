const express = require('express');
const router = express.Router();
const { sql, conectarDB } = require('../db');

/* LISTAR */
router.get('/', async (req, res) => {
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
            FROM Modulo
            WHERE strNombreModulo LIKE @buscar
            ORDER BY idModulo DESC
            OFFSET @offset ROWS
            FETCH NEXT @limit ROWS ONLY;

            SELECT COUNT(*) AS total
            FROM Modulo
            WHERE strNombreModulo LIKE @buscar;
        `);

    res.json({
        data: result.recordsets[0],
        total: result.recordsets[1][0].total
    });
});

/* CREAR */
router.post('/', async (req, res) => {
    const pool = await conectarDB();

    await pool.request()
        .input('strNombreModulo', sql.NVarChar, req.body.strNombreModulo)
        .query(`INSERT INTO Modulo (strNombreModulo) VALUES (@strNombreModulo)`);

    res.json({ ok: true });
});

/* UPDATE */
router.put('/:id', async (req, res) => {
    const pool = await conectarDB();

    await pool.request()
        .input('id', sql.Int, req.params.id)
        .input('strNombreModulo', sql.NVarChar, req.body.strNombreModulo)
        .query(`
            UPDATE Modulo
            SET strNombreModulo = @strNombreModulo
            WHERE idModulo = @id
        `);

    res.json({ ok: true });
});

/* DELETE */
router.delete('/:id', async (req, res) => {
    const pool = await conectarDB();

    await pool.request()
        .input('id', sql.Int, req.params.id)
        .query('DELETE FROM Modulo WHERE idModulo = @id');

    res.json({ ok: true });
});

module.exports = router;