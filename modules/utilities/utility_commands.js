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
					execute: msg => {
						const embed = new Discord.RichEmbed();
						const used = process.memoryUsage().heapUsed / 1024 / 1024;
						embed.addField('Memory Used', (Math.round(used * 100) / 100) + ' MB');
						embed.addField('Uptime (HH:MM:SS)', uptime());
						msg.channel.send(embed);
					}
				}
			]
		}
	)
};

function uptime() {
	var uptime = process.uptime();
	
	function pad(s) {
		return (s < 10 ? '0' : '') + s;
	}
	
	var hours = Math.floor(uptime / (60*60));
	var minutes = Math.floor(uptime % (60*60) / 60);
	var seconds = Math.floor(uptime % 60);
	
	return pad(hours) + ':' + pad(minutes) + ':' + pad(seconds)
}