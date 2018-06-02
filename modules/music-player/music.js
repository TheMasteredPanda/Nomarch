const ytdl = require('ytdl-core');
const Discord = require('discord.js');
const fs = require('fs');
const consoleModule = require('../console-commands/commands');
const util = require('../utilities/utility_commands');

var info = {
	playing: false,
	channel: null,
	queue: []
};

var consoleSongEntry = 'Title: {0}\nUploaded By: {1}\nAdded By: {2}, Duration: {3}\n';

function finish(dispatcher) {
	info.queue.shift();
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
			console.error('Music entry given was undefined.');
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
	app.addCommand({
		name: 'music',
		usage: `${app.getCommandPrefix()}music <child command>.`,
		description: 'Play a song in a channel.',
		execute: null,
		children: [
			{
				name: 'queue',
				usage: `${app.getCommandPrefix()}music queue <url or video id>.`,
				description: 'Queue music for the bot to play.',
				permission: 'nomarch.music.queue',
				execute: (msg, args) => {
					if (args.length === 0) {
						if (!info.channel) {
							util.sendError(msg.channel, msg.author, `I'm not in a voice channel.`);
							return;
						}
						
						if (!msg.member.voiceChannel || msg.member.voiceChannel.name !== info.channel) {
							util.sendError(msg.channel, msg.author, `You're not in a voice channel.`);
							return;
						}
						
						if (!app.isCommandChannel(msg.channel)) {
							return;
						}
						
						if (info.queue.length === 0) {
							util.sendError(msg.channel, msg.author, 'No queue formed for this guild.');
							return;
						}
						
						
						let embed = util.embed();
						embed.setColor('GREY');
						
						for (let i = 0; i < info.queue.length; i++) {
							let entry = info.queue[i];
							embed.addField('Song ' + i, `Title: ${entry.title}\nDuration: ${entry.duration}\nUploaded By: ${entry.ytChannel}\nAdded By: ${entry.addedBy}.`);
						}
						
						msg.channel.send(embed);
						return;
					}
					
					if (!info.channel) {
						util.sendError(msg.channel, msg.author, `I must be joined to a channel being queueing a song.`);
					} else {
						if (!msg.guild) {
							util.sendError(msg.channel, msg.author, 'This command can only be invoked in a guild.');
							return;
						}
						
						if (!msg.member.voiceChannel) {
							util.sendError(msg.channel, msg.author, 'You must be in the voice channel when adding new songs.');
							return;
						}
						
						if (info.channel !== msg.member.voiceChannel.name) {
							util.sendError(msg.channel, msg.author, `You're not in the same voice channel as the bot, ${msg.author.tag}.`);
							return;
						}
						
						
						let url = args[0].includes('://') ? args[0] : 'https://www.youtube.com/watch?v=' + args[0];
						
						let songEntry = {
							url: url,
							addedBy: msg.author.tag
						};
						
						ytdl.getInfo(args[0], async (err, ytInfo) => {
							if (err) {
								console.error(err.message);
								msg.channel.send(err.message);
								return;
							}
							
							songEntry.title = ytInfo.title;
							songEntry.ytChannel = ytInfo.author.user;
							songEntry.duration = ytInfo.length_seconds;
							await play(songEntry, { seek: 0, volume: 1}, msg.member.voiceChannel.connection);
							info.queue.push(songEntry);
							util.send(msg.channel, msg.author, `Added your song, ${msg.author.tag}.`);
						});
					}
				}
			},
			{
				name: 'join',
				usage: `${app.getCommandPrefix()}music join`,
				description: "Command the bot to join the channel you're in.",
				permission: 'nomarch.music.join',
				execute: (msg, args) => {
					if (!msg.guild) {
						util.sendError(msg.channel, msg.author, 'This command can only be invoked in a guild.');
						return;
					}
					
					if (!app.isCommandChannel(msg.channel)) {
						return;
					}
					
					if (!msg.member.voiceChannel) {
						util.sendError(msg.channel, msg.author,'You must be in a voice channel for me to join.');
						return;
					}
					
					if (info.channel != null && info.channel !== msg.member.voiceChannel.name) {
						util.sendError(msg.channel, msg.author, 'I am not serving this channel as I am already serving tunes in another channel.');
						return;
					}
					
					if (info.channel != null && info.channel === msg.member.voiceChannel.name) {
						util.sendError(msg.channel, msg.author, `Already joined channel ${info.channel}.`);
						return;
					}
					
					msg.member.voiceChannel.join().then(c => util.send(msg.channel, msg.author, 'Joined voice channel.'));
					info.channel = msg.member.voiceChannel.name;
				}
			},
			{
				name: 'leave',
				usage: `${app.getCommandPrefix()}mod leave`,
				description: 'Command the bot to leave the channel is it in.',
				permission: 'nomarch.music.leave',
				execute: (msg, args) => {
					if (!msg.guild) {
						util.sendError(msg.channel, msg.author, 'This command can only be invoked in a guild.');
						return;
					}
					
					if (!app.isCommandChannel(msg.channel)) {
						return;
					}
					
					if (!info.channel) {
						util.sendError(msg.channel, msg.author, 'I am not serving tunes to anyone at this moment in time.');
						return;
					}
					
					if (msg.member.voiceChannel === null || msg.member.voiceChannel.name !== info.channel) {
						util.sendError(msg.channel, msg.author, `You're not in the same voice channel as the bot.`);
					}
					
					delete info.channel;
					msg.member.voiceChannel.leave();
					util.send(msg.channel, msg.author, 'Left voice channel.');
				}
			},
			{
				name: 'pause',
				usage: `${app.getCommandPrefix()}music pause`,
				description: 'Pause the music the bot is serving.',
				permission: 'nomarch.music.pause',
				execute: (msg, args) => {
					if (!msg.guild) {
						util.sendError(msg.channel, msg.author, 'This command can only be invoked in a guild.');
						return;
					}
					
					if (!app.isCommandChannel(msg.channel)) {
						return;
					}
					
					if (!info.channel) {
						util.sendError(msg.channel, msg.author, 'I am not serving tunes to any channel in this guild at the moment.');
					} else {
						if (info.channel && msg.member.voiceChannel.name !== info.channel) {
							util.sendError(msg.channel, msg.author, 'You must be in the same voice channel in order to pause the music.');
							return;
						}
						
						const dispatcher = msg.member.voiceChannel.connection.dispatcher;
						
						if (dispatcher.paused) {
							util.sendError(msg.channel, msg.author, 'The music is already paused.');
							return;
						}
						
						dispatcher.pause();
						util.send(msg.channel, msg.author, 'The music is paused.');
 					}
				}
			},
			{
				name: 'unpause',
				usage: `${app.getCommandPrefix()}music unpause`,
				permission: 'nomarch.music.unpause',
				description: 'Stop pausing the music the bot is serving.',
				execute: (msg, args) => {
					if (!msg.guild) {
						util.sendError(msg.channel, msg.author, 'This command can only be invoked in a guild.');
						return;
					}
					
					if (!app.isCommandChannel(msg.channel)) {
						return;
					}
					
					if (!info.channel) {
						util.send(msg.channel, msg.author, 'I am not serving tunes to any channel in this guild at the moment.');
					} else {
						if (msg.member.voiceChannel.name !== info.channel) {
							util.sendError(msg.channel, msg.author, 'You must be in the same voice channel in order to pause the music.');
							return;
						}
						
						const dispatcher = msg.member.voiceChannel.connection.dispatcher;
						
						if (!dispatcher.paused) {
							util.sendError(msg.channel, msg.author, 'The music is not paused.');
							return;
						}
						
						
						dispatcher.resume();
						util.send(msg.channel, msg.author, 'Resuming..');
					}
				}
			},
			{
				name: 'skip',
				usage: `${app.getCommandPrefix()}music skip`,
				description: 'Skip the current song.',
				permission: 'nomarch.music.skip',
				execute: (msg, args) => {
					if (!msg.guild) {
						util.sendError(msg.channel, msg.author, 'This command can only be invoked in a guild.');
						return;
					}
					
					if (!app.isCommandChannel(msg.channel)) {
						return;
					}
					
					if (!info.channel) {
						util.sendError(msg.channel, msg.author, 'I am not serving tunes to any channel in this guild at the moment.');
					} else {
						if (msg.member.voiceChannel.name !== info.channel) {
							util.sendError(msg.channel, msg.author, 'You must be in the same voice channel in order to pause the music.');
							return;
						}
						
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