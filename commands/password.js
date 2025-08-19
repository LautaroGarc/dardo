const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

function generarContraseñaSegura() {
    return crypto.randomBytes(16).toString('hex');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('contraseña')
        .setDescription('Contraseña del dashboard')
        .addSubcommand(subcommand =>
            subcommand
                .setName('mostrar')
                .setDescription('Muestra la contraseña para ingresar al Dashboard')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('regenerar')
                .setDescription('Genera una nueva contraseña para ingresar al Dashboard')
        ),
    
    
    async execute(interaction) {

    }
};