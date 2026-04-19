const express = require('express');
const session = require('express-session');
const cloudinary = require('./config/cloudinary');
const multer = require('multer');
require('dotenv').config();

const { sql, conectarDB } = require('./db');

// 🔐 Middleware de autenticación
const isAuthenticated = require('./middlewares/auth');

// 🔥 Rutas (solo las que SÍ existen)
const menuRoutes = require('./routes/menu.routes');
const moduloRoutes = require('./routes/modulo.routes');
const perfilRoutes = require('./routes/perfil.routes');
const usuarioRoutes = require('./routes/usuario.routes');
const permisosRoutes = require('./routes/permisosPerfil.routes');
const authRoutes = require('./routes/auth.routes');

const app = express();
const PORT = process.env.PORT || 3000;

const storage = multer.memoryStorage();

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // Limite de 5MB por imagen
    }
});

/* =======================
   MIDDLEWARES
======================= */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));


app.set('trust proxy', 1);

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
   VISTAS
======================= */

// 🔑 LOGIN
app.get('/login', (req, res) => {
    res.render('login');
});

// 🔒 LOGOUT
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

// 🏠 DASHBOARD
app.get('/breadcrums', isAuthenticated, (req, res) => {
    res.sendFile(__dirname + '/public/breadcrums.html');
});

// 📦 CRUDS (solo los que tienes)
app.get('/menu', isAuthenticated, (req, res) => {
    res.render('menu');
});

app.get('/modulo', isAuthenticated, (req, res) => {
    res.render('modulo');
});

app.get('/perfil', isAuthenticated, (req, res) => {
    res.render('perfil');
});

app.get('/usuario', isAuthenticated, (req, res) => {
    res.render('usuario');
});

app.get('/permisos', isAuthenticated, (req, res) => {
    res.render('permisosPerfil');
});

app.get('/Principal_1_1', isAuthenticated, (req, res) => {
    res.render('Principal_1_1');
});

app.get('/Principal_1_2', isAuthenticated, (req, res) => {
    res.render('Principal_1_2');
});

app.get('/Principal_2_1', isAuthenticated, (req, res) => {
    res.render('Principal_2_1');
});

app.get('/Principal_2_2', isAuthenticated, (req, res) => {
    res.render('Principal_2_2');
});

/* =======================
   HOME
======================= */
app.get('/', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.redirect('/dashboard');
});

/* =======================
   TEST DB
======================= */
app.get('/test-db', async (req, res) => {
    try {
        const result = await sql.query`SELECT GETDATE() AS Fecha`;
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// Subir Avatar de Usuario a Cloudinary y BD
// ==========================================
app.post('/usuario/upload-avatar', upload.single('imagen'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No hay imagen' });

        const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        const result = await cloudinary.uploader.upload(base64Image, {
            folder: 'perfiles',
            transformation: [{ width: 200, height: 200, crop: "fill" }]
        });

        const imageUrl = result.secure_url;

        // ACTUALIZAR EN LA BASE DE DATOS
        const pool = await conectarDB();
        await pool.request()
            .input('url', sql.NVarChar, imageUrl)
            .input('id', sql.Int, req.session.user.id)
            .query('UPDATE Modulo_Usuario SET fotoPerfilUrl = @url WHERE idUsuario = @id');

        // Actualizar la sesión para que el cambio se vea al recargar
        req.session.user.fotoPerfil = imageUrl;

        res.json({ url: imageUrl });
    } catch (error) {
        res.status(500).send('Error');
    }
});

/* =======================
   404
======================= */
app.use((req, res) => {
    res.status(404).sendFile(__dirname + '/public/404.html');
});

/* =======================
   500
======================= */
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