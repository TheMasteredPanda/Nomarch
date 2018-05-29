const fs = require('fs');
const Discord = require('discord.js');
const consoleCommands = require('../console-commands/commands');

/**
 * Permission Manager Module.
 */

let permissionMap = null;
const discordUsernameRegex = /^[A-Za-z.\s]+#\d\d\d\d/g;
let discordClient = null;

exports.init = (client, app) => {
	discordClient = client;
	if (!fs.existsSync('./modules/permission-manager/permissions.json')) {
		console.log('Does not exist.');
		fs.writeFileSync('./modules/permission-manager/permissions.json', JSON.stringify({
			roles: {},
			users: {}
		}));
	}
	
	permissionMap = require('./permissions.json');
	console.log(JSON.stringify(permissionMap));
	
	app.addCommand({
		name: 'pem',
		usage: '.pem <command>',
		description: 'Parent command to the permission manager.',
		execute: null,
		children: [
			{
				name: 'info',
				usage: '.pem info <role name|username#discriminator>',
				arguments: 1,
				description: 'View all the permission manager information for that role.',
				execute: (msg, args) => {
					let permissions = [];
					let name = null;
					
					if (args[0].match(discordUsernameRegex)) {
						var argName = args[0].split('#');
						var user = discordClient.guilds.array()[0].members.find(u => u.name === argName[0] && u.user.discriminator === argName[1]);
						
						if (user === undefined) {
							msg.channel.send(`Could not find ${args[0]} in this guild.`);
							return;
						}
						
						permissions = permissionMap.users[user.id];
						name = user.name;
					} else {
						var role = discordClient.guilds.array()[0].roles.find(r => r.name === args[0]);
						
						if (role === undefined) {
							msg.channel.send(`Could not find role ${args[0]} in this guild.`);
							return;
						}
						
						if (!permissionMap.roles.hasOwnProperty(role.id)) {
							msg.channel.send(`Could not find role ${role.name} in the permissions map.`);
							return;
						} 
						
						permissions = permissionMap.roles[role.id];
						name = args[0];
					}
 				
					
					let embed = new Discord.RichEmbed();
					embed.setTitle(`Permissions for role ${name}.`);
					
					for (let i = 0; i < permissions.length; i++) {
						let permission = permissions[i];
						embed.addField(i, permission);
					}
					
					msg.channel.send(embed);
				}
			},
			{
				name: 'add',
				usage: '.pem add <role name|username#discriminator> <permission node>',
				arguments: 2,
				description: 'Add a permission to a role or user.',
				execute: (msg, args) => {
					if (!args[0].match(discordUsernameRegex)) {
						let role = discordClient.guilds.array()[0].roles.find(r => r.name === args[0]);
						
						if (role === undefined || role === null) {
							msg.channel.send(`Role ${args[0]} is not an actual role on this guild.`);
							return;
						}
	
						if (permissionMap.roles.hasOwnProperty(role.id) && permissionMap.roles[role.id].hasOwnProperty(args[1])) {
							msg.channel.send(`Role already has the permission node ${args[1]}.`);
							return;
						}
						
						exports.addRolePermission(role.id, args[1]);
						msg.channel.send(`Added permission node ${args[1]} to role ${args[0]}.`);
					} else {
						let name = args[0].split('#');
						let user = discordClient.guilds.array()[0].members.find(u => u.name === name[0] && u.user.discriminator === name[1]);
						
						if (user === undefined) {
							msg.channel.send(`User ${args[0]} was not found on this guild.`);
							return;
						}
						
						if (permissionMap.users.hasOwnProperty(user.id) && permissionMap.users[user.id].hasOwnProperty(args[1])) {
							msg.channel.send(`User ${args[0]} already has the permission node ${args[0]}`);
							return;
						}
						
						exports.addUserPermission(user.id, args[1]);
						msg.channel.send(`Add permission node ${args[1]} to user ${args[0]}`)
					}
				}
			},
			{
				name: 'remove',
				usage: '.pem remove <role name|username#discriminator> <permission name>',
				arguments: 2,
				description: 'Remove a permission from a role or user.',
				execute: (msg, args) => {
					if (!args[0].match(discordUsernameRegex)) {
						let role = discordClient.guilds.array()[0].roles.find(r => r.name === args[0]);
						
						if (role === undefined) {
							msg.channel.send(`Role ${args[0]} is not an actual role on this guild.`);
							return;
						}
						
						if (!permissionMap.roles.hasOwnProperty(role.id)) {
							msg.channel.send(`Role ${role.name} is not in the command map.`);
							return;
						}
						
						if (permissionMap.roles[role.id].hasOwnProperty(args[1])) {
							msg.channel.send(`Role does not have the permission node ${args[1]}.`);
							return;
						}
						
						exports.removeRolePermission(role.id, args[1]);
						msg.channel.send(`Removed permission node ${args[1]} to role ${args[0]}.`);
					} else {
						var name = args[0].split('#');
						var user = discordClient.guilds.array()[0].members.find(u => u.name === name[0] && u.user.discriminator === name[1]);
						
						if (user === undefined) {
							msg.channel.send(`User ${args[0]} was not found on this guild.`);
							return;
						}
						
						if (permissionMap.users[user.id].hasOwnProperty(args[1])) {
							msg.channel.send(`User ${args[0]} does not have the permission node ${args[0]}.`);
							return;
						}
						
						exports.removeUserPermission(user.id, args[1]);
						msg.channel.send(`Removed permission node ${args[1]} to user ${args[0]}.`)
					}
				}
			}
		]
	});
	
	consoleCommands.addCommand({
		name: 'pem',
		usage: 'pem <command>',
		description: 'Parent command for the command manager.',
		execute: null,
		children: [
			{
				name: 'info',
				usage: 'pem info <role name|user name#discriminator>',
				description: 'Show role and user information.',
				arguments: 1,
				execute: args => {
					if (args[0].match(discordUsernameRegex)) {
						let nameArgs = args[0].split('#');
						let member = client.guilds.array()[0].members.find(u => u.name === nameArgs[0] && u.user.discriminator === nameArgs[1]);
						
						if (user === undefined || user === null) {
							console.log(`Could not find member ${args[0]}.`);
							return;
						}
						
						if (!permissionMap.users.hasOwnProperty(member.id)) {
							console.log(`Could not find member ${member.name} in the permission map.`);
							return;
						}
						
						console.log(`Permissions for role ${args[0]}.`);
						permissionMap.users[member.id].forEach(p => '- ' + p);
					}  else {
						let role = client.guilds.array()[0].roles.find(r => r.name === args[0]);
						
						if (role === undefined || role === null) {
							console.log(`Can't find role ${args[0]}`);
							return;
						}
						
						if (!permissionMap.roles.hasOwnProperty(role.id)) {
							console.log("Role isn't in permission map.");
							return;
						}
						
						let permissions = permissionMap.roles[role.id];
						console.log(`Permissions for role ${args[0]}.`);
						permissions.forEach(p => console.log('- ' + p))
					}
				}
			},
			{
				name: 'add',
				usage: 'pem add <user name#discriminator|role name> <permission>',
				description: 'Add a permission node to a user or role.',
				arguments: 2,
				execute: args => {
					if (args[0].match(discordUsernameRegex)) {
						let nameArgs = args[0].split(' ');
						let member = client.guilds.array()[0].members.find(m => m.name === nameArgs[0] && m.user.discriminator === nameArgs[1]);
						
						if (member === undefined || member === null) {
							console.log(`Could not find member ${args[0]}.`);
							return;
						}
						
						if (!permissionMap.users.hasOwnProperty(member.id)) {
							console.log(`Could not find member ${member.name} in permission map.`);
							return;
						}
						
						if (permissionMap.users[member.id].hasOwnProperty(args[1])) {
							console.log(`Member ${member.name} already has the permission ${args[1]}`);
							return;
						}
						
						exports.addUserPermission(member.id, args[1]);
						console.log(`Added permission ${args[1]} to member ${args[0]}.`);
					} else {
						let role = client.guilds.array()[0].roles.find(r => r.name === args[0]);
						
						if (role === undefined || role === null) {
							console.log("Couldn't find role " + args[0] + " in guild.");
							return;
						}
						
						if (!permissionMap.roles.hasOwnProperty(role.id)) {
							console.log('Role is not in permissions map.');
							return;
						}
						
						if (permissionMap.roles[role.id].hasOwnProperty(args[1])) {
							console.log(`Role already has permission ${args[1]}`);
							return;
						}
						
						exports.addRolePermission(role.id, args[1]);
						console.log(`Added permission ${args[1]} to role ${args[0]}.`);
					}
				}
			},
			{
				name: 'remove',
				usage: 'pem remove <user name#descriminator| role name> <permission>',
				description: 'Remove a permission node from a user or role.',
				arguments: 2,
				execute: args => {
					if (args[0].match(discordUsernameRegex)) {
						let nameArgs = args[0].split('#');
						let member = client.guilds.array()[0].members.find(m => m.name === nameArgs[0] && m.user.discriminator === nameArgs[1]);
						
						if (member === undefined || member === null) {
							console.log(`Couldn't find member ${args[0]} in guild.`);
							return;
						}
						
						if (!permissionMap.users.hasOwnProperty(member.id)) {
							console.log("Can't find member in permission map.");
							return;
						}
						
						if (!permissionMap.users[member.id].hasOwnProperty(member.id)) {
							console.log(`Member ${member.name} does not have the permission ${args[1]}.`);
							return;
						}
						
						exports.removeUserPermission(member.id, args[1]);
						console.log(`Removed permission  ${args[1]} from ${args[0]}.`);
					} else {
						let role = client.guilds.array()[0].roles.find(r => r.name === args[0]);
						
						if (role === undefined || role === null) {
							console.log(`Can't find role ${args[0]} in guild.`);
							return;
						}
						
						if (!permissionMap.roles.hasOwnProperty(role.id)) {
							console.log("Can't find role in the permission map.");
							return;
						}
						
						if (permissionMap.roles[role.id].hasOwnProperty(args[1])) {
							console.log(`Role ${args[0]} doesn't have permission ${args[1]}.`);
							return;
						}
						
						exports.removeRolePermission(role.id, args[1]);
						console.log(`Remove permission ${args[1]} from role ${args[0]}`);
					}
				}
			}
		]
	})
};

/**
 * Save the permission map to the permission json file.
 */
function save() {
	console.log(JSON.stringify(permissionMap));
	
	setTimeout(async () => {
		await fs.writeFile('./modules/permission-manager/permissions.json', JSON.stringify(permissionMap), err => {
			if (err) console.error(err);
			permissionMap = require('./permissions.json');
		});
	}, 150);
}

/**
 * Check if a member has the permission.
 * @param userId - user id.
 * @param permission - permission.
 * @returns {boolean} - true if the user has the permission, else false.
 */
exports.hasPermission = (userId, permission) => {
	let guild = discordClient.guilds.array()[0];
	let member = guild.members.find(m => m.user.id === userId);
	
	if (!member) {
		return false;
	}
	
	if (guild.ownerID === userId || member.hasPermission('ADMINISTRATOR')) {
		return true;
	}
	
	if (permissionMap.users.hasOwnProperty(userId)) {
		return false;
	}
	
	for (const perm in permissionMap.users[userId]) {
		if (perm !== permission) {
			continue;
		}
		
		return true;
	}
	
	return false;
};

/**
 * Add a permission to the user.
 * @param userId - user id.
 * @param permission - permission.
 */
exports.addUserPermission = (userId, permission) => {
	if (!permissionMap.users.hasOwnProperty(userId)) {
		permissionMap.users[userId] = [];
	}
	
	if (permissionMap.users[userId].hasOwnProperty(permission)) {
		console.error(`Attempted to add permission ${permission} to user ${userId}, but the permission was already assigned to this user.`);
		return;
	}
	
	permissionMap.users[userId].push(permission);
	save();
};

/**
 * Add a permission to a role.
 * @param roleId - role id.
 * @param permission - permission.
 */
exports.addRolePermission = (roleId, permission) => {
	if (!permissionMap.roles.hasOwnProperty(roleId)) {
		permissionMap.roles[roleId] = [];
	}
	
	if (permissionMap.roles[roleId].hasOwnProperty(permission)) {
		console.error(`Attempted to add permission ${permission} to role ${roleId}, but the permission was already assigned to this role.`);
		return;
	}
	
	permissionMap.roles[roleId].push(permission);
	save();
};

/**
 * Remove a permission from the user.
 * @param userId - user.
 * @param permission - permission.
 */
exports.removeUserPermission = (userId, permission) => {
	if (!permissionMap.users.hasOwnProperty(userId)) {
		return;
	}
	
	if (!permissionMap.users[userId].hasOwnProperty(permission)) {
		return;
	}
	
	for (let i = 0; i < permissionMap.users[userId].length; i++) {
		let perm = permissionMap.users[userId][i];
		
		if (permission === perm) {
			const index = Math.floor(permissionMap.users[userId] / i);
			permissionMap.users[userId].splice(index, 1);
			
			if (permissionMap.users[userId].length === 0) {
				delete permissionMap[userId];
			}
			save();
			
			return;
		}
	}
};

/**
 * Remove a permission from the role.
 * @param roleId - role name.
 * @param permission - permission.
 */
exports.removeRolePermission = (roleId, permission) => {
	if (!permissionMap.roles.hasOwnProperty(roleId)) {
		console.log('Role id was not found in json object.');
		return;
	}
	
	for (let i = 0; i < permissionMap.roles[roleId].length; i++) {
		let perm = permissionMap.roles[roleId][i];
		
		if (permission === perm) {
			const index = Math.floor(permissionMap.roles[roleId] / i);
			permissionMap.roles[roleId].splice(index, 1);
			
			if (permissionMap.roles[roleId].length === 0) {
				delete permissionMap.roles[roleId];
			}
			
			save();
			return;
		}
	}
};

/**
 * Remove a user from the permission map.
 * @param userId - user.
 */
exports.removeUser = userId => {
	if (!permissionMap.users.hasOwnProperty(userId)) {
		return;
	}
	
	delete permissionMap.users[userId];
	save();
};

/**
 * Remove a role from the permission map.
 * @param roleId - role.
 */
exports.removeRole = roleId => {
	if (!permissionMap.roles.hasOwnProperty(roleId)) {
		return;
	}
	
	delete permissionMap.roles[roleId];
	save();
};

