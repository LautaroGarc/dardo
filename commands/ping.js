const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Responde con pong! - Comando de prueba'),
    
    async execute(interaction) {
        console.log(`🏓 Comando /ping ejecutado por ${interaction.user.tag}`);
        
        const sent = await interaction.reply({
            content: '🏓 Pong! Calculando latencia...',
            fetchReply: true,
            ephemeral: true
        });
        
        const latency = sent.createdTimestamp - interaction.createdTimestamp;
        const apiLatency = Math.round(interaction.client.ws.ping);
        
        await interaction.editReply({
            content: `🏓 **Pong!**\n📡 **Latencia:** ${latency}ms\n🌐 **API Discord:** ${apiLatency}ms\n✅ **Estado:** Bot funcionando correctamente`
        });
        
        console.log(`✅ Ping respondido - Latencia: ${latency}ms, API: ${apiLatency}ms`);
    }
};