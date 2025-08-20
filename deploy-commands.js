const { REST, Routes } = require('discord.js');
const { clientId, guildId, token } = require('./config.json');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandNames = new Set();

const loadCommands = (dir) => {
    const commandFiles = fs.readdirSync(dir, { withFileTypes: true });

    for (const file of commandFiles) {
        const filePath = path.join(dir, file.name);

        if (file.isDirectory()) {
            loadCommands(filePath); 
        } else if (file.name.endsWith('.js')) {
            const command = require(filePath);
            if (command.data) {
                if (commandNames.has(command.data.name)) {
                    console.error(`¡Comando duplicado detectado!: ${command.data.name} en ${filePath}`);
                } else {
                    commandNames.add(command.data.name);
                    commands.push(command.data);
                }
            } else {
                console.error(`El archivo ${filePath} no tiene un comando 'data' adecuado.`);
            }
        }
    }
};

loadCommands(path.join(__dirname, 'commands'));

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('Registrando slash commands...');
    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands }
    );
    console.log('comandos registrados');
  } catch (error) {
    console.error('Error al registrar los comandos:', error);
  }
})();