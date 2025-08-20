const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');

// Crear cliente del bot
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// Colección de comandos
client.commands = new Collection();

// Cargar comandos
const commandsPath = path.join(__dirname, 'commands');

// Verificar que existe el directorio de comandos
if (!fs.existsSync(commandsPath)) {
    fs.mkdirSync(commandsPath, { recursive: true });
    console.log('📁 Directorio commands/ creado');
}

const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

console.log('📋 Cargando comandos...');
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    try {
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            console.log(`   ✅ Comando cargado: ${command.data.name}`);
        } else {
            console.log(`   ⚠️ El comando en ${file} no tiene las propiedades requeridas (data, execute)`);
        }
    } catch (error) {
        console.error(`   ❌ Error cargando comando ${file}:`, error.message);
    }
}

console.log(`📦 Total comandos cargados: ${client.commands.size}`);

// Evento cuando el bot está listo
client.once('ready', async () => {
    console.log(`🤖 Bot conectado como ${client.user.tag}`);
    console.log(`📊 Bot está en ${client.guilds.cache.size} servidor(es)`);
    
    // Registrar comandos slash
    try {
        console.log('📝 Registrando comandos slash...');
        const commands = [];
        
        // Recopilar todos los comandos
        client.commands.forEach(command => {
            commands.push(command.data.toJSON());
            console.log(`   └─ Comando: /${command.data.name}`);
        });
        
        // Registrar comandos globalmente (puede tomar hasta 1 hora)
        // O registrar en un servidor específico para pruebas (instantáneo)
        const guild = client.guilds.cache.first();
        if (guild) {
            await guild.commands.set(commands);
            console.log(`✅ Comandos registrados en el servidor: ${guild.name}`);
        } else {
            await client.application.commands.set(commands);
            console.log('✅ Comandos registrados globalmente');
        }
        
    } catch (error) {
        console.error('❌ Error registrando comandos:', error);
    }

    // Generar tokens para usuarios al iniciar
    await generarTokensUsuarios();
});

// Manejar interacciones de comandos
client.on('interactionCreate', async interaction => {
    // Solo procesar comandos slash
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    
    if (!command) {
        console.warn(`⚠️ Comando no encontrado: ${interaction.commandName}`);
        return;
    }

    console.log(`🔧 Ejecutando comando: /${interaction.commandName} por ${interaction.user.tag}`);

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`❌ Error ejecutando comando /${interaction.commandName}:`, error);
        
        const errorMessage = 'Hubo un error ejecutando este comando. Inténtalo de nuevo.';
        
        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: errorMessage, ephemeral: true });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        } catch (followUpError) {
            console.error('❌ Error enviando mensaje de error:', followUpError);
        }
    }
});

// Función para generar tokens para todos los usuarios
async function generarTokensUsuarios() {
    try {
        const guild = client.guilds.cache.first();
        if (!guild) {
            console.log('❌ No se encontró el servidor');
            return;
        }

        console.log('👥 Generando tokens para usuarios...');

        // Obtener todos los miembros
        await guild.members.fetch();
        
        // Cargar usuarios existentes
        let users = {};
        try {
            const usersData = fs.readFileSync('./databases/users.json', 'utf8');
            users = JSON.parse(usersData);
        } catch (error) {
            console.log('📄 Creando nuevo archivo users.json');
        }

        // Cargar grupos existentes
        let groups = {};
        try {
            const groupsData = fs.readFileSync('./databases/groups.json', 'utf8');
            groups = JSON.parse(groupsData);
        } catch (error) {
            console.log('📄 Creando nuevo archivo groups.json');
        }

        let newUsersCount = 0;

        guild.members.cache.forEach(member => {
            if (member.user.bot) return; // Ignorar bots

            const userId = member.user.id;
            
            // Si el usuario no existe, crear entrada
            if (!users[userId]) {
                // Obtener grupo del usuario (primer rol que no sea @everyone)
                let grupo = 'SinGrupo';
                const roles = member.roles.cache.filter(role => role.name !== '@everyone');
                if (roles.size > 0) {
                    grupo = roles.first().name;
                }

                // Generar token único
                const { generarPass } = require('./functions.js');
                const token = generarPass();

                users[userId] = {
                    nickname: member.displayName || member.user.username,
                    grupo: grupo,
                    token: token
                };

                // Agregar al grupo correspondiente
                if (!groups[grupo]) {
                    groups[grupo] = [];
                }
                
                if (!groups[grupo].includes(userId)) {
                    groups[grupo].push(userId);
                }

                newUsersCount++;
                console.log(`✅ Usuario agregado: ${users[userId].nickname} (${grupo})`);
            }
        });

        // Guardar archivos actualizados
        fs.writeFileSync('./databases/users.json', JSON.stringify(users, null, 4));
        fs.writeFileSync('./databases/groups.json', JSON.stringify(groups, null, 4));

        console.log(`✅ Tokens generados. Usuarios nuevos: ${newUsersCount}`);
        
    } catch (error) {
        console.error('❌ Error generando tokens:', error);
    }
}

// Eventos adicionales para debugging
client.on('debug', (info) => {
    // Solo mostrar información relevante, no todo el spam
    if (info.includes('Heartbeat')) return;
    if (info.includes('Hit a 429')) {
        console.log('⚠️ Rate limit alcanzado, esperando...');
    }
});

client.on('warn', (warning) => {
    console.warn('⚠️ Discord Warning:', warning);
});

client.on('error', (error) => {
    console.error('❌ Discord Error:', error);
});

// Manejo de errores de proceso
process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught exception:', error);
    process.exit(1);
});
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

// Exportar funciones para uso en app.js
module.exports = {
    client,
    getUserByToken
};

// Iniciar el bot
if (require.main === module) {
    client.login(config.token);
}