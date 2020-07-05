const electron=require("electron");
const app=electron.app;
const ejs=require("ejs-electron");
ejs.data({
    "title":"My Excel",
    "rows":100,
    "cols":26
})
function createWindow(){
    const win=new electron.BrowserWindow({
        width:800,
        height:600,
        show:false,
        webPreferences: {
            nodeIntegration: true
          
          }
    })
    win.loadFile("index.ejs").then(function(){
        win.maximize();
        win.show();
        win.webContents.openDevTools();
    })
}
app.whenReady().then(createWindow);
app.on('window-all-closed',()=>{
    if(process.platform!=='darwin'){
        app.quit();
    }
})
app.on('activate',()=>{
    if(BrowserWindow.getAllwindows.length===0){
        createWindow()
    }
})