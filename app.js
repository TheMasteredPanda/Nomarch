const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');
const config = require('./config.json');

client.on('ready', () => {
   console.log('Logged in as ' + client.user.tag + '.')
});

commands = [
    {
        name: 'test',
        usage: 'To test that the command is registered.',
        execute: msg => {
            msg.channel.send('Test complete.')
        },
    }
];

function onCommand(msg, args, cmd) {
	console.log('Command arguments: ' + args);
	
	if (args[0].replace('.', '') !== cmd.name) {
		console.log('Is not command: ' + cmd.name + '.');
		return;
	}
	
	console.log('Is the command: ' + cmd.name + '.');
	
	if (args.length > 1) {
		if (args[0] !== undefined) {
			if (args[1] === 'usage') {
				msg.channel.send(cmd.usage);
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
	
	console.log('Executing command ' + cmd.name + '.');
	cmd.execute(msg);
}

client.on('message', msg => {
	if (msg.content === undefined || msg.content.length === 0) {
		return;
	}
	
	console.log('Message received: ' + msg.content);
	
	if (!msg.content.startsWith('.')) {
		console.log('Message' + msg.content + ' is not a command.');
		return;
	}
	
	console.log('Message is a command.');
	
	var args = msg.content.split(' ');
	
	for (var i = 0; i < commands.length; i++) {
	    var cmd = commands[i];
	    
	    if (args[0].replace('.', '') !== cmd.name) {
	        console.log('Command ' + cmd.name + ' was not invoked.');
            continue;
        }
        
        console.log('Command ' + cmd.name + ' was invoked.');
		onCommand(msg, args, cmd);
    }
});

exports.addCommand = cmd => {
  for (var i = 0; i < commands.length; i++) {
      if (commands[i].name === cmd.name) {
          console.error('Could not add command ' + cmd.name + ' as it already exists in the command map.')
          return;
      }
  }
  
  console.log('Added command ' + cmd.name + '.');
  commands.push(cmd);
  console.log('Command map: ');
  
  for (var i = 0; i < commands.length; i++) {
      console.log(commands[i].name);
  }
};


fs.readdir('./modules', (error, list) => {
    for (var i = 0; i < list.length; i++) {
        var module = list[i];
        var dirStat = fs.lstatSync('./modules/' + module);
        
        if (!dirStat.isDirectory()) {
        	continue;
		}
        
        
        var files = fs.readdirSync('./modules/' + module);
	
		for (var j = 0; j < files.length; j++) {
			var entry = files[j];
		
			if (entry.split('.')[1] !== 'js') {
				console.log('File ' + entry + ' is not a module.');
				continue;
			}
		
		
			var jsModule = require('./modules/' + module + '/' + entry);
		
			if (typeof jsModule.init !== 'function') {
				console.error('Module ' + entry + ' did not have the init function. Could not initiate this module.');
				continue;
			}
		
			console.log('Initiated module ' + entry + '.');
			jsModule.init(client, this);
		}
    }
});

client.login(config.apiKey);
