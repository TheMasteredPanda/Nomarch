const fs = require('fs');

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
	
	if (!fs.existsSync('./modules/moderation-commands/data.json')) {
		fs.writeFileSync('./modules/moderation-commands/data.json', JSON.stringify({}));
	}
	
	data = require('./data');
	
	app.addCommand({
		name: 'mod',
		usage: '.mod <command>',
		description: 'Parent command of the moderation system.',
		execute: null,
		children: [
			{
				name: 'ban',
				usage: '.mod ban <username#discriminator> <reason> <duration> or .mod ban <username#discriminator> <reason>',
				description: 'Ban a member temporarily or permanently.',
				arguments: 3,
				execute: (msg, args) => {
					if (!args[0].match(discordUsernameRegex)) {
						msg.channel.send(`Couldn't find member ${args[0]}`);
						return;
					}
					
					let nameArgs = args[0].split('#');
					let member = client.guilds.array()[0].members.find(m => m.name === nameArgs[0] && m.user.discriminator === nameArgs[1]);
					
					if (member === null || member === undefined) {
						msg.channel.send(`Could't find member ${args[0]}`);
						return;
					}
					
					if (exports.isBanned(member.user.id)) {
						msg.channel.send(`${member.user.username} is already banned.`);
						return;
					}
					
					const permanent = args.length === 3;
					
					exports.ban(member.id, permanent, args[1], msg.author.id, permanent ? -0 : args[2]);
					msg.channel.send(`Banned member ${member.user.username} ${permanent ? `` : ` for ${duration / 60} minutes`}, because ${args[0]}.`);
				}
			},
			{
				name: 'mute',
				usage: '.mod mute <username#discriminator> <duration> <reason> or .mod mute <username#discriminator> <reason>',
				description: 'Mute a member temporarily or permanently.',
				arguments: 2,
				execute: (msg, args) => {
					if (!args[0].match(discordUsernameRegex)) {
						msg.channel.send(`Couldn't find member ${args[0]}.`);
						return;
					}
					
					let nameArgs = args[0].split('#');
					let member = client.guild.array()[0].members.find(m => m.name === nameArgs && m.user.discriminator === nameArgs[1]);
					
					if (member === null || member === undefined) {
						msg.channel.send(`Couldn't find member ${args[0]}.`);
						return;
					}
					
					if (exports.isMuted(member.id)) {
						msg.channel.send(`Member ${member.user.username} is already muted.`);
						return;
					}
					
					const permanent = ags.length === 3;
					exports.mute(member.id, permanent, permanent ? args[2] : args[1], msg.author.id, permanent ? -0 : args[1]);
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
	fs.writeFileSync('./modules/moderation-commands/data.json');
	data = require('./data');
}

exports.isBanned = userId => {
	if (!data.hasOwnProperty(userId)) {
		return false;
	} else {
		for (var i = 0 ; i < data[userId].c.length; i++) {
			var entry = data[userId].current[i];
			
			if (entry.type !== 'TEMPBAN' || entry.type !== 'PERMBAN') {
				continue;
			}
			
			return true;
		}
		
		return false;
	}
};

exports.isMuted = userId => {
	if (data.hasOwnProperty(userId)) {
		return false;
	} else {
		for (var i = 0; i < data[userId].current.length; i++) {
			var entry = data[userId].current[i];
			
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

