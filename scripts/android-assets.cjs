const fs=require('node:fs');const path=require('node:path');
const dest=path.join(__dirname,'../android/app/src/main/assets');fs.mkdirSync(dest,{recursive:true});
for(const name of ['index.html','style.css','app.mjs','model.mjs','vault.mjs','argo.mjs','manifest.json','icon.svg','theme.js','import-model.mjs','import-ui.mjs','ocr.mjs'])fs.copyFileSync(path.join(__dirname,'..',name),path.join(dest,name));
fs.cpSync(path.join(__dirname,'../vendor'),path.join(dest,'vendor'),{recursive:true});
console.log('Risorse offline Android aggiornate');
