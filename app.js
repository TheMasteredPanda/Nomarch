const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');

client.on('ready', () => {
   console.log('Logged in as ' + client.user.tag + '.')
});

commands = [
    {
        name: 'test',
        usage: 'To test that the command is registered.',
        arguments: 0,
        execute: msg => {
            msg.channel.send('Test complete.')
        },
        children: [
            {
                name: 'me',
                usage: 'A test command to test that child commands are supported.',
                arguments: 0,
                execute: msg => {
                  msg.channel.send("Command '.test me' worked.");
                },
                children: [
                    {
                        name: '2',
                        usage: 'To check if a child of a child works.',
                        arguments: 0,
                        execute: msg => {
                            msg.channel.send('It works.')
                        },
                        children: [
                            {
                                name: 'works',
                                usage: 'Still checking.',
                                arguments: 0,
                                execute: msg => {
                                    msg.channel.send('Still works.')
                                }
                            }
                        ]
					}
                ]
            }
        ],
    }
];

function onCommand(msg, args, cmd) {
	console.log('Command arguments ' + args);
	
	if (args[0].replace('.', '') !== cmd.name) {
		console.log('Is not command ' + cmd.name + '.');
		return;
	}
	
	console.log('Is the command ' + cmd.name + '.');
	
	if (args.length > 0) {
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
	
	console.log('Executing command ' + cmd.name + '.');
	cmd.execute(msg);
}

client.on('message', msg => {
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
        var entry = list[i];
        console.log('Iterating on file ' + entry);
        
        if (entry.split('.')[1] !== 'js') {
            console.log('File ' + entry + ' is not a module.');
            continue;
        }
        
        var module = require('./modules/' + entry);
        
        if (typeof module.init !== 'function') {
            console.error('Module ' + entry + ' did not have the init function. Could not initiate this module.');
            continue;
        }
        
        console.log('Initiated module ' + entry + '.');
        module.init(client, this);
    }
});


client.login('NDQyNjMxNTk5MTM4NTM3NDcy.DdBoWQ.hkqAWYZ30eoYiinVqgyF_ioKPmE');
