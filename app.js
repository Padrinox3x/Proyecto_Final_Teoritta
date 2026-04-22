const express = require('express');
const session = require('express-session');
require('dotenv').config();
const cloudinary = require('./config/cloudinary'); 
const multer = require('multer');

const { sql, conectarDB } = require('./db');

// 🔐 Middleware de autenticación
const isAuthenticated = require('./middlewares/auth');

// 🔥 Rutas
const menuRoutes = require('./routes/menu.routes');
const moduloRoutes = require('./routes/modulo.routes');
const perfilRoutes = require('./routes/perfil.routes');
const usuarioRoutes = require('./routes/usuario.routes');
const permisosRoutes = require('./routes/permisosPerfil.routes');
const authRoutes = require('./routes/auth.routes');

const app = express();
const PORT = process.env.PORT || 3000;
const storage = multer.memoryStorage();
const upload = multer({ storage });

/* =======================
    MIDDLEWARES
======================= */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

app.set('trust proxy', 1);

// 1. PRIMERO inicializamos la sesión
app.use(session({
    secret: 'sistema_seguro_123',
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
        secure: true,       
        httpOnly: true,
        sameSite: 'none'  
    }
}));

// 2. SEGUNDO pasamos la sesión a las vistas (res.locals)
app.use((req, res, next) => {
    // Ahora req.session ya existe, no dará error
    res.locals.user = (req.session && req.session.user) ? req.session.user : null;
    next();
});

// 📄 VISTAS
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

/* =======================
    CONEXIÓN DB
======================= */
(async () => {
    try {
        await conectarDB();
        console.log('✅ Conectado a SQL Server');
    } catch (err) {
        console.error('❌ Error DB:', err.message);
        process.exit(1);
    }
})();

/* =======================
    API ROUTES
======================= */
app.use('/api/menu', menuRoutes);
app.use('/api/modulo', moduloRoutes);
app.use('/api/perfil', perfilRoutes);
app.use('/api/usuario', usuarioRoutes);
app.use('/api/permisosPerfil', permisosRoutes);

// 🔐 AUTH
app.use('/auth', authRoutes);

/* =======================
    VISTAS (Rutas de Renderizado)
======================= */

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

app.get('/breadcrums', isAuthenticated, (req, res) => {
    res.sendFile(__dirname + '/public/breadcrums.html');
});

// CRUDS
app.get('/menu', isAuthenticated, (req, res) => res.render('menu'));
app.get('/modulo', isAuthenticated, (req, res) => res.render('modulo'));
app.get('/perfil', isAuthenticated, (req, res) => res.render('perfil'));
app.get('/usuario', isAuthenticated, (req, res) => res.render('usuario'));
app.get('/permisos', isAuthenticated, (req, res) => res.render('permisosPerfil'));

app.get('/Principal_1_1', isAuthenticated, (req, res) => res.render('Principal_1_1'));
app.get('/Principal_1_2', isAuthenticated, (req, res) => res.render('Principal_1_2'));
app.get('/Principal_2_1', isAuthenticated, (req, res) => res.render('Principal_2_1'));
app.get('/Principal_2_2', isAuthenticated, (req, res) => res.render('Principal_2_2'));

/* =======================
    GESTIÓN DE AVATAR (Cloudinary)
======================= */
app.post('/api/usuario/upload-avatar', isAuthenticated, upload.single('imagen'), async (req, res) => {
    try {
        const usuarioId = req.session.user.idUsuario;
        const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

        // 1. Subir a Cloudinary
        const result = await cloudinary.uploader.upload(base64Image, {
            folder: 'perfiles_usuarios',
            public_id: `user_${usuarioId}`,
            overwrite: true
        });

        // 2. Actualizar SQL
        const pool = await conectarDB();
        await pool.request()
            .input('id', sql.Int, usuarioId)
            .input('url', sql.NVarChar, result.secure_url)
            .query(`UPDATE Modulo_Usuario SET FotoUrl = @url WHERE idUsuario = @id`);

        // 3. 🔥 ACTUALIZACIÓN INSTANTÁNEA: Refrescamos los datos en la sesión
        // Consultamos de nuevo para traer TODO (incluyendo el nuevo FotoUrl)
        const userQuery = await pool.request()
            .input('id', sql.Int, usuarioId)
            .query(`
                SELECT u.idUsuario, u.strNombreUsuario, u.strCorreo, u.strCelular, u.FotoUrl, p.strNombrePerfil
                FROM Modulo_Usuario u
                INNER JOIN Modulo_Perfil p ON u.Perfil = p.idPerfil
                WHERE u.idUsuario = @id
            `);

        // Sobrescribimos la sesión con los datos frescos de la BD
        req.session.user = userQuery.recordset[0];

        // Guardamos la sesión antes de responder al cliente
        req.session.save(() => {
            res.json({ success: true, url: result.secure_url });
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* =======================
    HOME & TEST
======================= */
app.get('/', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    res.redirect('/breadcrums'); // O tu dashboard principal
});

app.get('/test-db', async (req, res) => {
    try {
        const result = await sql.query`SELECT GETDATE() AS Fecha`;
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* =======================
    MANEJO DE ERRORES
======================= */
app.use((req, res) => {
    res.status(404).sendFile(__dirname + '/public/404.html');
});

app.use((err, req, res, next) => {
    console.error('💥 Error:', err);
    res.status(500).sendFile(__dirname + '/public/500.html');
});

/* =======================
    SERVER
======================= */
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});