const fs = require('fs');
const Discord = require('discord.js');

/**
 * Permission Manager Module.
 */

let permissionMap = null;

exports.init = (client, app) => {
	if (!fs.existsSync('./modules/permission-manager/permissions.json')) {
		console.log('Does not exist.');
		fs.writeFileSync('./modules/permission-manager/permissions.json', JSON.stringify({
			roles: {},
			users: {}
		}));
	}
	
	permissionMap = require('./permissions.json');
	
	app.addCommand({
		name: 'pem',
		usage: '.pem <command>',
		description: 'Parent command to the permission manager.',
		permission: 'nomarch.permissions.info',
		execute: null,
		children: [
			{
				name: 'info',
				usage: '.pem info <role name| user name>',
				arguments: 1,
				description: 'View all the permission manager information for that role.',
				execute: (msg, args) => {
					var permissions = null;
					var name = null;
					
					if (args[0].match(/^[A-Za-z.\s]+#\d\d\d\d/g)) {
						var argName = args[0].split('#');
						var user = msg.guild.members.values().find(u => u.name === argName[0] && u.user.discriminator === argName[1]);
						
						if (user === undefined) {
							msg.channel.send('Could not find ' + args[0] + ' in this guild.');
							return;
						}
						
						permissions = permissionMap.users[user.id];
						name = user.name;
					} else {
						var role = msg.guild.roles.values().find(r => r.name === args[0]);
						
						if (role === undefined) {
							msg.channel.send('Could not find role ' + args[0] + ' in this guild.');
							return;
						}
						
						permissions = permissionMap.roles[role.id];
						name = args[0];
					}
 				
					var embed = new Discord.RichEmbed();
					embed.setTitle('Permissions for role ' + name + '.');
					
					for (var i = 0; i < permissions.length; i++) {
						var permission = permissions[i];
						embed.addField(i, permission);
					}
					
					msg.channel.send(embed);
				}
			},
			{
				name: 'add',
				usage: '.pem add <role name|user name#discriminator> <permission node>',
				arguments: 2,
				description: 'Add a permission to a role or user.',
				execute: (msg, args) => {
					if (!args[0].match(/^[A-Za-z.\s]+#\d\d\d\d/g)) {
						var role = msg.guild.roles.values().find(r => r.name === args[0]);
						
						if (role === undefined) {
							msg.channel.send('Role ' + args[0] + ' is not an actual role on this guild.');
							return;
						}
	
						if (permissionMap.roles[role.id].hasOwnProperty(args[1])) {
							msg.channel.send('Role already has the permission node ' + args[1] + '.');
							return;
						}
						
						exports.addRolesPermission(role.id, args[1]);
						msg.channel.send('Added permission node ' + args[1] + ' to role ' + args[0] + '.');
					} else {
						var name = args[0].split('#');
						var user = msg.guild.members.values().find(u => u.name === name[0] && u.user.discriminator === name[1]);
						
						if (user === undefined) {
							msg.channel.send('User ' + args[0] + ' was not found on this guild.');
							return;
						}
						
						if (permissionMap.users[user.id].hasOwnProperty(args[1])) {
							msg.channel.send('User ' + args[0] + ' already has the permission node ' + args[0] + '.');
							return;
						}
						
						exports.addUserPermission(user.id, args[1]);
						msg.channel.send('Add permission node ' + args[1] + ' to user ' + args[0] + '.')
					}
				}
			},
			{
				name: 'remove',
				usage: '.pem remove <role name|user name#discriminator> <permission name>',
				arguments: 2,
				description: 'Remove a permission from a role or user.',
				execute: (msg, args) => {
					if (!args[0].match(/^[A-Za-z.\s]+#\d\d\d\d/g)) {
						var role = msg.guild.roles.values().find(r => r.name === args[0]);
						
						if (role === undefined) {
							msg.channel.send('Role ' + args[0] + ' is not an actual role on this guild.');
							return;
						}
						
						if (!permissionMap.roles[role.id].hasOwnProperty(args[1])) {
							msg.channel.send('Role does not have the permission node ' + args[1] + '.');
							return;
						}
						
						exports.removeRolePermission(role.id, args[1]);
						msg.channel.send('Removed permission node ' + args[1] + ' to role ' + args[0] + '.');
					} else {
						var name = args[0].split('#');
						var user = msg.guild.members.values().find(u => u.name === name[0] && u.user.discriminator === name[1]);
						
						if (user === undefined) {
							msg.channel.send('User ' + args[0] + ' was not found on this guild.');
							return;
						}
						
						if (permissionMap.users[user.id].hasOwnProperty(args[1])) {
							msg.channel.send('User ' + args[0] + ' does not have the permission node ' + args[0] + '.');
							return;
						}
						
						exports.removeUserPermission(user.id, args[1]);
						msg.channel.send('Removed permission node ' + args[1] + ' to user ' + args[0] + '.')
					}
				}
			}
		]
	});
};

/**
 * Save the permission map to the permission json file.
 */
function save() {
	setTimeout(async () => {
		await fs.writeFile('./modules/permission-manager/permissions.json', permissionMap);
		permissionMap = require('./permissions.json')
	}, 150);
}

/**
 * Check if a user has the permission.
 * @param user - user.
 * @param permission - permission.
 * @returns {boolean} - true if the user has the permission, else false.
 */
exports.hasPermission = (user, permission) => {
	if (user.guild.owner.id === user.id ) {
		return true;
	}
	
	
	for (var i = 0; i < user.roles.length; i++) {
		var role = user.roles[i];
		
		if (!permissionMap.roles.hasOwnProperty(role.name)) {
			continue;
		}
		
		return role.hasPermission('ADMINISTRATOR') || permissionMap.roles[role.name].hasOwnProperty(permission);
	}
	
	if (permissionMap === undefined) {
		console.log('Permission map is undefined.');
		return false;
	}
	
	console.log('Users is undefined, ' + JSON.stringify(permissionMap));
	
	
	if (permissionMap.users === undefined) {
		return false;
	}
	
	if (permissionMap.users.hasOwnProperty(user.id)) {
		var permUser = permissionMap.users[role.name];
		return permUser.hasOwnProperty(permission);
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
		console.error('Attempted to add permission ' + permission + ' to user ' + userId + ', but the permission was already assigned to this user.');
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
exports.addRolesPermission = (roleId, permission) => {
	if (!permissionMap.roles.hasOwnProperty(roleId)) {
		permissionMap.roles[roleId] = [];
	}
	
	if (permissionMap.roles[roleId].hasOwnProperty(permission)) {
		console.error('Attempted to add permission ' + permission + ' to role ' + role + ', but the permission was already assigned to this role.')
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
	
	for (var i = 0; i < permissionMap.users[userId].length; i++) {
		var perm = permissionMap.users[userId][i];
		
		if (permission === perm) {
			delete permissionMap.users[userId][i];
			save();
			return;
		}
	}
};

/**
 * Remove a permission from the role.
 * @param role - role name.
 * @param permission - permission.
 */
exports.removeRolePermission = (roleId, permission) => {
	if (!permissionMap.roles.hasOwnProperty(roleId)) {
		return;
	}
	
	if (!permissionMap.roles[roleId].hasOwnProperty(permission)) {
		return;
	}
	
	for (var i = 0; i < permissionMap.roles[roleId].length; i++) {
		var perm = permissionMap.roles[roleId][i];
		
		if (permission === perm) {
			delete permissionMap.roles[roleId][i];
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
 * @param role - role.
 */
exports.removeRole = roleId => {
	if (!permissionMap.roles.hasOwnProperty(roleId)) {
		return;
	}
	
	delete permissionMap.roles[roleId];
	save();
};

