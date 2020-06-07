// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

const fs = require('fs');
const { ipcRenderer } = require('electron')
var Discord = require('discord.js')

Array.prototype.random = function () {
  return this[Math.floor((Math.random()*this.length))];
}

const client = new Discord.Client();
client.commands = new Discord.Collection();
client.login(require('./token.json'));

var channels = document.querySelector('#channels')
var servers = document.querySelector('#servers');

client.on('message', msg => {
  var tpl = document.querySelector('template.message')
  var node = document.createElement('div')
  var chatlog = document.getElementById('chatlog')
  node.classList.add('message')
  node.innerHTML = tpl.innerHTML;
  node.id = msg.id

  var dateTime = new Date(msg.createdTimestamp)
  dateTime = ("0" + dateTime.getHours()).substr(-2) + ':' + ("0" + dateTime.getMinutes()).substr(-2) + ':' + ("0" + dateTime.getSeconds()).substr(-2)
  node.querySelector('.time').innerHTML = '['+ dateTime +']'

  if (msg.guild) {
    node.querySelector('.guild').innerHTML = '/'+ msg.guild.name+'/'
    node.onclick = (e) => {

      var options = servers.options;
      for (var o in options) {
        if (options[o].id == msg.guild.id) {
          servers.selectedIndex = o;
          window.selectedGuild = msg.guild
          break;
        }
      }
      populateChannels(msg.guild.id)
    }
  }

  if (msg.guild) {
    node.querySelector('.channel').innerHTML = '#' + msg.channel.name
    node.onclick = (e) => {

      var options = servers.options;
      for (var o in options) {
        if (options[o].id == msg.guild.id) {
          servers.selectedIndex = o;
          window.selectedGuild = msg.guild
          break;
        }
      }
      populateChannels(msg.guild.id)

      options = channels.options;
      for (var o in options) {
        if (options[o].id == msg.channel.id) {
          channels.selectedIndex = o;
          window.selectedChannel = msg.channel
          break;
        }
      }
    }
  }
  else {
    node.querySelector('.channel').innerHTML = `[` + msg.author.tag + `]`
  }

  node.querySelector('.author').innerHTML = msg.author.tag +':'
  node.querySelector('.content').innerHTML = msg.cleanContent
  node.id = msg.channel.id



  chatlog.appendChild(node)

  // Auto scroll to bottom
  chatlog.scrollTop = chatlog.scrollHeight

  if (window.deleteTimeout && msg.author.id == client.user.id) {
    msg.delete({timeout: 7000})
  }

  var tokens = msg.cleanContent.split(' ')
  var cmd = client.commands.get(tokens[0])
  if (cmd && msg.author.id == client.user.id) {
    cmd.execute(msg, tokens);
  }
});


client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);

  const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
  	const command = require(`./commands/${file}`);
    console.log(command.name,'-',command.description)
  	// set a new item in the Collection
  	// with the key as the command name and the value as the exported module
  	client.commands.set(command.name, command);
  }

  document.getElementById('input').addEventListener('keydown', e => {

    var input = document.getElementById('input')
    if (e.keyCode == 13) {
      window.selectedGuild.channels.resolve(selectedChannel.id).send(input.value)
      input.value = "";
    }

  })

   client.guilds.cache.array().forEach(guild => {
     var e = document.createElement('option')
     e.innerHTML = guild.name;
     e.value = guild.id
     e.id = guild.id

     servers.appendChild(e)

     channels.onchange = e => {
       window.selectedChannel = window.selectedGuild.channels.resolve(e.target.value)
     }
     servers.onchange = (e) => {
       populateChannels(e.target.value)
     }
   })
});

ipcRenderer.on('deleteChecked', (event, arg) => {
  window.deleteTimeout = arg
})


function populateChannels(guildID) {
  var g = client.guilds.resolve(guildID);
  window.selectedGuild = g;
  channels.innerHTML = ''
  window.selectedGuild.channels.cache.array()
  .filter(chan => chan instanceof Discord.TextChannel)
  .sort((a, b) => {
    return a.rawPosition - b.rawPosition
  }).forEach(c => {
    var option = document.createElement('option')
    option.value = c.id
    option.id = c.id
    option.innerHTML = '#' + c.name;
    channels.appendChild(option)
  })
}
