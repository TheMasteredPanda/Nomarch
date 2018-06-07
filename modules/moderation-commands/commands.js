const fs = require('fs');
const util = require('../utilities/utility_commands');
var idCache;
var punishments = {};
const userRegex = /^[A-Za-z.\s]+#\d\d\d\d/g;
var discordClient;

exports.init = (client, app) => {
	discordClient = client;
	
	if (fs.existsSync('./modules/utilities/local_id_store.js')) {
		idCache = require('../utilities/local_id_store');
	}
	
	setTimeout(async () => {
		let exists = await app.fExists('./modules/moderation-commands/punishments.json');
		
		if (!exists) {
			await fs.writeFile('./modules/moderation-commands/punishments.json', JSON.stringify(punishments), err => {
				if (err) console.error(err);
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
				permission: 'nomarch.mod.ban',
				execute: (msg, args) => {
					if (!args[0].match(userRegex)) {
						util.sendError(msg.channel, msg.author, `Couldn't find user ${args[0]}.`);
						return;
					}
					
					let nameArgs = args[0].split('#');
					let member = client.guilds.array()[0].members.find(m => m.user.username === nameArgs[0] && m.user.discriminator === nameArgs[1]);
					
					if (member === undefined || member === null) {
						util.sendError(msg.channel, msg.author, `Couldn't find member ${args[0]} in the guild.`);
						return;
					}
					
					if (isBanned(member.id)) {
						util.sendError(msg.channel, msg.author, `Member ${args[0]} is already banned.`);
						return;
					}
					
					let clone = args.slice(0);
					clone.shift();
					let reason = clone.join(' ');
					
					let result = ban(true, {
						member: member,
						reason: reason,
						by: msg.author.id,
						at: Date.now()
					});
					
					if (result) {
						let embed = util.embed();
						embed.setTitle('Permanently banned member.');
						embed.addField('Member Banned', args[0]);
						if (reason !== undefined && reason !== null && reason !== "") embed.addField('reason', reason);
						msg.channel.send(embed);
					} else {
						util.sendError(msg.channel, msg.author, `Failed to ban ${args[0]} for some reason.`);
					}
				}
			},
			{
				name: 'unban',
				usage: `${app.getCommandPrefix()}mod unban <username#discriminator>`,
				description: 'To unban a member from the server.',
				permission: 'nomarch.mod.unban',
				arguments: 1,
				execute: (msg, args) => {
					if (!args[0].match(userRegex)) {
						util.sendError(msg.channel, msg.author, `Couldn't find user ${args[0]}.`);
						return;
					}
					
					let nameArgs = args[0].split('#');
					
					setTimeout(async () => {
						let bans = await msg.guild.fetchBans();
						
						let user = await bans.find(u => u.username === nameArgs[0] && u.discriminator === nameArgs[1]);
						let id = idCache.getID(args[0]);
						
						if ((user === null || user === undefined) && id === null) {
							util.sendError(msg.channel, msg.author, `Couldn't find ${args[0]} in the ban list on this guild.`);
							return true;
						}
						
						if (id === null) {
							id = user.id;
						}
						
						if (!isBanned(id)) {
							util.sendError(msg.channel, msg.author, `${user.username} is not banned.`);
							return;
						}
						
						if (await unban(id)) {
							util.send(msg.channel, msg.author, `Unbanned member ${args[0]}.`);
						} else {
							util.sendError(msg.channel, msg.author, `Failed to unban ${user[0]}.`);
						}
					}, 150);
				}
			},
			{
				name: 'info',
				usage: `${app.getCommandPrefix()}mod info <username#discriminator>`,
				description: 'View the punishment record of a member.',
				permission: 'nomarch.mod.info',
				arguments: 1,
				execute: (msg, args) => {
					if (!args[0].match(userRegex)) {
						util.sendError(msg.channel, msg.author, `Couldn't find user ${args[0]}.`);
						return;
					}
					
					let nameArgs = args[0].split('#');
					let user = discordClient.guilds.array()[0].members.find(m => m.user.username === nameArgs[0] && m.user.discriminator === nameArgs[1]);
					let id = idCache.getID(args[0]);
					
					if ((user === undefined || user === null) && id === null) {
						util.sendError(msg.channel, msg.author, `Couldn't find ${args[0]} in the guild.`);
						return;
					}
					
					if (id === null) {
						id = user.id;
					}
					
					if (!punishments.hasOwnProperty(id)) {
						util.sendError(msg.channel, msg.author, `User ${args[0]} hasn't got a punishment record.`);
						return;
					}
					
					let embed = util.embed();
					embed.setTitle(`Punishment history of ${args[0]}.`);
					
					if (punishments[id].current.length !== 0) {
						for (let i = 0; i < punishments[id].current.length; i++) {
							let entry = punishments[id].current[i];
							embed.addField(`Current Punishment No. ${i}.`, `Type: ${entry.type}\nReason: ${entry.reason}\nBy: ${idCache.get(entry.by)[0]}\nPunished On: ${new Date(entry.at)}.`);
						}
					}
					
					if (punishments[id].history.length !== 0) {
						for (let i = 0; i < punishments[id].history.length; i++) {
							let entry = punishments[user.id].history[i];
							embed.addField(`Past Punishment No. ${i}.`, `Type: ${entry.type}\nReason: ${entry.reason}\nBy: ${idCache.get(entry.by)[0]}\nPunished On: ${new Date(entry.at)}.`);
						}
					}
					
					if (embed.fields.length === 0) {
						util.sendError(msg.channel, msg.author, `${args[0]} does not have a punishment record.`);
						return;
					}
					
					msg.channel.send(embed);
				}
			}
		]
	})
};

function isBanned(memberId) {
	if (!punishments.hasOwnProperty(memberId)) {
		return false;
	}
	
	for (let i = 0; i < punishments[memberId].current.length; i++) {
		let entry = punishments[memberId].current[i];
		
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
	
	for (let i = 0; i < punishments[memberId].current.length; i++) {
		let entry = punishments[memberId].current[i];
		
		if (entry.type === 'PERMMUTE' || entry.type === 'TEMPMUTE') {
			return true;
		}
	}
	
	return false;
}

function ban(permanent, info) {
	if (!punishments.hasOwnProperty(info.member.id)) {
		punishments[info.member.id] = {
			current: [],
			history: []
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
	
	
	punishments[info.member.id].current.push(entry);
	discordClient.guilds.array()[0].ban(info.member.user, {reason: info.reason}).then(() => save());
	return true;
}

function mute(permanent, info) {
	if (!punishments.hasOwnProperty(info.member.id)) {
		punishments[info.member.id] = {
			current: [],
			history: []
		}
	}
	
	if (isMuted(info.member.id)) {
		return false;
	}
	
	
	let type = permanent ? 'PERMMUTE' : 'TEMPMUTE';
	
	let entry = {
		type: type,
		reason: info.reason,
		by: info.by,
		at: info.at,
	};
	
	if (!permanent) {
		entry.duration = info.duration;
	}
	
	
	punishments[info.member.id].current.push(entry);
	save();
	return true;
}

async function unban(id) {
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
			break;
		}
	}
	
	if (entry === undefined || entry === null) {
		return false;
	}
	
	console.log(`Position ${position}.`);
	
	/*let bans = await discordClient.guilds.first().fetchBans();
	let user = await bans.get(id);
	
	if (user === undefined || user === null) {
		console.log('User is either null or undefined.');
		return false;
	}*/
	
	
	await punishments[id].current.splice(Math.floor(punishments[id].current / position), 1);
	console.log(`Current punishments of ${id}: ${JSON.stringify(punishments[id].current)}`);
	await punishments[id].history.push(entry); //TODO add various attributes, like if the ban ended prematurely, the date that it ended, etc.
	/*await discordClient.guilds.first().unban(id).then(() => {
		console.log(`Unbanned member ${args[0]}.`);
		save();
	});*/ //TODO add a reason?
	await save();
	return true;
}

async function unmute(id) {
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
	
	let user = await discordClient.guilds.array()[0].fetchBans().get(id);
	
	if (user === undefined || user === null) {
		return false;
	}
	
	await punishments[id].current.splice(Math.floor(punishments[id].current.length / position));
	await punishments[id].history.push(entry); //TODO add various attributes, like if the ban ended prematurely, the date that it ended, etc.
	return true;
}

function save() {
	console.log(`Saving punishment data: ${JSON.stringify(punishments, util.censor(punishments))}`);
	
	setTimeout(async () => {
		await fs.writeFile('./modules/moderation-commands/punishments.json', JSON.stringify(punishments), err => {
			if (err) console.error(err);
			punishments = require('./punishments.json');
		})
	}, 150)
}