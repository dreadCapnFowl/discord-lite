const https = require('https');
const fs = require('fs');
const Discord = require('discord.js');
const Tenor = require("tenorjs").client({
    "Key": "7DF45MF9H78C", // https://tenor.com/developer/keyregistration
    "Filter": "off", // "off", "low", "medium", "high", not case sensitive
    "Locale": "en_US", // Your locale here, case-sensitivity depends on input
    "MediaFilter": "minimal", // either minimal or basic, not case sensitive
    "DateFormat": "D/MM/YYYY - H:mm:ss A" // Change this accordingly
});

module.exports = {
	name: '/kiss',
	description: 'Fetches an anime girl kiss from Tenor',
	execute(message, args) {

    Tenor.Search.Random("anime kiss", "3").then(res => {
          message.channel.send(res.random().url)
          .then(() => {
            message.delete()
          })
    }).catch(console.error);
	},
};
