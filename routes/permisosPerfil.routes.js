const express = require('express');
const router = express.Router();
const { sql, conectarDB } = require('../db');

/* ============================================================
   🔥 OBTENER TODOS LOS MÓDULOS PERMITIDOS (PARA MENÚ)
============================================================ */
router.get('/mis-modulos', async (req, res) => {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ ok: false, msg: 'Sesión no iniciada' });
        }

        const idPerfil = req.session.user.Perfil;

        const pool = await conectarDB();

        const result = await pool.request()
            .input('idPerfil', sql.Int, idPerfil)
            .query(`
                SELECT 
                    m.idModulo,
                    m.strNombreModulo,
                    ISNULL(p.bitAgregar, 0) AS bitAgregar,
                    ISNULL(p.bitConsulta, 0) AS bitConsulta,
                    ISNULL(p.bitEditar, 0) AS bitEditar,
                    ISNULL(p.bitEliminar, 0) AS bitEliminar,
                    ISNULL(p.bitDetalle, 0) AS bitDetalle,
                    ISNULL(p.bitAdministrador, 0) AS bitAdministrador
                FROM Modulo m
                LEFT JOIN Modulo_permisosPerfil p 
                    ON m.idModulo = p.Modulo 
                    AND p.Perfil = @idPerfil
                ORDER BY m.idModulo
            `);

        res.json(result.recordset);

    } catch (error) {
        console.error('💥 ERROR mis-modulos:', error);
        res.status(500).json({ ok: false, error: error.message });
    }
});

/* ============================================================
   🔐 OBTENER PERMISOS DE UN MÓDULO (PARA BOTONES CRUD)
============================================================ */
router.get('/mis-permisos', async (req, res) => {
    try {
        const { modulo } = req.query;

        if (!req.session || !req.session.user) {
            return res.status(401).json({ ok: false, msg: 'Sesión no iniciada' });
        }

        const idPerfil = req.session.user.Perfil;

        const pool = await conectarDB();

        const result = await pool.request()
            .input('idPerfil', sql.Int, idPerfil)
            .input('modulo', sql.NVarChar, modulo)
            .query(`
                SELECT 
                    ISNULL(p.bitAgregar, 0) AS bitAgregar,
                    ISNULL(p.bitEditar, 0) AS bitEditar,
                    ISNULL(p.bitConsulta, 0) AS bitConsulta,
                    ISNULL(p.bitEliminar, 0) AS bitEliminar,
                    ISNULL(p.bitDetalle, 0) AS bitDetalle
                FROM Modulo m
                LEFT JOIN Modulo_permisosPerfil p 
                    ON m.idModulo = p.Modulo 
                    AND p.Perfil = @idPerfil
                WHERE m.strNombreModulo = @modulo
            `);

        if (result.recordset.length === 0) {
            return res.json({
                bitAgregar: 0,
                bitEditar: 0,
                bitConsulta: 0,
                bitEliminar: 0,
                bitDetalle: 0
            });
        }

        res.json(result.recordset[0]);

    } catch (error) {
        console.error('💥 ERROR mis-permisos:', error);
        res.status(500).json({ ok: false, error: error.message });
    }
});

/* ============================================================
   📊 MATRIZ DE PERMISOS (Pantalla Seguridad)
============================================================ */
router.get('/:idPerfil', async (req, res) => {
    try {
        const pool = await conectarDB();

        const result = await pool.request()
            .input('idPerfil', sql.Int, req.params.idPerfil)
            .query(`
                SELECT 
                    m.idModulo,
                    m.strNombreModulo,
                    ISNULL(p.idpermisosPerfil, 0) AS idpermisosPerfil,
                    ISNULL(p.bitAgregar, 0) AS bitAgregar,
                    ISNULL(p.bitEditar, 0) AS bitEditar,
                    ISNULL(p.bitConsulta, 0) AS bitConsulta,
                    ISNULL(p.bitEliminar, 0) AS bitEliminar,
                    ISNULL(p.bitDetalle, 0) AS bitDetalle
                FROM Modulo m
                LEFT JOIN Modulo_permisosPerfil p 
                    ON m.idModulo = p.Modulo 
                    AND p.Perfil = @idPerfil
                ORDER BY m.idModulo
            `);

        res.json(result.recordset);

    } catch (error) {
        console.error('💥 ERROR matriz permisos:', error);
        res.status(500).json({ error: error.message });
    }
});

/* ============================================================
   💾 GUARDAR PERMISOS (MERGE)
============================================================ */
router.post('/', async (req, res) => {
    try {
        const { permisos, Perfil } = req.body;

        if (!Perfil) {
            return res.status(400).json({ error: 'Perfil es requerido' });
        }

        const pool = await conectarDB();

        const existePerfil = await pool.request()
            .input('Perfil', sql.Int, Perfil)
            .query(`SELECT idPerfil FROM Modulo_Perfil WHERE idPerfil = @Perfil`);

        if (existePerfil.recordset.length === 0) {
            return res.status(400).json({ error: 'El perfil no existe' });
        }

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
        console.error('💥 ERROR guardar permisos:', error);
        res.status(500).json({ ok: false, error: error.message });
    }
});

module.exports = router;