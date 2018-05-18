const fs = require('fs');

/**
 * Permission Manager Module.
 */

var permissionMap;
var client;

exports.init = (client, app) => {
	this.client = client;
	if (!fs.existsSync('./modules/permission-manager/permissions.json')) {
		setTimeout(async () => {
			if (!await fs.exists()) {
				await fs.writeFile('./modules/permission-manager/permissions.json', {
					roles: {},
					users: {}
				});
			}
		}, 100)
	}
	
	permissionMap = require('./permission');
};

/**
 * Save the permission map to the permission json file.
 */
function save() {
	setTimeout(async () => {
		await fs.writeFile('./modules/permission-manager/permissions.json', permissionMap);
	}, 150);
}

/**
 * Check if a user has the permission.
 * @param user - user.
 * @param permission - permission.
 * @returns {boolean} - true if the user has the permission, else false.
 */
function hasPermission(user, permission) {
	for (var i = 0; i < user.roles.values().length; i++) {
		var role = user.roles;
		
		if (!permissionMap.roles.hasOwnProperty(role.name)) {
			continue;
		}
		
		return permissionMap.roles[role.name].hasOwnProperty(permission);
	}
	
	if (permissionMap.users.hasOwnProperty(user.id)) {
		var permUser = permissionMap.users[role.name];
		return permUser.hasOwnProperty(permission);
	}
	
	return false;
}

/**
 * Add a permission to the user.
 * @param userId - user id.
 * @param permission - permission.
 */
function addUserPermission(userId, permission) {
	if (!permissionMap.users.hasOwnProperty(userId)) {
		permissionMap.users[userId] = [];
	}
	
	if (permissionMap.users[userId].hasOwnProperty(permission)) {
		console.error('Attempted to add permission ' + permission + ' to user ' + userId + ', but the permission was already assigned to this user.')
		return;
	}
	
	permissionMap.users[userId][permissionMap.users[userId].length + 1] = permission;
	save();
}

/**
 * Add a permission to a role.
 * @param role - role name.
 * @param permission - permission.
 */
function addRolesPermisson(role, permission) {
	if (!permissionMap.roles.hasOwnProperty(role)) {
		permissionMap.roles[role] = [];
	}
	
	if (permissionMap.roles[role].hasOwnProperty(permission)) {
		console.error('Attempted to add permission ' + permission + ' to role ' + role + ', but the permission was already assigned to this role.')
		return;
	}
	
	permissionMap.roles[role][permissionMap.roles[role] + 1] = permission;
	save();
}

/**
 * Remove a permission from the user.
 * @param userId - user.
 * @param permission - permission.
 */
function removeUserPermission(userId, permission) {
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
}

/**
 * Remove a permission from the role.
 * @param role - role name.
 * @param permission - permission.
 */
function removeRolePermission(role, permission) {
	if (!permissionMap.roles.hasOwnProperty(role)) {
		return;
	}
	
	if (!permissionMap.roles[role].hasOwnProperty(permission)) {
		return;
	}
	
	for (var i = 0; i < permissionMap.roles[role].length; i++) {
		var perm = permissionMap.roles[role][i];
		
		if (permission === perm) {
			delete permissionMap.roles[role][i];
			save();
			return;
		}
	}
}

/**
 * Remove a user from the permission map.
 * @param userId - user.
 */
function removeUser(userId) {
	if (!permissionMap.users.hasOwnProperty(userId)) {
		return;
	}
	
	delete permissionMap.users[userId];
	save();
}

/**
 * Remove a role from the permission map.
 * @param role - role.
 */
function removeRole(role) {
	if (!permissionMap.roles.hasOwnProperty(role)) {
		return;
	}
	
	delete permissionMap.roles[role];
	save();
}

