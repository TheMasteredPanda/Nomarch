const readLine = require('readline');


var commands = [];

function onCommand(args, command) {
	if (args === undefined) {
		return;
	}
	
	if (args.length > 0 && command.hasOwnProperty('children')) {
		for (var cmd in command.children) {
			if (cmd.name !== args[0]) {
				continue;
			}
			
			args.shift();
			onCommand(args, cmd);
			return;
		}
		
		if (args[0] === 'usage') {
			console.log(command.usage);
			return;
		}
		
		if (args[0] === 'description') {
			console.log(command.description);
			return;
		}
	}
	
	if (args.length < command.arguments) {
		console.error('Not enough arguments, usage: ' + command.usage)
	}
	
	command.execute(args);
}

exports.init = (client, app) => {
	var rl = readLine.createInterface({
		input: process.stdin,
		output: process.stdout
	});
	
	rl.on('line', input => {
		if (input === undefined) {
			return;
		}
		
		if (commands === undefined || commands.length === 0 ) {
			return;
		}
		
		var args = input.split(' ');
		
		for (var cmd in commands) {
			if (cmd.name !== args[0]) {
				return;
			}
			
			args.shift();
			onCommand(args, cmd);
		}
	});
	
	rl.on('error', err => {
		console.error(err);
	})
};

exports.addCommand = cmd => {
	for (var command in commands) {
		if (command.name !== cmd.name) {
			continue;
		}
		
		console.error('Console command ' + command.name + ' is already in the console command map.');
		return;
	}
	
	commands.push(cmd);
};