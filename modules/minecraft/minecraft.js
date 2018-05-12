const Discord = require('discord.js');
const fs = require('fs');

/*
 * For all things pertaining to Minecraft.
 */

exports.init = (client, app) => {
	var dataDirectory = './modules/minecraft/';
	
	if (!fs.existsSync(dataDirectory + 'config.json')) {
		var data = {
			servers: [
				'mc.zoramagic.net',
				'mc.hypixel.net',
				'pvp.sc'
			]
		}
		
		fs.writeFileSync('config.json', JSON.stringify(data));
	}
	
	var config = require(dataDirectory + 'config.json');
	
	
};

