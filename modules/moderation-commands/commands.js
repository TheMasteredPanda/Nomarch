const fs = require('fs');
const util = require('../utilities/utility_commands');
const nodeUtil = require('util');
const setImmediatePromise = nodeUtil.promisify(setImmediate);


var punishments = {};
const userRegex = /^[A-Za-z.\s]+#\d\d\d\d/g;
var discordClient;

exports.init = (client, app) => {
	discordClient = client;
	setTimeout(async () => {
		let exists = await app.fExists('./modules/moderation-commands/punishments.json');
		
		if (!exists) {
			await fs.writeFile('./modules/moderation-commands/punishments.json', JSON.stringify(punishments), err => {
				if (err) {
					console.error(err);
					return;
				}
				
				punishments = require('./punishments.json');
			})
		} else {
			punishments = require('./punishments.json');
		}
	}, 150);
	
	app.addCommand({
		name: 'mod',
		usage: `${app.getCommandPrefix()}mod <child command>`,
		description: 'Parent command of the moderation module.',
		execute: null,
		arguments: 2,
		children: [
			{
				name: 'ban',
				usage: `${app.getCommandPrefix()}mod ban <username#discriminator> <reason>`,
				description: 'Permanently ban a member from the guild.',
				execute: (msg, args) => {
					if (!args[0].match(userRegex)) {
						util.sendError(msg.channel, msg.author, `Couldn't find user ${args[0]}.`);
						return;
					}
					
					let nameArgs = args[0].split('#');
					let member = client.guilds.array()[0].members.find(m => m.user.username === nameArgs[0] && m.user.discriminator === nameArgs[1]);
					
					if (member === undefined || member === null) {
						util.sendError(msg.channel, msg.author, `Couldn't find member ${args[1]} in the guild.`);
						return;
					}
					
					if (isBanned(member.id)) {
						util.sendError(msg.channel, msg.author, `Member ${member.user.username} is already banned.`);
						return;
					}
					
					
					let clone = args.slice(0);
					clone.splice(clone.length / 1);
					let reason = clone.join(' ');
					
					let result = ban(true, {
						member: member,
						reason: reason,
						by: msg.author,
						at: Date.now()
					});
					
					
					if (result) {
						let embed = util.embed();
						embed.setTitle('Permanently banned member.');
						embed.addField('Member Banned', member.user.username);
						embed.addField('Reason', reason);
						msg.channel.send(embed);
					} else {
						util.sendError(msg.channel, msg.author, `Failed to ban ${member.user.username} for some reason.`);
					}
				}
			},
			{
				name: 'unban',
				usage: `${app.getCommandPrefix()}mod unban <username#discriminator>.`,
				description: 'To unban a member from the server.',
				arguments: 1,
				execute: (msg, args) => {
					if (!args[0].match(userRegex)) {
						util.sendError(msg.channel, msg.author, `Couldn't find user ${args[0]}.`);
						return;
					}
					
					let nameArgs = args[0].split('#');
					let member = client.guilds.array()[0].find(m => m.user.username === nameArgs[0] && m.user.discriminator === nameArgs[1]);
					
					if (member === undefined || member === null) {
						util.sendError(msg.channel, msg.author, `Couldn't find member ${args[0]} on the guild.`);
						return;
					}
					
					if (isBanned(member.id)) {
						util.sendError(msg.channel, msg.author, `${member.user.username} is not banned.`);
						return;
					}
					
					if (unban(member.id)) {
						util.send(msg.channel, msg.author, `Unbanned member ${member.user.username}.`);
					} else {
						util.sendError(msg.channel, msg.author, `Failed to unban ${member.user.username}`);
					}
				}
			}
		]
	})
};

function isBanned(memberId) {
	if (!punishments.hasOwnProperty(memberId)) {
		return false;
	}
	
	for (let entry in punishments[memberId].current) {
		if (entry.type === 'PERMBAN' || entry.type === 'TEMPBAN') {
			return true;
		}
	}
	
	return false;
}

function isMuted(memberId) {
	if (!punishments.hasOwnProperty(memberId)) {
		return false;
	}
	
	for (let entry in punishments[memberId].current) {
		if (entry.type === 'PERMMUTE' || entry.type === 'TEMPMUTE') {
			return true;
		}
	}
	
	return false;
}

function ban(permanent, info) {
	if (!punishments.hasOwnProperty(info.member.id)) {
		punishments[info.member.id] = {
			current: {},
			history: {}
		}
	}
	
	if (isBanned(info.member.id)) {
		return false;
	}
	
	
	let type = permanent ? 'PERMBAN' : 'TEMPBAN';
	
	let entry = {
		type: type,
		reason: info.reason,
		by: info.by,
		at: info.at,
	};
	
	if (!permanent) {
		entry.duration = info.duration;
	}
	
	punishments[info.member.id].current[punishments[info.member.id].length + 1] = entry;
	discordClient.guilds.array()[0].ban(info.member.user, {reason: info.reason}).then(() => save());
	return true;
}

function mute(permanent, info) {
	if (!punishments.hasOwnProperty(info.member.id)) {
		punishments[info.member.id] = {
			current: {},
			history: {}
		}
	}
	
	if (isMuted(info.member.id)) {
		return false;
	}
	
	let entry = {
		type: permanent ? 'PERMMUTE' : 'TEMPMUTE',
		reason: info.reason,
		by: info.by,
		at: info.at,
	};
	
	if (!permanent) {
		entry.duration = info.duration;
	}
	
	punishments[info.member.id].current[punishments[info.member.id].length + 1] = entry;
	save();
	return true;
}

function unban(id) {
	if (!isBanned(id)) {
		return false;
	}
	
	let entry;
	let position;
	
	for (let i = 0; i < punishments[id].current.length; i++) {
		let e = punishments[id].current[i];
		
		if (e.type === 'PERMBAN' || e.type === 'TEMPBAN') {
			entry = e;
			position = i;
		}
	}
	
	if (entry === undefined || entry === null) {
		return false;
	} 
	
	let user = discordClient.guilds.array()[0].fetchBans().find(u => u.id === id);
	
	if (user === undefined || user === null) {
		return false;
	}
	
	punishments[id].current.splice(punishments[id].current.length / position);
	punishments[id].history.push(entry); //TODO add various attributes, like if the ban ended prematurely, the date that it ended, etc.
	discordClient.guilds.array()[0].unban(id) //TODO add a reason?
}

function unmute(id) {
	if (!isMuted(id)) {
		return false;
	}
	
	let entry;
	let position;
	
	for (let i = 0; i < punishments[id].current.length; i++) {
		let e = punishments[id].current[i];
		
		if (e.type === 'PERMMUTE' || e.type === 'TEMPMUTE') {
			entry = e;
			position = i;
		}
	}
	
	if (entry === undefined || entry === null) {
		return false;
	}
	
	let user = discordClient.guilds.array()[0].fetchBans().find(u => u.id === id);
	
	if (user === undefined || user === null) {
		return false;
	}
	
	punishments[id].current.splice(punishments[id].current.length / position);
	punishments[id].history.push(entry); //TODO add various attributes, like if the ban ended prematurely, the date that it ended, etc.
}

function save() {
	setTimeout(async () => {
		await fs.writeFile('./modules/moderation-commands/punishments.json', JSON.stringify(punishments), err => {
			if (err) console.error(err);
			punishments = require('./punishments.json');
		})
	}, 150)
}