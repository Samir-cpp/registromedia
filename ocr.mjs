export async function recognizeImages(files,{onProgress=()=>{},signal}={}){
 if(!files.length||files.length>5)throw Error('Scegli da 1 a 5 screenshot per volta');
 for(const f of files)if(!['image/png','image/jpeg','image/webp'].includes(f.type)||f.size>10000000)throw Error('Usa immagini PNG, JPG o WebP, massimo 10 MB ciascuna');
 const {default:Tesseract}=await import('./vendor/ocr/tesseract.esm.min.js');let worker;
 const aborted=()=>{if(signal?.aborted)throw new DOMException('Lettura annullata','AbortError');};
 const cancel=()=>{worker?.terminate();};signal?.addEventListener('abort',cancel,{once:true});
 try{aborted();onProgress('Preparo il lettore sul dispositivo…');worker=await Tesseract.createWorker('ita',1,{workerPath:new URL('./vendor/ocr/worker.min.js',import.meta.url).href,corePath:new URL('./vendor/ocr/',import.meta.url).href,langPath:new URL('./vendor/ocr/',import.meta.url).href,workerBlobURL:false,cacheMethod:'none',logger:m=>{if(m.status==='recognizing text')onProgress(`Lettura dello screenshot… ${Math.round(m.progress*100)}%`);}});aborted();const texts=[];
 for(let i=0;i<files.length;i++){aborted();onProgress(`Leggo lo screenshot ${i+1} di ${files.length}…`);const image=await createImageBitmap(files[i]);try{
 if(image.width*image.height>20000000)throw Error('Screenshot troppo grande: ritaglialo o riduci la risoluzione');
 const factor=Math.min(2,2800/Math.max(image.width,image.height),Math.sqrt(4000000/(image.width*image.height))),canvas=document.createElement('canvas');canvas.width=Math.round(image.width*factor);canvas.height=Math.round(image.height*factor);const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);
 const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);let sum=0,count=0;for(let j=0;j<pixels.data.length;j+=160){sum+=pixels.data[j];count++;}const invert=sum/count<110;for(let j=0;j<pixels.data.length;j+=4){let grey=.299*pixels.data[j]+.587*pixels.data[j+1]+.114*pixels.data[j+2];if(invert)grey=255-grey;pixels.data[j]=pixels.data[j+1]=pixels.data[j+2]=grey;}ctx.putImageData(pixels,0,0);
 const result=await worker.recognize(canvas);texts.push(result.data.text);canvas.width=canvas.height=0;
 }finally{image.close();}}
 return texts.join('\n');
 }finally{signal?.removeEventListener('abort',cancel);await worker?.terminate();}
}
