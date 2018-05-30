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
					usage: '.bot stats',
					description: 'View the important statistics of the bot.',
					permission: 'nomarch.util.stats',
					execute: (msg, args) => {
						const embed = exports.embed();
						embed.setColor('GREY');
						const used = process.memoryUsage().heapUsed / 1024 / 1024;
						embed.addField('Memory Used', `${(Math.round(used * 100) / 100)}MB`);
						embed.addField('Uptime (HH:MM:SS)', uptime(), true);
						msg.channel.send(embed);
					}
				},
				{
					name: 'cmdprefix',
					usage: '.bot cmdprefix <command prefix>',
					description: 'Set the command prefix.',
					permission: 'nomarch.util.cmdprefix',
					execute: (msg, args) => {
					
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

/**
 * Create an embed with pre defined fields.
 * @returns {module:discord.js.RichEmbed}
 */
exports.embed = () => {
	const embed = new Discord.RichEmbed();
	embed.setAuthor('Nomarch', 'https://t2.genius.com/unsafe/440x440/https%3A%2F%2Fimages.genius.com%2F877a0b1f8087b10a86da0737921dc9f7.500x500x1.jpg');
	return embed;
};

/**
 * Send an error message in an embed.
 * @param channel - channel name.
 * @param member - member who this is to be directed to.
 * @param message - the message to embed.
 */
exports.sendError = (channel, member, message) => {
	const embed = exports.embed();
	embed.setColor('RED');
	embed.addField('Error!', member);
};

/**
 * Send a regular message in an embed.
 * @param channel - channel name.
 * @param member - member who this is to be directed to.
 * @param message - the message to embed.
 */
exports.send = (channel, member, message) => {
	const embed = exports.embed();
	embed.setColor('GREY');
	embed.addField('Message', message);
};