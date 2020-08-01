// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.
const fs = require('fs');
const { ipcRenderer } = require('electron')
const prompt = require('electron-prompt');
const mysql = require('mysql');
let conn =  mysql.createConnection({
  host: 'localhost',
  user: 'lite',
  password: 'lite',
  database: 'discord'
});

var Discord = require('discord.js')

Array.prototype.random = function () {
  return this[Math.floor((Math.random()*this.length))];
}

const client = new Discord.Client();
client.commands = new Discord.Collection();




console.log('Logging in')

var channels = document.querySelector('#channels')
var servers = document.querySelector('#servers');
var chatlog = document.getElementById('chatlog')
var info = document.querySelector('.infopanel')
var input = document.getElementById('input')
client.on('message', async msg => {

    // Insert message into database
    var message = {
        id: msg.id,
        authorId: msg.author.id,
        content: msg.content,
        cleanContent: msg.cleanContent,
        timestamp: msg.createdTimestamp,
        guildId: msg.guild ? msg.guild.id : null,
        channelId: msg.channel ? msg.channel.id : null,
        authorTag: msg.author.tag
    }   
    const res = await conn.query("INSERT INTO messages SET ?", message);

    insertUpdateUser(msg.author);

  var tpl = document.querySelector('template.message')
  var node = document.createElement('div')

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
      input.focus();
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

  var l = chatlog.childNodes.length - 1;
  if (l > 100) {
    chatlog.removeChild(chatlog.firstChild)
  }
});


client.on('ready', async () => {
  print(`Logged in as ${client.user.tag}!`);

//  var g = client.guilds.resolve('456531507318620191');
//  console.log(g.members.cache)

    client.guilds.cache.forEach(async g => {
        var r = await conn.query(`
        INSERT INTO guilds (id, name, memberCount, iconURL, createdTimestamp, ownerId, region, splash, widgetEnabled) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE
        name = ?,
        memberCount = ?,
        iconURL = ?,
        createdTimestamp = ?,
        ownerId = ?,
        region = ?,
        splash = ?,
        widgetEnabled = ?`,
        [g.id, g.name, g.memberCount, g.iconURL(), g.createdTimestamp, g.ownerID, g.region, g.splashURL(), g.widgetEnabled, g.name, g.memberCount, g.iconURL(), g.createdTimestamp,  g.ownerID, g.region, g.splashURL(), g.widgetEnabled])

        g.roles.cache.forEach(async role => {
            var r = await conn.query(`INSERT INTO roles (id, name, guildId, hexColor, hoist, permissions, rawPosition) VALUES (?, ?, ?, ?, ?, ?, ?)`, [role.id, role.name, g.id, role.hexColor, role.hoist, role.permissions.bitfield, role.rawPosition])
        })
    })
  startUI();
});

client.on('presenceUpdate', async (oldMember, newMember) => {
    var status = {}


    if (oldMember && oldMember.user.presence.status != newMember.user.presence.status) {
      console.log(`${oldMember.user.tag} ${oldMember.user.presence.status} to ${newMember.user.presence.status}`);
      status.from = oldMember.user.presence.status
    }
    else {
      console.log(`${newMember.user.tag}: ${newMember.user.presence.status}`);  
      status.from = null;
    }

    status.to = newMember.user.presence.status
    status.tag = newMember.user.tag
    status.userid = newMember.user.id
    status.timestamp = new Date().getTime()
    //console.log(status);
    // Mr. Pink 🐱 online to online
    var notif = new Notification(newMember.user.tag, {
        body: newMember.user.presence.status,
        icon: newMember.user.avatarURL(),
        silent: true
    });

    insertUpdateUser(newMember.user);

    const res = await conn.query("INSERT INTO statuses SET ?", status);
});


ipcRenderer.on('deleteChecked', (event, arg) => {
  window.deleteTimeout = arg
})

ipcRenderer.on('toggleServerPane', (event, arg) => {
  if (info.style.display == 'none') info.style.display = 'flex';
  else info.style.display = 'none'
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

  /*
    Print info about guild
  */
  var tpl = document.querySelector('template.guildinfo')
  var node = document.createElement('div')

  node.classList.add('guildinfo')
  node.innerHTML = tpl.innerHTML

  node.querySelector('.name').innerHTML = g.name;
  node.querySelector('.icon').src = g.iconURL();

  document.querySelector('.infopanel').innerHTML = node.innerHTML;
}

function startUI() {
  const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
  	const command = require(`./commands/${file}`);
    console.log(command.name,'-',command.description)
  	// set a new item in the Collection
  	// with the key as the command name and the value as the exported module
  	client.commands.set(command.name, command);
  }

  input.addEventListener('keydown', e => {


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

}

function print(t) {
  var node = document.createElement('div')

  node.classList.add('message')
  node.innerHTML = `[${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}] ${t}`;
  chatlog.appendChild(node)
}
print('Connecting...')

document.getElementById('tokenSubmit').addEventListener('click', (e) => {
    var tok = document.getElementById('tokenInput').value
    console.log(tok)
    client.login(tok)
    .catch(e => {
        console.log(e);
        document.querySelector('login-overlay').style.display = 'flex';
    })
    document.querySelector('login-overlay').style.display = 'none';
})

async function insertUpdateUser(user) {
    if (!user) return;
    const res = await conn.query(`INSERT INTO users (id, tag, lastActive, avatarURL, createdAt, createdTimestamp, bot, lastMessageId, locale, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE
    tag = ?,
    lastActive = ?,
    avatarURL = ?,
    createdAt = ?,
    createdTimestamp = ?,
    bot = ?,
    lastMessageId = ?,
    locale = ?,
    status = ?;`, [
        user.id,
        user.tag,
        new Date().getTime(),
        user.avatarURL(),
        user.createdAt,
        user.createdTimestamp,
        user.bot,
        user.lastMessageID,
        user.locale,
        user.presence.status,
        user.tag,
        new Date().getTime(),
        user.avatarURL(),
        user.createdAt,
        user.createdTimestamp,
        user.bot,
        user.lastMessageID,
        user.locale,
        user.presence.status
    ])
    return res;
}
