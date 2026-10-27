const {app,BrowserWindow,session,protocol,net,shell} = require('electron');
const path = require('node:path');
const {pathToFileURL} = require('node:url');

protocol.registerSchemesAsPrivileged([{scheme:'registromedia',privileges:{standard:true,secure:true,supportFetchAPI:true}}]);
app.setAppUserModelId('it.registromedia.app');
const smokeTest=process.argv.includes('--smoke-test');
if(!app.requestSingleInstanceLock()) app.quit();
else {
 let window;
 let isOfficialArgoLogin=()=>false;
 const root=path.join(__dirname,'..');
 const files=new Set(['index.html','app.mjs','model.mjs','vault.mjs','argo.mjs','style.css','icon.svg','manifest.json']);
 async function createWindow(){
  window=new BrowserWindow({title:'RegistroMedia · Il tuo registro personale',width:1280,height:850,minWidth:380,minHeight:600,autoHideMenuBar:true,backgroundColor:'#f7f8fc',webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true}});
  window.webContents.setWindowOpenHandler(({url})=>{
   if(isOfficialArgoLogin(url)) shell.openExternal(url).catch(()=>{
    const {dialog}=require('electron');
    dialog.showErrorBox('Browser non disponibile','Non è stato possibile aprire il browser. Apri manualmente https://www.portaleargo.it/famiglia/');
   });
   return {action:'deny'};
  });
  window.webContents.on('will-navigate',event=>event.preventDefault());
  window.webContents.on('will-attach-webview',event=>event.preventDefault());
  window.on('closed',()=>{window=null;});
  if(smokeTest){
   window.webContents.once('did-finish-load',async()=>{
    try {
     const result=await window.webContents.executeJavaScript(`({authReady:!document.getElementById('auth-view').hidden, cryptoReady:!!crypto.subtle, storageReady:!!indexedDB})`);
     if(!result.authReady||!result.cryptoReady||!result.storageReady)throw Error('Interfaccia non inizializzata: '+JSON.stringify(result));
     console.log('DESKTOP_SMOKE_OK',JSON.stringify(result));app.exit(0);
    }catch(error){console.error(error);app.exit(1);}
   });
   setTimeout(()=>{console.error('Timeout avvio desktop');app.exit(1);},20000).unref();
  }
  try{await window.loadURL('registromedia://app/index.html');}catch(error){console.error('Avvio non riuscito:',error.message);if(smokeTest)app.exit(1);}
 }
 app.whenReady().then(async()=>{
  ({isOfficialArgoLogin}=await import('../argo.mjs'));
  // Le richieste remote appartengono al browser esterno, mai al renderer.
  session.defaultSession.webRequest.onBeforeRequest({urls:['http://*/*','https://*/*']},(_details,callback)=>callback({cancel:true}));
  protocol.handle('registromedia',request=>{
   const url=new URL(request.url),file=url.pathname.slice(1);
   if(url.host!=='app'||!files.has(file))return new Response('Not found',{status:404});
   return net.fetch(pathToFileURL(path.join(root,file)).href);
  });
  session.defaultSession.setPermissionRequestHandler((_contents,_permission,callback)=>callback(false));
  session.defaultSession.setPermissionCheckHandler(()=>false);
  session.defaultSession.on('will-download',(_event,item)=>{
   item.setSaveDialogOptions({title:'Esporta backup cifrato',defaultPath:path.join(app.getPath('documents'),'registromedia-cifrato.json'),filters:[{name:'Backup RegistroMedia',extensions:['json']}]});
  });
  createWindow();
  app.on('activate',()=>{if(!BrowserWindow.getAllWindows().length)createWindow();});
 });
 app.on('second-instance',()=>{if(window){if(window.isMinimized())window.restore();window.focus();}});
 app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
}
