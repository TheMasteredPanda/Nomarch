const fs = require('fs');
const util = require('../utilities/utility_commands');

let data = {
	userId: {
		current: [
			{
				type: 'PERMBAN',
				duration: 34543,
				executor: 34565432,
				reason: 'Because I wanted to.',
				date: {
					start: 2345443,
					finish: 345321
				}
			}
		],
		history: [
			{
				type: 'PERMBAN',
				duration: 34543,
				executor: 34565432,
				reason: 'Because I wanted to.',
				extra: {
					ended_prematurely: true,
					ended_by: 234532,
					reason: 'Because they were being lovely to me.'
				},
				date: {
					start: 2345443,
					finish: 345321
				}
			}
		
		]
	}
};

const discordUsernameRegex = /^[A-Za-z.\s]+#\d\d\d\d/g;
let discordClient;

exports.init = (client, app) => {
	discordClient = client;
	
	setTimeout(async () => {
		 let exists = await app.fExists('./modules/moderation-commands/punishments.json', err => {
		 	if (err) console.error(err);
		 });
		
		if (!exists) {
		 	await fs.writeFile('./modules/moderation-commands/punishments.json', JSON.stringify(data), err => {
		 		if (err) console.error(err);
		 		console.log('Created punishments file.');
		 		data = require('./punishments');
		 	});
		}
	}, 150);
	
	app.addCommand({
		name: 'mod',
		usage: `${app.getCommandPrefix()}mod <command>`,
		description: 'Parent command of the moderation system.',
		execute: null,
		children: [
			{
				name: 'ban',
				usage: `${app.getCommandPrefix()}mod ban <username#discriminator> <reason> <duration> or ${app.getCommandPrefix()}mod ban <username#discriminator> <reason>`,
				description: 'Ban a member temporarily or permanently.',
				arguments: 3,
				execute: (msg, args) => {
					if (!args[0].match(discordUsernameRegex)) {
						util.sendError(msg.channel, msg.author, `Couldn't find member ${args[0]}`);
						return;
					}
					
					let nameArgs = args[0].split('#');
					let member = client.guilds.array()[0].members.find(m => m.name === nameArgs[0] && m.user.discriminator === nameArgs[1]);
					
					if (member === null || member === undefined) {
						util.sendError(msg.channel, msg.author, `Could't find member ${args[0]}`);
						return;
					}
					
					if (exports.isBanned(member.user.id)) {
						util.sendError(msg.channel, msg.author, `${member.user.username} is already banned.`);
						return;
					}
					
					const permanent = args.length === 3;
					
					exports.ban(member.id, permanent, args[1], msg.author.id, permanent ? -0 : args[2]);
					util.send(msg.channel, msg.author, `Banned member ${member.user.username} ${permanent ? `` : ` for ${duration / 60} minutes`}, because ${args[0]}.`);
				}
			},
			{
				name: 'mute',
				usage: `${app.getCommandPrefix()}mod mute <username#discriminator> <duration> <reason> or ${app.getCommandPrefix()}mod mute <username#discriminator> <reason>`,
				description: 'Mute a member temporarily or permanently.',
				arguments: 2,
				execute: (msg, args) => {
					if (!args[0].match(discordUsernameRegex)) {
						util.sendError(msg.channel, msg.author, `Couldn't find member ${args[0]}.`);
						return;
					}
					
					let nameArgs = args[0].split('#');
					let member = client.guild.array()[0].members.find(m => m.user.username === nameArgs && m.user.discriminator === nameArgs[1]);
					
					if (member === null || member === undefined) {
						util.sendError(`Couldn't find member ${args[0]}.`);
						return;
					}
					
					if (exports.isMuted(member.id)) {
						util.sendError(msg.channel, msg.author, `Member ${member.user.username} is already muted.`);
						return;
					}
					
					const permanent = args.length === 3;
					exports.mute(member.id, permanent, permanent ? args[2] : args[1], msg.author.id, permanent ? -0 : args[1]);
					util.send(msg.channel, msg.author, `Member ${member.user.username} ${permanent ? `muted` : `temporarily muted for ${args[1]}`} because ${permanent ? args[2] : args[1]}.`)
				}
			},
			{
				name: 'info',
				usage: `${app.getCommandPrefix()}mod info <username#discriminator>`,
				description: 'To view a detailed description of a players punishment record.',
				arguments: 1,
				execute: (msg, args) => {
					if (!args[0].match(discordUsernameRegex)) {
						util.send(msg.channel, msg.author, `Can't find user ${args[0]}.`);
						return;
					}
					
					let nameArgs = args[0].split('#');
					let member = discordClient.guilds.array()[0].members.find(m => m.user.username === nameArgs[0] && m.user.discriminator === nameArgs[1]);
					
					if (member === null && member === undefined) {
						util.send(msg.channel, msg.author, `Can't find member ${args[0]} in guild.`);
						return;
					}
					
					if (!data.history.hasOwnProperty(member.user.id)) {
						util.send(msg.channel, msg.author, `This member doesn't have a punishment history.`);
					} else {
						let history = data.history[member.user.id];
						const embed = util.embed();
						
						for (let i = 0; i < history.length; i++) {
							let entry = history[i];
							embed.addField(i, `Type: ${entry.type}\nDuration ${Date.parse(entry.duration)}\nExecutor: ${client.guilds.array()[0].members.find(m => m.user.id === entry.executor).user.name}
							\nReason: ${entry.reason}\nEnded Prematurely: ${entry.hasOwnProperty('extra') ? entry.extra.ended_prematurely : false}\nEnded By: ${entry.hasOwnProperty('extra') ?
								client.guilds.array()[0].members.find(m => m.user.id === entry.extra.ended_by).user.name : null}\nEnded Because: ${entry.hasOwnProperty('extra') ? entry.extra.reason : null}\nStarted: ${Date.parse(entry.date.start)}\nFinished: ${Date.parse(entry.date.finish)}.`);
						}
						
						msg.channel.send(embed);
					}
				}
			}
		]
	});
	
	client.on('message', msg => {
		if (exports.isMuted(msg.author.id)) {
			return;
		}
	});
};

exports.ban = (memberId, permanent, reason, executorId, duration) => {
	if (exports.isBanned(memberId)) {
		return;
	}
	
	if (!data.hasOwnProperty(memberId)) {
		data[memberId] = {
			current: [],
			history: []
		};
	}

	data[memberId].push({
		type: permanent ? 'PERMBAN' : 'TEMPBAN',
		executor: executorId,
		reason: reason,
		date: {
			start: Date.now(),
			finish: permanent ? -0 : Date.now() + (duration * 1000)
		}
	});
	
	save();
	let guild = discordClient.guilds.array()[0];
	guild.ban(memberId, {reason: `User was ${permanent ? `temporarily` : `permanently`} banned for ${reason} by ${guild.members.find(m => m.id === executorId).user.username}.`});
};

function save() {
	setInterval(async () => {
		await fs.writeFile('./modules/moderation-commands/punishments.json', data, err => {
			if (err) throw err;
			data = require('./punishments');
		});
	}, 150);
}

exports.isBanned = userId => {
	if (!data.hasOwnProperty(userId)) {
		return false;
	} else {
		for (let i = 0 ; i < data[userId].c.length; i++) {
			let entry = data[userId].current[i];
			
			if (entry.type !== 'TEMPBAN' || entry.type !== 'PERMBAN') {
				continue;
			}
			
			return true;
		}
		
		return false;
	}
};

exports.isMuted = userId => {
	if (!data.hasOwnProperty(userId)) {
		return false;
	} else {
		for (let i = 0; i < data[userId].current.length; i++) {
			let entry = data[userId].current[i];
			
			if (entry.type !== 'PERMMUTE' || entry.type !== 'TEMPMUTE') {
				continue;
			}
			
			return true;
		}
		
		return false;
	}
};

exports.mute = (memberId, permanent, reason, executorId, duration) => {
	if (exports.isMuted(memberId)) {
		return;
	}
	
	if (!data.hasOwnProperty(memberId)) {
		data[memberId] = {
			current: [],
			history: []
		}
	}
	
	data[memberId].current.push({
		type: permanent ? 'PERMMUTE' : 'TEMPMUTE',
		executor: executorId,
		reason: reason,
		date: {
			start: Date.now(),
			finish: permanent ? -0 : Date.now() + (duration * 1000)
		}
	});
	
	save();
};

