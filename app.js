const express = require('express');
const session = require('express-session');
require('dotenv').config();

const { sql, conectarDB } = require('./db');

// 🔐 Middleware de autenticación
const isAuthenticated = require('./middlewares/auth');

// 🔥 Rutas
const personalRoutes = require('./routes/personal.routes');
const menuRoutes = require('./routes/menu.routes');
const moduloRoutes = require('./routes/modulo.routes');
const perfilRoutes = require('./routes/perfil.routes');
const usuarioRoutes = require('./routes/usuario.routes');
const permisosRoutes = require('./routes/permisosPerfil.routes');
const authRoutes = require('./routes/auth.routes');

const app = express();
const PORT = process.env.PORT || 3000;

/* =======================
   MIDDLEWARES
======================= */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// 🔐 SESIÓN
app.use(session({
    secret: 'sistema_seguro_123',
    resave: false,
    saveUninitialized: false
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
app.use('/api/personal', personalRoutes);
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

// 🔑 LOGIN (pantalla principal)
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
app.get('/dashboard', isAuthenticated, (req, res) => {
    res.render('menu', {
        user: req.session.user
    });
});

// 📦 CRUDS
app.get('/personal', isAuthenticated, (req, res) => {
    res.render('personal');
});

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

/* =======================
   HOME (REDIRECCIÓN)
======================= */
app.get('/', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login'); // 👈 inicia en login
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