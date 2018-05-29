const Discord = require('discord.js');


exports.init = (client, app) => {
	app.addCommand(
		{
			name: 'bot',
			usage: "Parent command for bot utility commands.",
			execute: null,
			children: [
				{
					name: 'stats',
					usage: 'View the important statistics of the bot.',
					permission: 'nomarch.util.stats',
					execute: (msg, args) => {
						const embed = new Discord.RichEmbed();
						const used = process.memoryUsage().heapUsed / 1024 / 1024;
						embed.addField('Memory Used', `${(Math.round(used * 100) / 100)}MB`);
						embed.addField('Uptime (HH:MM:SS)', uptime());
						msg.channel.send(embed);
					}
				}
			]
		}
	)
};

function uptime() {
	let uptime = process.uptime();
	
	function pad(s) {
		return (s < 10 ? '0' : '') + s;
	}
	
	let hours = Math.floor(uptime / (60 * 60));
	let minutes = Math.floor(uptime % (60 * 60) / 60);
	let seconds = Math.floor(uptime % 60);
	
	return pad(hours) + ':' + pad(minutes) + ':' + pad(seconds)
}