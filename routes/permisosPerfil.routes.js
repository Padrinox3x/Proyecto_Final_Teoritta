const express = require('express');
const router = express.Router();
const { sql, conectarDB } = require('../db');

/* =======================
   OBTENER PERMISOS POR PERFIL
======================= */
router.get('/:idPerfil', async (req, res) => {
    try {
        const pool = await conectarDB();

        const result = await pool.request()
            .input('idPerfil', sql.Int, req.params.idPerfil)
            .query(`
                SELECT 
                    m.idModulo,
                    m.strNombreModulo,
                    ISNULL(p.idpermisosPerfil, 0) idpermisosPerfil,
                    ISNULL(p.bitAgregar, 0) bitAgregar,
                    ISNULL(p.bitEditar, 0) bitEditar,
                    ISNULL(p.bitConsulta, 0) bitConsulta,
                    ISNULL(p.bitEliminar, 0) bitEliminar,
                    ISNULL(p.bitDetalle, 0) bitDetalle
                FROM Modulo m
                LEFT JOIN Modulo_permisosPerfil p 
                    ON m.idModulo = p.Modulo 
                    AND p.Perfil = @idPerfil
                ORDER BY m.idModulo
            `);

        res.json(result.recordset);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

/* =======================
   GUARDAR PERMISOS
======================= */
router.post('/', async (req, res) => {
    try {
        const { permisos } = req.body;

        const pool = await conectarDB();

        for (const p of permisos) {

            await pool.request()
                .input('Modulo', sql.Int, p.idModulo)
                .input('Perfil', sql.Int, req.body.permisos[0].Perfil || 0)
                .input('bitAgregar', sql.Bit, p.bitAgregar)
                .input('bitEditar', sql.Bit, p.bitEditar)
                .input('bitConsulta', sql.Bit, p.bitConsulta)
                .input('bitEliminar', sql.Bit, p.bitEliminar)
                .input('bitDetalle', sql.Bit, p.bitDetalle)
                .query(`
                    MERGE permisosPerfil AS target
                    USING (SELECT @Modulo AS Modulo, @Perfil AS Perfil) AS source
                    ON target.Modulo = source.Modulo AND target.Perfil = source.Perfil

                    WHEN MATCHED THEN
                        UPDATE SET
                            bitAgregar = @bitAgregar,
                            bitEditar = @bitEditar,
                            bitConsulta = @bitConsulta,
                            bitEliminar = @bitEliminar,
                            bitDetalle = @bitDetalle

                    WHEN NOT MATCHED THEN
                        INSERT (Modulo, Perfil, bitAgregar, bitEditar, bitConsulta, bitEliminar, bitDetalle)
                        VALUES (@Modulo, @Perfil, @bitAgregar, @bitEditar, @bitConsulta, @bitEliminar, @bitDetalle);
                `);
        }

        res.json({ ok: true });

    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false });
    }
});

module.exports = router;