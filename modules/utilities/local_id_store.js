const fs = require('fs');

/**
 * A small utility module for storing a username + discriminator of a person under their id.
 *
 * This is primarily meant for the punishment system history lookup function.
 * @type {{}}
 */

var cache = {};

exports.init = (client, app) => {
	setTimeout(async () => {
		let exists = await app.fExists('./modules/utilities/cache.json');
		
		if (!exists) {
			await fs.writeFile('./modules/utilities/cache.json', JSON.stringify(cache), err => {
				if (err) console.error(err);
				
				cache = require('./cache');
			});
		} else {
			cache = require('./cache');
		}
		
	}, 150);
	
	client.on('ready', () => {
		client.guilds.array()[0].members.forEach(m => {
			if (!exports.get(m.user.id)) {
				cache[m.user.id] = [m.user.tag];
			}
		});
		
	});
	
	setInterval(async () => {
		await fs.writeFile('./modules/utilities/cache.json', JSON.stringify(cache), err => {
			if (err) console.error(err);
			console.log('Saved id cache.');
		});
	}, 30000);
	
	client.on('guildMemberAdd', member => {
		if (!cache.hasOwnProperty(member.user.id)) {
			cache[member.user.id] = [member.user.tag];
			console.log(`Added user ${member.user.tag} to the cache.`)
		}
	});
	
	client.on('userUpdate', (oldUser, newUser) => {
		if (!cache[oldUser.id].hasOwnProperty(newUser.tag)) {
			cache[oldUser.id].push(newUser.tag);
			console.log(`Updated user ${newUser.tag} in the cache.`)
		}
	});
};



/**
 * Get the array of names, and discriminators, stored.
 * @param id
 * @returns {*}
 */
exports.get = id => {
	if (!cache.hasOwnProperty(id)) {
		return null;
	}
	
	return cache[id];
};

exports.getID = tag => {
	for (let key in cache) {
		
		for (let i = 0; i < cache[key].length; i++) {
			let entry = cache[key][i];
			
			if (entry === tag) {
				console.log(`Key ${key}.`);

				return key;
			}
		}
	}
	
	return null;
};