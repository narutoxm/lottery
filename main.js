const { app, BrowserWindow, globalShortcut, dialog } = require('electron');
const path = require('path');

let mainWindow;
let serverProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    autoHideMenuBar: true, // 隐藏菜单栏
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    title: '抽奖程序',
    fullscreen: true // 默认全屏
  });

  // 启动后端服务器
  const server = require('./server/server.js');
  const port = 8888;

  // 确定静态文件目录 - 在打包后的应用中使用正确路径
  const staticDir = path.join(__dirname, 'product', 'dist');
  console.log('App directory:', __dirname);
  console.log('Static directory:', staticDir);

  // 启动服务器，传递静态文件目录
  server.run(port, 'n', staticDir);

  // 仅开发环境打开开发者工具
  // if (!app.isPackaged) {
  //   mainWindow.webContents.openDevTools();
  // }

  // 等待服务器启动后加载页面
  setTimeout(() => {
    mainWindow.loadURL(`http://localhost:${port}`);
  }, 1500);

  // 添加页面加载错误处理
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Page failed to load:', errorCode, errorDescription);
  });

  // 转发前端控制台日志到主进程 stdout
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Renderer] ${message} (${sourceId}:${line})`);
  });

  // 生产环境不打开开发者工具
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', function () {
    mainWindow = null;
  });

  // 注册 Esc 键退出应用（方便 Windows 用户关闭全屏）
  globalShortcut.register('Escape', () => {
    dialog.showMessageBox(mainWindow, {
      type: 'question',
      buttons: ['取消', '确定退出'],
      defaultId: 0,
      title: '确认退出',
      message: '确定要退出抽奖程序吗？'
    }).then(result => {
      if (result.response === 1) {
        app.quit();
      }
    });
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  // 清理资源
  if (serverProcess) {
    serverProcess.kill();
  }
});
