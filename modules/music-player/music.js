const ytdl = require('ytdl-core');
const Discord = require('discord.js');
const fs = require('fs');
const consoleModule = require('../console-commands/commands');

var info = {
	playing: false,
	channel: null,
	queue: []
};

var config = {
	channel: null
};

var consoleSongEntry = 'Title: {0}\nUploaded By: {1}\nAdded By: {2}, Duration: {3}\n';

function finish(dispatcher) {
	info.queue.shift();

	console.log(JSON.stringify(info));
	info.playing = false;
	if (info.queue.length === 0) {
		info.queue = [];

		
		setTimeout(() => {
			if (!info.playing) {
				dispatcher.player.voiceConnection.channel.leave();
				delete info.channel;
			}
		}, 240000);
	} else {
		setTimeout(async () => {
			await play(info.queue[0], { seek: 0, volume: 1 }, dispatcher.player.voiceConnection)
		}, 150)
	}
}

async function play(entry, settings, connection) {
	if (!info.playing) {
		if (entry === undefined) {
			console.log('Music entry given was undefined.');
			return;
		}
		
		const stream = await ytdl(entry.url, { filter: 'audioonly'});
		const dispatcher = await connection.playStream(stream, settings);
		console.log(`Playing song ${entry.title}`);
		
		dispatcher.on('end', () => {
			finish(dispatcher);
		});
		
		info.playing = true;
	}
}

exports.init = (client, app) => {
	setTimeout(async () => {
		let exists = await fs.exists('./modules/music-player/config.json', err => {
			if (err) throw err;
		});
		
		if (!exists) {
			await fs.writeFile('./modules/music-player/config.json', err => {
				if (err) throw err;
				console.log('Created music config.');
				config = require('./config');
			})
		}
	}, 150);
	
	
	app.addCommand({
		name: 'music',
		usage: 'Play a song in a channel.',
		execute: null,
		children: [
			{
				name: 'queue',
				usage: '.music queue <url or video id>.',
				description: 'Queue music for the bot to play.',
				permission: 'nomarch.music.queue',
				execute: (msg, args) => {
					if (args.length === 0) {
						if (msg.member.voiceChannel.name !== config.channel) {
							return;
						}
						
						if (!info.channel) {
							msg.channel.send('No queue has been formed for this guild.');
							return;
						}
						
						let embed = new Discord.RichEmbed();
						
						if (info.queue.length === 0) {
							msg.channel.send('No queue has been formed for this guild.');
							return;
						}
						
						for (let i = 0; i < info.queue.length; i++) {
							let entry = info.queue[i];
							embed.addField('Song ' + i, `Title: ${entry.title}\nDuration: ${entry.duration}\nUploaded By: ${entry.ytChannel}\nAdded By: ${entry.addedBy}.`, true);
						}
						
						msg.channel.send(embed);
						return;
					}
					
					if (!msg.channel) {
						msg.channel.send('I must be joined to a channel before queuing a song.');
					} else {
						if (!msg.guild) {
							return;
						}
						
						if (!msg.member.voiceChannel) {
							msg.channel.send('You must be in the voice channel when adding new songs.');
							return;
						}
						
						if (info.channel !== msg.member.voiceChannel.name) {
							msg.channel.send(`You're not in the same voice channel as the bot, ${msg.author.tag}.`);
							return;
						}
						
						
						let url = args[0].includes('://') ? args[0] : 'https://www.youtube.com/watch?v=' + args[0];
						
						let songEntry = {
							url: url,
							addedBy: msg.author.tag
						};
						
						console.log('Adding your song, ' + msg.author.tag + '.');
						
						ytdl.getInfo(args[0], async (err, ytInfo) => {
							if (err) {
								console.error(err.message);
								msg.channel.send(err.message);
								return;
							}
							
							console.log(JSON.stringify(ytInfo));
							
							songEntry.title = ytInfo.title;
							songEntry.ytChannel = ytInfo.author.user;
							songEntry.duration = ytInfo.length_seconds;
							await play(songEntry, { seek: 0, volume: 1}, msg.member.voiceChannel.connection);
							info.queue.push(songEntry);
							msg.channel.send(`Added your song, ${msg.author.tag}.`);
						});
					}
				}
			},
			{
				name: 'join',
				usage: '.music join',
				description: "Command the bot to join the channel you're in.",
				permission: 'nomarch.music.join',
				execute: (msg, args) => {
					if (msg.member.voiceChannel.name !== config.channel) {
						return;
					}
					
					if (!msg.member.voiceChannel) {
						msg.channel.send('You must be in a voice channel for me to join.');
						return;
					}
					
					if (info.channel != null && info.channel !== msg.member.voiceChannel.name) {
						msg.channel.send('I am not serving this channel as I am already serving tunes in another channel.');
						return;
					}
					
					if (info.channel != null && info.channel === msg.member.voiceChannel.name) {
						msg.channel.send(`Already joined channel ${info.channel}.`);
						return;
					}
					
					msg.member.voiceChannel.join().then(c => msg.channel.send('Joined voice channel.'));
					info.channel = msg.member.voiceChannel.name;
				}
			},
			{
				name: 'leave',
				usage: '.mod leave',
				description: 'Command the bot to leave the channel is it in.',
				permission: 'nomarch.music.leave',
				execute: (msg, args) => {
					if (msg.member.voiceChannel.name !== config.channel) {
						return;
					}
					
					if (!info.channel) {
						msg.channel.send('I am not serving tunes to anyone at this moment in time.');
						return;
					}
					
					delete info.channel;
					msg.member.voiceChannel.leave();
					msg.channel.send('Left voice channel.');
				}
			},
			{
				name: 'pause',
				usage: '.music pause',
				description: 'Pause the music the bot is serving.',
				permission: 'nomarch.music.pause',
				execute: (msg, args) => {
					if (msg.member.voiceChannel.name !== config.channel) {
						return;
					}
					
					if (!info.channel) {
						msg.channel.send('I am not serving tunes to any channel in this guild at the moment.');
					} else {
						if (info.channel && msg.member.voiceChannel.name !== info.channel) {
							msg.channel.send('You must be in the same voice channel in order to pause the music.');
							return;
						}
						
						const dispatcher = msg.member.voiceChannel.connection.dispatcher;
						
						if (dispatcher.paused) {
							msg.channel.send('Music is already paused.');
							return;
						}
						
						dispatcher.pause();
						msg.channel.send('Paused the music.')
 					}
				}
			},
			{
				name: 'unpause',
				usage: '.music unpause',
				permission: 'nomarch.music.unpause',
				description: 'Stop pausing the music the bot is serving.',
				execute: (msg, args) => {
					if (msg.member.voiceChannel.name !== config.channel) {
						return;
					}
					
					if (!info.channel) {
						msg.channel.send('I am not serving tunes to any channel in this guild at the moment,');
					} else {
						if (msg.member.voiceChannel.name !== info.channel) {
							msg.channel.send('You must be in the same voice channel in order to pause the music.');
							return;
						}
						
						const dispatcher = msg.member.voiceChannel.connection.dispatcher;
						
						if (!dispatcher.paused) {
							msg.channel.send('Music is not paused.');
							return;
						}
						
						
						dispatcher.resume();
						msg.channel.send('Stopped pausing the music.')
					}
				}
			},
			{
				name: 'skip',
				usage: '.music skip',
				description: 'Skip the current song.',
				permission: 'nomarch.music.skip',
				execute: (msg, args) => {
					if (msg.member.voiceChannel.name !== config.channel) {
						return;
					}
					
					if (!info.channel) {
						msg.channel.send('I am not serving tunes to any channel in this guild at the moment.');
					} else {
						if (!info.playing) {
							msg.channel.send("I'm not playing any music at the moment.");
							return;
						}
						
						msg.channel.send('Skipping current song.');
						let dispatcher = msg.member.voiceChannel.connection.dispatcher;
						dispatcher.end('Skipped');
						finish(dispatcher);
					}
				}
			},
			{
				name: 'settings',
				usage: '.music settings or .music settings <child command>',
				description: 'Parent command for music settings.',
				permission: 'nomarch.music.settings',
				execute: (msg, args) => {
					let embed = new Discord.RichEmbed();
					embed.setTitle('Music Settings');
					embed.addField('Bot Command Channel', config.channel);
					msg.channel.send(embed);
				},
				children: [
					{
						name: 'channel',
						usage: '.music settings channel <channel name>',
						permission: 'nomarch.music.settings.channel',
						description: 'Set the channel music commands can be invoked in.',
						arguments: 1,
						execute: (msg, args) => {
							if (args[0] === undefined) {
								msg.channel.send("Couldn't set the bot channel.");
								console.log("Couldn't set the bot channel.");
								return;
							}
							
							config.channel = args[0];
							save();
							msg.channel.send('Changed the bot command channel for music commands.');
						}
					}
				]
			}
		]
	});
	
	consoleModule.addCommand({
		name: 'music',
		usage: 'music <command>',
		description: 'Parent command for the music function.',
		execute: null,
		children: [
			{
				name: 'queue',
				usage: '.music queue [<command>]',
				execute: args => {
					if (args.length === 0) {
						let message = 'Queue:\n';
						
						if (info.queue !== undefined) {
							for (let i = 0; i < info.queue.length; i++) {
								let entry = info.queue[i];
								message = message + consoleSongEntry.replace(entry.title, entry.ytChannel, entry.addedBy, entry.duration);
							}
						}
						
						if (message === 'Queue:\n') {
							message = 'Queue empty.'
						}
						
						console.log(message);
					}
				}
			}
		]
	})
};

function save() {
	setTimeout(async () => {
		await fs.writeFile('./modules/music-player/config.json', JSON.stringify(config), err => {
			if (err) throw err;
			console.log('Saved music config file.');
			config = require('./config');
		});
	}, 150);
}