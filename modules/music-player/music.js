const ytdl = require('ytdl-core');
const Discord = require('discord.js');


var guilds = {
	guildName: {
		playing: false,
		channel: null,
		songQueue: [
			{
				url: "song",
				added_by: "Emperor Me III"
			},
			{
				url: "song",
				added_by: "Queen Eizabeth II"
			}
		]
	}
};


function finish(dispatcher) {
	var channel = dispatcher.player.voiceConnection.channel;
	var guildName = channel.guild.name;
	var entry = guilds[guildName];
	
	delete entry.songQueue[0];
	
	if (entry.songQueue.length !== 0) {
		const dispatcher0 = dispatcher.player.voiceConnection.playStream(args[0]);
		
		dispatcher0.on('finish', () => {
			finish(dispatcher0);
		})
	}
	
	dispatcher.destroy();
}

exports.init = (client, app) => {
	app.addCommand({
		name: 'music',
		usage: 'Play a song in a channel.',
		execute: null,
		children: [
			{
				name: 'queue',
				usage: 'Queue music for the bot to play.',
				execute: (msg, args) => {
					if (args.length === 0) {
						if (!guilds.hasOwnProperty(msg.guild.name)) {
							msg.channel.send('No queue has been formed for this guild.');
							return;
						}
						
						var entry = guilds[msg.guild.name];
						var embed = new Discord.RichEmbed();
						
						if (entry.songQueue.length === 0) {
							msg.channel.send('No queue has been formed for this guild.');
							return;
						}
						
						for (var i = 0; i < entry.songQueue.length; i++) {
							var songEntry = entry.songQueue[i];
							embed.addField(i, 'URL:' + songEntry.url + '\nAdded By: ' + songEntry.added_by + '.');
						}
						
						msg.channel.send(embed);
						return;
					}
					
					if (!guilds.hasOwnProperty(msg.guild.name)) {
						msg.channel.send('I must be joined to a channel before queuing a song.');
					} else {
						if (!msg.guild) {
							return;
						}
						
						if (entry.channel !== msg.member.voiceChannel.name) {
							console.log("You're not in the same voice channel as the bot, " + msg.author.tag + '.');
							return;
						}
						
						entry.songQueue[guilds[msg.guild.name].songQueue.length + 1] = {
							url: args[0],
							added_by: msg.author
						};
						
						const connection = msg.member.voiceChannel.connection;
						
						if (!entry.playing) {
							const dispatcher = connection.playStream(ytdl(args[0], { filter: 'audioonly'}), { seek: 0, volume: 1 });
							dispatcher.on('finish', () => {
								finish(dispatcher);
							});
						}
						
						msg.channel.send('Added your song, ' + msg.author.tag + '.');
					}
				}
			},
			{
				name: 'join',
				usage: "Command the bot to join the channel you're in.",
				execute: (msg, args) => {
					var guildName = msg.guild.name;
					
					
					if (!msg.member.voiceChannel) {
						msg.channel.send('You must be in a voice channel for me to join.');
						return;
					}
					
					if (guilds.hasOwnProperty(guildName)) {
						msg.channel.send('I am not serving this channel as I am already serving tunes in another channel.');
						return;
					}
					
					msg.member.voiceChannel.join().then(c => msg.channel.send('Joined voice channel.'));
					
					guilds[guildName] = {
						channel: msg.member.voiceChannel.name,
						playing: false,
						songQueue: []
					};
				}
			},
			{
				name: 'leave',
				usage: 'Command the bot to leave the channel is it in.',
				execute: (msg, args) => {
					var guildName = msg.guild.name;
					
					if (!guilds.hasOwnProperty(guildName)) {
						msg.channel.send('I am not serving tunes to anyone at this moment in time.');
						return;
					}
					
					delete guilds[guildName];
					msg.member.voiceChannel.leave();
					msg.channel.send('Left voice channel.');
				}
			},
			{
				name: 'pause',
				usage: 'Pause the music the bot is serving.',
				execute: (msg, args) => {
					if (!client.voiceChannel) {
						msg.channel.send('I am not serving tunes to any channel in this guild at the moment.');
					} else {
						var entry = guilds[msg.guild.name];
						
						if (msg.voiceChannel.name !== entry.name) {
							msg.channel.send('You must be in the same voice channel in order to pause the music.');
							return;
						}
						
						if (!msg.voiceChannel.connection.speaking) {
							msg.channel.send("We're not serving any music at the moment.");
							return;
						}
						
						const dispatcher = msg.voiceChannel.connection.dispatcher;
						
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
				usage: 'Stop pausing the music the bot is serving.',
				execute: (msg, args) => {
					if (!client.voiceChannel) {
						msg.channel.send('I am not serving tunes to any channel in this guild at the moment,');
					} else {
						var entry = guilds[msg.guild.name];
						
						if (msg.voiceChannel.name !== entry.name) {
							msg.channel.send('You must be in the same voice channel in order to pause the music.');
							return;
						}
						
						if (!msg.voiceChannel.connection.speaking) {
							msg.channel.send("We're not serving any music at the moment.");
							return;
						}
						
						const dispatcher = msg.voiceChannel.connection.dispatcher;
						
						if (!dispatcher.paused) {
							msg.channel.send('Music is not paused.');
							return;
						}
						
						
						dispatcher.pause();
						msg.channel.send('Stopped pausing the music.')
					}
				}
			},
		]
	});
};