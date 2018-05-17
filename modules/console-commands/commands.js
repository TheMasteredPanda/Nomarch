const readLine = require('readline');


var commands = [
	{
		name: "shutdown",
		usage: "shutdown",
		description: "To shutdown the bot.",
		execute: args => {
			console.log('Shutting down.');
			process.exit();
		}
	}
];


/**
 * Used to walk through the console command map.
 * @param args - arguments of the command inputted.
 * @param cmd - the command.
 */
function onCommand(args, cmd) {
	if (args === undefined) {
		return;
	}
	
	console.log('Argument length: ' + args.length);
	
	if (args.length === 1) {
		if (args[0] === 'usage') {
			console.log(cmd.usage);
			return;
		}
		
		if (args[0] === 'description') {
			console.log(cmd.description);
			return;
		}
		
		if (cmd.hasOwnProperty('children')) {
			for (var j = 0; j < cmd.children.length; j++) {
				var child = cmd.children[j];
				console.log('Iterating over ' + JSON.stringify(child));
				
				if (args[0] !== child.name) {
					console.log('Argument ' + args[0] + ' is not ' + cmd.name + ' ' + child.name);
					continue;
				}
				
				args.shift();
				onCommand(args, child);
				return;
			}
		}
	}
	
	if (cmd.execute === undefined || typeof cmd.execute !== 'function') {
		return;
	}
	
	if (args.length < cmd.arguments) {
		console.error('Not enough arguments, usage: ' + cmd.usage);
		return;
	}
	
	cmd.execute(args);
}

exports.init = (client, app) => {
	var rl = readLine.createInterface({
		input: process.stdin,
		output: process.stdout
	});
	
	console.log('Created interface.');
	
	
	rl.on('line', input => {
		console.log('Line input: ' + input);
		
		if (input === undefined) {
			console.log('Input undefined.');
			return;
		}
		
		if (commands === undefined || commands.length === 0 ) {
			console.log('Commands undefined or empty.');
			return;
		}
		
		var args = input.split(' ');
		
		console.log('Arguments: ' + args);
		
		for (var i = 0; i < commands.length; i++) {
			var cmd = commands[i];
			console.log('Iterating over command: ' + JSON.stringify(cmd));
			
			if (args[0] !== cmd.name) {
				console.log('Command invoked is not command ' + cmd.name + '.');
				continue;
			}
			
			console.log('Command ' + cmd.name + ' invoked.');
			args.shift();
			onCommand(args, cmd);
		}
	});
	
	rl.on('error', err => {
		console.error(err);
	})
};

/**
 * Add a console command. If the console command name is already
 * being used in the command map,it will reject the command map.
 * @param cmd - the console command to add.
 */
exports.addCommand = cmd => {
	for (var i = 0; i < commands.length; i++) {
		var command = commands[i];
		
		if (command.name !== cmd.name) {
			continue;
		}
		
		console.error('Console command ' + command.name + ' is already in the console command map.');
		return;
	}
	
	commands.push(cmd);
};