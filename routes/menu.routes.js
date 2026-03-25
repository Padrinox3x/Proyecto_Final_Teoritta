const express = require('express');
const router = express.Router();
const { sql, conectarDB } = require('../db');

/* =======================
   LISTAR (CON JOIN)
======================= */
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
                    m.idMenu,
                    m.strNombreMenu,
                    m.Modulo,
                    mo.strNombreModulo AS NombreModulo
                FROM Menu m
                INNER JOIN Modulo mo ON m.Modulo = mo.idModulo
                WHERE m.strNombreMenu LIKE @buscar
                ORDER BY m.idMenu DESC
                OFFSET @offset ROWS
                FETCH NEXT @limit ROWS ONLY;

                SELECT COUNT(*) AS total
                FROM Menu
                WHERE strNombreMenu LIKE @buscar;
            `);

        res.json({
            data: result.recordsets[0],
            total: result.recordsets[1][0].total
        });

    } catch (error) {
        console.error('🔥 Error al listar menú:', error);
        res.status(500).json({ ok: false, error: error.message });
    }
});

/* =======================
   CREAR
======================= */
router.post('/', async (req, res) => {
    try {
        const { strNombreMenu, Modulo } = req.body;

        if (!strNombreMenu || !Modulo) {
            return res.json({ ok: false, error: 'Datos incompletos' });
        }

        const pool = await conectarDB();

        await pool.request()
            .input('strNombreMenu', sql.NVarChar, strNombreMenu)
            .input('Modulo', sql.Int, Modulo)
            .query(`
                INSERT INTO Menu (strNombreMenu, Modulo)
                VALUES (@strNombreMenu, @Modulo)
            `);

        res.json({ ok: true });

    } catch (error) {
        console.error('🔥 Error al crear menú:', error);
        res.status(500).json({ ok: false, error: error.message });
    }
});

/* =======================
   UPDATE
======================= */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { strNombreMenu, Modulo } = req.body;

        if (!strNombreMenu || !Modulo) {
            return res.json({ ok: false, error: 'Datos incompletos' });
        }

        const pool = await conectarDB();

        await pool.request()
            .input('id', sql.Int, id)
            .input('strNombreMenu', sql.NVarChar, strNombreMenu)
            .input('Modulo', sql.Int, Modulo)
            .query(`
                UPDATE Menu SET
                    strNombreMenu = @strNombreMenu,
                    Modulo = @Modulo
                WHERE idMenu = @id
            `);

        res.json({ ok: true });

    } catch (error) {
        console.error('🔥 Error al actualizar menú:', error);
        res.status(500).json({ ok: false, error: error.message });
    }
});

/* =======================
   DELETE
======================= */
router.delete('/:id', async (req, res) => {
    try {
        const pool = await conectarDB();

        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM Menu WHERE idMenu = @id');

        res.json({ ok: true });

    } catch (error) {
        console.error('🔥 Error al eliminar menú:', error);
        res.status(500).json({ ok: false, error: error.message });
    }
});

module.exports = router;