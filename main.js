// Modules to control application life and create native browser window
const {app, BrowserWindow, Menu, MenuItem, ipcMain } = require('electron')
const path = require('path')

let mainWindow;

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  const menu = new Menu()

  menu.append(new MenuItem ({
    label: 'Chat',
    submenu: [
      {
        label: 'Global',
        click(e) {
          mainWindow.webContents.send('openGlobal', e.checked)
        }
      },
      {
        label: 'Channel',
        click(e) {
          mainWindow.webContents.send('openChannel', e.checked)
        }
      }
    ]
  }))
  var onTop = false;
  menu.append(new MenuItem ({
    label: 'Options',
    submenu: [
      {
        label: '7 second delete',
        type: 'checkbox',
        click(e) {
          mainWindow.webContents.send('deleteChecked', e.checked)
        }
      },
      {
        label: 'Always on top',
        type: 'checkbox',
        click(e) {
          mainWindow.webContents.send('deleteChecked', e.checked)
          onTop = !onTop
          mainWindow.setAlwaysOnTop(onTop);
        }
      }
    ]
  }))
  menu.append(new MenuItem ({
    label: 'View',
    submenu: [
      {
        label: 'Info panel',
        click(e) {
          mainWindow.webContents.send('toggleServerPane')
        }
      }
    ]
  }))
  Menu.setApplicationMenu(menu)

  mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

ipcMain.on('loadFile', (event, arg) => {
  mainWindow.loadFile(arg)
  .then(() => {
      event.reply('loaded', arg);
  })
})
