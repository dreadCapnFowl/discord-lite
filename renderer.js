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
  node.querySelector('.guild').innerHTML = '/'+ msg.guild.name+'/'
  node.querySelector('.channel').innerHTML = '#' + msg.channel.name
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

var servers = document.querySelector('#servers');
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
    var channels = document.querySelector('#channels')
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
       var g = client.guilds.resolve(e.target.value);
       window.selectedGuild = g;
       console.log('Selected guild:', window.selectedGuild)
       channels.innerHTML = ''
       window.selectedGuild.channels.cache.array().forEach(c => {
         var option = document.createElement('option')
         option.value = c.id
         option.innerHTML = '#' + c.name;
         channels.appendChild(option)
       })
     }
   })
});

ipcRenderer.on('deleteChecked', (event, arg) => {
  window.deleteTimeout = arg
})


function play(text) {
  if (!text) return
  if (text.length == 0) throw 'Text cannot be blank.'

  var type = document.getElementById('type').value;
  var voice = document.getElementById('voice').value
  var rate = document.getElementById('rate').value;
  var pitch = document.getElementById('pitch').value;
  var data = {
    "audioConfig": {
      "audioEncoding": "LINEAR16",
      "pitch": pitch,
      "speakingRate": rate
    },
    "input": {
      "text": text
    },
    "voice": {
      "languageCode": "en-US",
      "name": "en-US-Wavenet-" + voice
    }
  }

  fetch(apiURL + `?alt=json&key=` + apiKey , {
    method: 'post',
    headers: {
    },
    body: JSON.stringify(data)
  }).then(r => {
    return r.json()
  }).then(json => {
    console.log(json.audioContent)
    var audio = new Audio('data:audio/mp3;base64,'+json.audioContent).play();
  }).catch(console.log)
}
