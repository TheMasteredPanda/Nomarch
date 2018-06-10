const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');
const util = require('util');
const nomarchUtil = require('./modules/utilities/utility_commands');

var config = {
	apiKey: null,
	settings: {
		cmdChannel: null,
		cmdPrefix: "."
	}
};

var permissionManager;

if (fs.existsSync('./modules/permission-manager/permissions.js')) {
	permissionManager = require('./modules/permission-manager/permissions');
}

exports.fExists = util.promisify(fs.exists);

setTimeout(async () => {
	let exists = await exports.fExists('config.json', err => {
		if (err) console.error(err);
	});
	
	if (!exists) {
		console.log(`Doesn't exist.`);
		await fs.writeFile('config.json', JSON.stringify(config), err => {
			if (err) console.error(err);
			config = require('./config');
		})
	} else {
		config = require('./config');
	}
}, 100);

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}.`);
});

/**
 * The command map.
 * @type {*[]}
 */
commands = [
    {
        name: 'test',
        usage: '.test <command>',
		description: 'To test that the command is registered.',
		permission: 'nomarch.test',
		guildOnlyCommand: true,
        execute: (msg, args) => {
            msg.channel.send('Test complete.')
        },
    }
];

/**
 * Used to walk through a command tree and execute the correct
 * command, with the right amount of arguments.
 * @param msg - the msg sent.
 * @param args - the suspected arguments.
 * @param cmd - the root of the current iteration of the command tree.
 */
function onCommand(msg, args, cmd) {
	console.log(`Command Args: ${args}`);
	
	if (args[0].replace(config.settings.cmdPrefix, '') !== cmd.name) {
		console.log(`Is not command: ${cmd.name} .`);
		return;
	}
	
	if (permissionManager !== null && permissionManager != null && cmd.hasOwnProperty('permission')) {
		if (!permissionManager.hasPermission(msg.author.id, cmd.permission)) {
			console.log(`${msg.user.name} does not have permission ${cmd.permission} to invoke command ${cmd.usage}.`);
			return;
		}
	}
	
	console.log(`Is the command: ' ${cmd.name}.`);
	
	if (args.length > 1) {
		if (args[0] !== undefined) {
			if (args[1] === 'info') {
				const embed = nomarchUtil.embed();
				embed.setTitle(`Command information for ${cmd.name}.`);
				if (cmd.hasOwnProperty('usage')) embed.addField('Usage', cmd.usage, true);
				if (cmd.hasOwnProperty('description')) embed.addField('Description', cmd.description, true);
				let childCommands = [];
				
				if (cmd.hasOwnProperty('children')) {
					for (let key in cmd.children) {
						childCommands.push(cmd.children[key].name);
					}
				}
				if (cmd.hasOwnProperty('permission')) embed.addField('Permission Node', cmd.permission, true);
				if (childCommands.length !== 0) embed.addField('Children', childCommands.join(', '),);
				msg.channel.send(embed);
				return;
			}
			
			if (cmd.hasOwnProperty('children')) {
				for (let i = 0; i < cmd.children.length; i++) {
					let child = cmd.children[i];
					
					if (args[1] !== child.name) {
						continue;
					}
					
					args.shift();
					onCommand(msg, args, child);
					return;
				}
			}
		}
	}
	
	if (typeof cmd.execute !== 'function') {
		return;
	}
	
	args.shift();
	
	if (cmd.hasOwnProperty('arguments')) {
		if (args.length < cmd.arguments) {
			msg.channel.send('Not enough arguments were supplied for this command.');
			return;
		}
	}
	
	if (!msg.guild && (!cmd.hasOwnProperty('guildOnlyCommand') || cmd.guildOnlyCommand)) {
		nomarchUtil.sendError(msg.channel, msg.author, `Command ${cmd.name} os a guild only command.`);
		return;
	}
	
	console.log(`Executing command ${cmd.name} with args ${args}.`);
	cmd.execute(msg, args);
}

client.on('message', msg => {
	if (msg.content === undefined || msg.content.length === 0) {
		return;
	}
	
	console.log(`Message received: ${msg.content}`);
	
	if (!msg.content.startsWith(config.settings.cmdPrefix)) {
		console.log(`Message '${msg.content}' is not a command.`);
		return;
	}
	
	console.log(`Attempting to execute command ${msg.content}`);
	
	let args = msg.content.split(' ');
	
	for (let i = 0; i < commands.length; i++) {
	    let cmd = commands[i];
	    
	    if (args[0] !== config.settings.cmdPrefix + cmd.name) {
	        continue;
        }
        
        onCommand(msg, args, cmd);
    }
});

/**
 * To add a command to the command map.
 * @param cmd - command to add to the command map.
 */
exports.addCommand = cmd => {
  for (let i = 0; i < commands.length; i++) {
      if (commands[i].name === cmd.name) {
          console.error(`Could not add command ${cmd.name} as it already exists in the command map.`);
          return;
      }
  }
  
  console.log('Added command ' + cmd.name + '.');
  commands.push(cmd);
};


fs.readdir('./modules', async (error, list) => {
    for (let i = 0; i < list.length; i++) {
        let module = list[i];
        let dirStat = await fs.lstatSync('./modules/' + module);
        
        if (!dirStat.isDirectory()) {
        	continue;
		}
		
        let files = await fs.readdirSync('./modules/' + module);
	
		for (let j = 0; j < files.length; j++) {
			let entry = files[j];
		
			if (entry.split('.')[1] !== 'js') {
				console.log('File ' + entry + ' is not a module.');
				continue;
			}
			
			let jsModule = await require('./modules/' + module + '/' + entry);
		
			if (typeof jsModule.init !== 'function') {
				continue;
			}
		
			console.log(`Initiated module ${entry}.`);
			await jsModule.init(client, this);
		}
    }
});

function save() {
	setInterval(async () => {
		await fs.writeFile('./config.json', JSON.stringify(config), err => {
			if (err) throw err;
			config = require('./config');
		});
	});
}

/**
 * Set the command channel, the channel the bot would listen to.
 * @param channel - channel name.
 */
exports.setCommandChannel = channel => {
	config.settings.cmdChannel = channel;
	save();
};

/**
 * Set the command prefix.
 * @param channel - command prefix.
 */
exports.setCommandPrefix = channel => {
	config.settings.cmdPrefix = channel;
	save();
};

exports.getCommandPrefix = () => {
	return config.settings.cmdPrefix;
};

/**
 * Check if the channel is the command channel.
 * @param channel - channel name.
 * @returns {boolean} if true, yes, else false.
 */
exports.isCommandChannel = channel => {
	return channel.type === 'text' && channel.name === config.settings.cmdChannel;
};

setTimeout(async () => {
	await client.login(config.apiKey)
}, 150);
