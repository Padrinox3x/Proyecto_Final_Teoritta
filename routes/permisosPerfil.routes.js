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
        const { permisos, Perfil } = req.body;

        // 🔴 VALIDACIÓN
        if (!Perfil) {
            return res.status(400).json({ error: 'Perfil es requerido' });
        }

        const pool = await conectarDB();

        // 🔴 VALIDAR QUE EL PERFIL EXISTA
        const existePerfil = await pool.request()
            .input('Perfil', sql.Int, Perfil)
            .query(`
                SELECT idPerfil 
                FROM Modulo_Perfil 
                WHERE idPerfil = @Perfil
            `);

        if (existePerfil.recordset.length === 0) {
            return res.status(400).json({ error: 'El perfil no existe' });
        }

        // 🔁 GUARDAR PERMISOS
        for (const p of permisos) {

            await pool.request()
                .input('Modulo', sql.Int, p.idModulo)
                .input('Perfil', sql.Int, Perfil)
                .input('bitAgregar', sql.Bit, p.bitAgregar)
                .input('bitEditar', sql.Bit, p.bitEditar)
                .input('bitConsulta', sql.Bit, p.bitConsulta)
                .input('bitEliminar', sql.Bit, p.bitEliminar)
                .input('bitDetalle', sql.Bit, p.bitDetalle)
                .query(`
                    MERGE Modulo_permisosPerfil AS target
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
        res.status(500).json({ ok: false, error: error.message });
    }
});

module.exports = router;