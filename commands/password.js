const { SlashCommandBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');

// Importar la función de generar contraseña
const { generarPass } = require('../functions.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('contraseña')
        .setDescription('Gestión de contraseña del dashboard')
        .addSubcommand(subcommand =>
            subcommand
                .setName('mostrar')
                .setDescription('Muestra tu contraseña para ingresar al Dashboard')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('regenerar')
                .setDescription('Genera una nueva contraseña para ingresar al Dashboard')
        ),
    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const userId = interaction.user.id;

        console.log(`🔑 Comando /contraseña ${subcommand} ejecutado por ${interaction.user.tag} (${userId})`);

        try {
            // Cargar datos de usuarios
            let users = {};
            const usersPath = path.join(__dirname, '..', 'databases', 'users.json');
            
            try {
                if (fs.existsSync(usersPath)) {
                    const usersData = fs.readFileSync(usersPath, 'utf8');
                    users = JSON.parse(usersData);
                } else {
                    console.log('📄 Archivo users.json no existe, creándolo...');
                    fs.writeFileSync(usersPath, '{}');
                }
            } catch (error) {
                console.error('❌ Error cargando users.json:', error);
                await interaction.reply({
                    content: '❌ Error: No se pudo acceder a la base de datos de usuarios. Contacta a un administrador.',
                    ephemeral: true
                });
                return;
            }

            // Verificar si el usuario existe
            if (!users[userId]) {
                console.log(`⚠️ Usuario ${interaction.user.tag} no encontrado en la base de datos`);
                
                // Auto-registrar el usuario
                const member = interaction.member || await interaction.guild.members.fetch(userId);
                let grupo = 'SinGrupo';
                
                // Obtener el primer rol que no sea @everyone
                const roles = member.roles.cache.filter(role => role.name !== '@everyone');
                if (roles.size > 0) {
                    grupo = roles.first().name;
                }

                // Crear nuevo usuario
                users[userId] = {
                    nickname: member.displayName || interaction.user.username,
                    grupo: grupo,
                    token: generarPass()
                };

                // Guardar cambios
                fs.writeFileSync(usersPath, JSON.stringify(users, null, 4));
                console.log(`✅ Usuario auto-registrado: ${users[userId].nickname} (${grupo})`);
            }

            if (subcommand === 'mostrar') {
                const userToken = users[userId].token;
                const userName = users[userId].nickname;
                const userGroup = users[userId].grupo;

                await interaction.reply({
                    embeds: [{
                        color: 0x0099FF,
                        title: '🔑 Tu Contraseña de Acceso',
                        description: `\`\`\`${userToken}\`\`\``,
                        fields: [
                            { name: '👤 Usuario', value: userName, inline: true },
                            { name: '🏷️ Grupo', value: userGroup, inline: true },
                            { name: '🌐 Dashboard', value: 'http://localhost:3000', inline: false }
                        ],
                        footer: { text: 'Esta contraseña es personal y única. No la compartas.' },
                        timestamp: new Date().toISOString()
                    }],
                    ephemeral: true
                });

                console.log(`✅ Contraseña mostrada a ${userName}`);

            } else if (subcommand === 'regenerar') {
                // Generar nueva contraseña
                const newToken = generarPass();
                
                // Actualizar en la base de datos
                users[userId].token = newToken;
                
                // Guardar cambios
                fs.writeFileSync(usersPath, JSON.stringify(users, null, 4));

                const userName = users[userId].nickname;
                const userGroup = users[userId].grupo;

                await interaction.reply({
                    embeds: [{
                        color: 0x00FF00,
                        title: '🔄 Contraseña Regenerada',
                        description: `\`\`\`${newToken}\`\`\``,
                        fields: [
                            { name: '👤 Usuario', value: userName, inline: true },
                            { name: '🏷️ Grupo', value: userGroup, inline: true },
                            { name: '⚠️ Importante', value: 'Tu contraseña anterior ya no funcionará', inline: false },
                            { name: '🌐 Dashboard', value: 'http://localhost:3000', inline: false }
                        ],
                        footer: { text: 'Nueva contraseña generada exitosamente' },
                        timestamp: new Date().toISOString()
                    }],
                    ephemeral: true
                });

                console.log(`🔄 Contraseña regenerada para ${userName} (${userGroup})`);
            }

        } catch (error) {
            console.error(`❌ Error en comando /contraseña ${subcommand}:`, error);
            await interaction.reply({
                content: '❌ Ocurrió un error procesando tu solicitud. Inténtalo de nuevo.',
                ephemeral: true
            });
        }
    }
};