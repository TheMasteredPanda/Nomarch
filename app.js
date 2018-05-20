const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');
const config = require('./config.json');
var permissionManager;

if (fs.existsSync('./modules/permission-manager/permissions.js')) {
	permissionManager = require('./modules/permission-manager/permissions');
}

client.on('ready', () => {
   console.log('Logged in as ' + client.user.tag + '.')
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
	console.log('Command arguments: ' + args);
	
	if (args[0].replace('.', '') !== cmd.name) {
		console.log('Is not command: ' + cmd.name + '.');
		return;
	}
	
	if (permissionManager !== null && cmd.hasOwnProperty('permission')) {
		if (!permissionManager.hasPermission(msg.member, cmd.permission)) {
			msg.channel.send('You do not have permission ' + cmd.permission + ' to invoke command ' + cmd.usage + '.');
			return;
		}
	}
	
	console.log('Is the command: ' + cmd.name + '.');
	
	if (args.length > 1) {
		if (args[0] !== undefined) {
			if (args[1] === 'usage') {
				const embed = new Discord.RichEmbed();
				embed.addField('Command Usage:', cmd.usage);
				msg.channel.send(embed);
				return;
			}
			
			if (args[1] === 'desc' || args[1] === 'description') {
				const embed = new Discord.RichEmbed();
				embed.addField('Command Description:', cmd.description);
				msg.channel.send(embed);
				return;
			}
			
			if (cmd.hasOwnProperty('children')) {
				for (var i = 0; i < cmd.children.length; i++) {
					var child = cmd.children[i];
					
					if (args[1] !== child.name) {
						console.log('Child command ' + cmd.name + ' ' + child.name + ' is not the command that was invoked.');
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
	
	console.log('Executing command ' + cmd.name + ' with args ' + args + '.');

	cmd.execute(msg, args);
}

client.on('message', msg => {
	if (msg.content === undefined || msg.content.length === 0) {
		return;
	}
	
	console.log('Message received: ' + msg.content);
	
	if (!msg.content.startsWith('.')) {
		console.log('Message "' + msg.content + '" is not a command.');
		return;
	}
	
	console.log('Attempting to execute command ' + msg.content);
	
	var args = msg.content.split(' ');
	
	for (var i = 0; i < commands.length; i++) {
	    var cmd = commands[i];
	    
	    if (args[0] !== '.' + cmd.name) {
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
  for (var i = 0; i < commands.length; i++) {
      if (commands[i].name === cmd.name) {
          console.error('Could not add command ' + cmd.name + ' as it already exists in the command map.')
          return;
      }
  }
  
  console.log('Added command ' + cmd.name + '.');
  commands.push(cmd);
};


fs.readdir('./modules', async (error, list) => {
    for (var i = 0; i < list.length; i++) {
        var module = list[i];
        var dirStat = await fs.lstatSync('./modules/' + module);
        
        if (!dirStat.isDirectory()) {
        	continue;
		}
		
        var files = await fs.readdirSync('./modules/' + module);
	
		for (var j = 0; j < files.length; j++) {
			var entry = files[j];
		
			if (entry.split('.')[1] !== 'js') {
				console.log('File ' + entry + ' is not a module.');
				continue;
			}
			
			console.log(entry);
		
		
			var jsModule = await require('./modules/' + module + '/' + entry);
		
			if (typeof jsModule.init !== 'function') {
				console.error('Module ' + entry + ' did not have the init function. Could not initiate this module.');
				continue;
			}
		
			console.log('Initiated module ' + entry + '.');
			await jsModule.init(client, this);
		}
    }
});

setTimeout(async () => {
	await client.login(config.apiKey)
}, 150);
