const { Client, GatewayIntentBits, EmbedBuilder, ActivityType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { GameDig } = require('gamedig');
const fs = require('fs');
const config = require('./config.json');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

client.once('ready', () => {
    console.log(`Le bot est en ligne ${client.user.tag}!`);
    client.user.setStatus('online');
    client.user.setPresence({
        activities: [{ name: 'Chargement du serveur...', type: ActivityType.WATCHING }],
    });

    checkServerStatus();
    setInterval(checkServerStatus, 60000);
});

async function checkServerStatus(interaction) {
    try {
        const state = await GameDig.query({
            type: 'garrysmod',
            host: config.ServerIP,
            port: config.ServerPort,
        });        

        const playersOnline = state.players.length;
        const maxPlayers = state.maxplayers;

        client.user.setPresence({
            activities: [{
                name: `${playersOnline}/${maxPlayers}`,
                type: ActivityType.WATCHING,
            }],
            status: 'dnd',
        });

        const embed = new EmbedBuilder()
            .setTitle(config.servertitle)
            .setImage(config.image)
            .addFields(
                { name: 'IP', value: `\`${config.ServerIP}:${config.ServerPort}\``, inline: true },
                { name: 'Statut', value: '✅ En ligne', inline: true },
                { name: 'Joueurs connectés', value: `${playersOnline}/${maxPlayers}`, inline: false },
                { name: 'Gamemode', value: config.gamemode, inline: true },
                { name: 'Carte', value: state.map, inline: true },
                { name: "Connexion directe", value: `steam://connect/${config.ServerIP}:${config.ServerPort}`, inline: false },
            )
            .setColor(config.colorembed)
            .setTimestamp();

        const channel = client.channels.cache.get(config.ChannelID);
        if (channel) {
            if (!config.MessageID) {
                const sentMessage = await channel.send({ embeds: [embed] });
                config.MessageID = sentMessage.id;
                fs.writeFileSync('./config.json', JSON.stringify(config, null, 2), 'utf-8');
                console.log('Statut du serveur envoyé et MessageID enregistré.');
            } else {
                const message = await channel.messages.fetch(config.MessageID);
                if (message) {
                    await message.edit({ embeds: [embed] });
                    if (interaction) await interaction.reply({ content: 'Statut actualisé !', ephemeral: true });
                    console.log('[N-Status - Statut du serveur mis à jour].');
                } else {
                    console.error('Message non trouvé, réinitialisation du MessageID.');
                    config.MessageID = null;
                }
            }
        } else {
            console.error('Le canal avec cet ID est introuvable.');
        }
    } catch (error) {
        console.error('Erreur lors de la récupération du statut du serveur:', error);

        client.user.setPresence({
            activities: [{ name: 'Serveur hors ligne', type: ActivityType.WATCHING }],
        });
    }
}

client.login(config.Token);
