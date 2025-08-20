//aloja la pagina
const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar motor de plantillas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// Configurar sesiones
app.use(session({
    secret: 'dardito-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 horas
}));

// Función para obtener usuario por token
function getUserByToken(token) {
    try {
        const usersData = fs.readFileSync('./databases/users.json', 'utf8');
        const users = JSON.parse(usersData);
        
        for (const [userId, userData] of Object.entries(users)) {
            if (userData.token === token) {
                return { userId, ...userData };
            }
        }
        return null;
    } catch (error) {
        console.error('❌ Error buscando usuario por token:', error);
        return null;
    }
}

// Middleware para verificar autenticación
function requireAuth(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
}

// Rutas

// Ruta principal - redirige a login si no está autenticado
app.get('/', (req, res) => {
    if (req.session.user) {
        res.redirect('/dashboard');
    } else {
        res.redirect('/login');
    }
});

// Ruta de login - GET
app.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/dashboard');
    }
    
    res.render('login', { error: null });
});

// Ruta de login - POST
app.post('/login', (req, res) => {
    const { password } = req.body;
    
    if (!password) {
        return res.render('login', { error: 'Por favor ingresa una contraseña' });
    }
    
    // Buscar usuario por token
    const user = getUserByToken(password);
    
    if (!user) {
        return res.render('login', { error: 'Contraseña incorrecta' });
    }
    
    // Guardar usuario en sesión
    req.session.user = {
        userId: user.userId,
        nickname: user.nickname,
        grupo: user.grupo,
        token: user.token
    };
    
    console.log(`✅ Usuario autenticado: ${user.nickname} (${user.grupo})`);
    res.redirect('/dashboard');
});

// Ruta del dashboard - requiere autenticación
app.get('/dashboard', requireAuth, (req, res) => {
    res.render('dashboard', { user: req.session.user });
});

// Ruta de logout
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error cerrando sesión:', err);
        }
        res.redirect('/login');
    });
});

// Ruta de API para obtener información del usuario (para uso futuro)
app.get('/api/user', requireAuth, (req, res) => {
    res.json({
        success: true,
        user: req.session.user
    });
});

// Manejo de errores 404
app.use((req, res) => {
    res.status(404).send('Página no encontrada');
});

// Función para iniciar el servidor
function startServer() {
    return new Promise((resolve) => {
        const server = app.listen(PORT, () => {
            console.log(`🌐 Servidor web iniciado en http://localhost:${PORT}`);
            resolve(server);
        });
    });
}

// Exportar app y función de inicio
module.exports = {
    app,
    startServer
};

// Iniciar servidor si se ejecuta directamente
if (require.main === module) {
    startServer();
}