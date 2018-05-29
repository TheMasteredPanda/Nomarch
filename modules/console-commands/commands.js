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
	
	if (args.length >= 1) {
		if (args[0] === 'usage') {
			console.log(cmd.usage);
			return;
		}
		
		if (args[0] === 'description') {
			console.log(cmd.description);
			return;
		}
		
		if (cmd.hasOwnProperty('children')) {
			for (let j = 0; j < cmd.children.length; j++) {
				let child = cmd.children[j];
				
				if (args[0] !== child.name) {
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
		console.error(`Not enough arguments, usage: ${cmd.usage}`);
		return;
	}
	
	cmd.execute(args);
}

exports.init = (client, app) => {
	let rl = readLine.createInterface({
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
		
		let args = input.split(' ');
		
		for (let i = 0; i < commands.length; i++) {
			let cmd = commands[i];
			
			if (args[0] !== cmd.name) {
				continue;
			}
			
			args.shift();
			onCommand(args, cmd);
		}
	});
	
	rl.on('error', err => {
		console.error(err);
	});
};

/**
 * Add a console command. If the console command name is already
 * being used in the command map,it will reject the command map.
 * @param cmd - the console command to add.
 */
exports.addCommand = cmd => {
	for (let i = 0; i < commands.length; i++) {
		let command = commands[i];
		
		if (command.name !== cmd.name) {
			continue;
		}
		
		console.error(`Console command ${command.name} is already in the console command map.`);
		return;
	}
	
	commands.push(cmd);
};