const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando Dardito...');
console.log('================================');

// Función para iniciar el bot
function startBot() {
    return new Promise((resolve, reject) => {
        console.log('🤖 Iniciando Bot de Discord...');
        
        try {
            const bot = require('./bot.js');
            
            // Timeout de seguridad
            const timeout = setTimeout(() => {
                console.error('❌ Timeout: El bot tardó mucho en conectarse');
                reject(new Error('Bot connection timeout'));
            }, 30000); // 30 segundos
            
            // Esperar a que el bot esté listo
            bot.client.once('ready', () => {
                clearTimeout(timeout);
                console.log('✅ Bot de Discord iniciado correctamente');
                resolve(bot);
            });
            
            // Manejar errores del bot
            bot.client.on('error', (error) => {
                clearTimeout(timeout);
                console.error('❌ Error en el bot:', error);
                reject(error);
            });
            
        } catch (error) {
            console.error('❌ Error iniciando el bot:', error);
            reject(error);
        }
    });
}

// Función para iniciar el servidor web
async function startWebServer() {
    console.log('🌐 Iniciando Servidor Web...');
    
    try {
        const { startServer } = require('./app.js');
        await startServer();
        console.log('✅ Servidor Web iniciado correctamente');
    } catch (error) {
        console.error('❌ Error iniciando servidor web:', error);
        throw error;
    }
}

// Función principal
async function main() {
    try {
        // Verificar que existe config.json
        let config;
        try {
            config = require('./config.json');
            console.log('✅ Archivo config.json cargado correctamente');
            
            // Verificar campos obligatorios
            if (!config.token) {
                throw new Error('Token del bot no configurado');
            }
            
        } catch (error) {
            console.error('❌ Error: No se encontró o no se pudo cargar config.json');
            console.log('📋 Crea un archivo config.json con la siguiente estructura:');
            console.log(`{
    "token": "TU_BOT_TOKEN_AQUI",
    "clientId": "ID_DE_TU_BOT",
    "guildId": "ID_DE_TU_SERVIDOR_DISCORD",
    "rolID": {
        "auditor": "ID_ROL_AUDITOR"
    },
    "canales": {
        "anuncios": "ID_CANAL_ANUNCIOS",
        "anunciosLideres": "ID_CANAL_LIDERES"
    }
}`);
            console.log('\n📝 Pasos para obtener estos valores:');
            console.log('1. Ve a https://discord.com/developers/applications');
            console.log('2. Crea una aplicación y bot');
            console.log('3. Copia el token del bot');
            console.log('4. Activa el modo desarrollador en Discord');
            console.log('5. Haz clic derecho en tu servidor/canales/roles para copiar IDs');
            process.exit(1);
        }

        // Crear directorios necesarios si no existen
        const fs = require('fs');
        const dirs = ['databases', 'views', 'commands', 'public'];
        
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`📁 Directorio creado: ${dir}`);
            }
        });

        // Inicializar archivos JSON si no existen
        const jsonFiles = [
            { path: './databases/users.json', content: '{}' },
            { path: './databases/groups.json', content: '{}' },
            { path: './databases/db.json', content: '{"Grupo1": []}' }
        ];

        jsonFiles.forEach(file => {
            if (!fs.existsSync(file.path)) {
                fs.writeFileSync(file.path, file.content);
                console.log(`📄 Archivo creado: ${file.path}`);
            }
        });

        console.log('🔧 Verificación de archivos completada');
        console.log('================================');

        // Iniciar bot primero
        startBot();
        
        // Esperar un poco antes de iniciar el servidor web
        new Promise(resolve => setTimeout(resolve, 2000));
        
        // Iniciar servidor web
        startWebServer();
        
        console.log('================================');
        console.log('✅ ¡Dardito iniciado correctamente!');
        console.log('🤖 Bot de Discord: ONLINE');
        console.log('🌐 Servidor Web: ONLINE');
        console.log('📋 Dashboard: http://localhost:3000');
        console.log('================================');
        
    } catch (error) {
        console.error('❌ Error fatal iniciando Dardito:', error);
        process.exit(1);
    }
}

// Manejar cierre del programa
process.on('SIGINT', () => {
    console.log('\n🛑 Cerrando Dardito...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Cerrando Dardito...');
    process.exit(0);
});

// Iniciar la aplicación
main();