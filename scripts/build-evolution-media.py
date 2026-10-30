#!/usr/bin/env python3
"""Montage genuine browser recordings; no generated or simulated app interactions."""
from pathlib import Path
import subprocess,json
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'docs/evolution';MEDIA=OUT/'media'
names=['00-intro','01-idea','02-prima-app','03-ocr','04-scelta','05-votiva-demo','06-bilancio','07-piattaforme','08-finale']
chapters=['Da RegistroMedia a Votiva: interfacce reali, voti dimostrativi.','Idea iniziale: dati Argo e medie. Le API non sono mai state attivate.','RegistroMedia 0.3: medie, agenda e simulatore; più funzioni e maggiore densità.','RegistroMedia 0.4: importazione OCR locale con controllo dei dati. Funzione poi rimossa.','Scelta finale: meno funzioni e automazione, più semplicità.','Votiva 1.0.1: materie, voti a quarti, grafico, periodi configurabili, temi e account.','Il bilancio: APK da 15,6 a 3,04 MB; si rinuncia all’OCR e all’agenda.','Windows e Android hanno build installabili. iPhone richiede il sito HTTPS pubblicato.','Test e build riusciti; collaudo fisico ancora necessario. Nessuna promessa di zero bug.']
clips=[MEDIA/(n+'.webm') for n in names]
for f in clips:
 if not f.exists():raise FileNotFoundError(f)
listing=MEDIA/'montage.txt';listing.write_text(''.join("file '"+str(p.resolve()).replace("'","'\\''")+"'\n" for p in clips))
cmd=['ffmpeg','-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',str(listing),'-vf','fps=25','-c:v','libx264','-crf','23','-preset','fast','-pix_fmt','yuv420p','-movflags','+faststart','-an',str(MEDIA/'Votiva-Evoluzione-e-Demo.mp4')]
subprocess.run(cmd,check=True)
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss','12','-t','12','-i',str(MEDIA/'05-votiva-demo.webm'),'-filter_complex','[0:v]fps=6,scale=640:-1:flags=lanczos,split[v][p];[p]palettegen=max_colors=96[pal];[v][pal]paletteuse=dither=bayer:bayer_scale=4','-loop','0',str(MEDIA/'Votiva-Anteprima.gif')],check=True)
def probe(f):return json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(f)]))
def timestamp(s):
 ms=round(s*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
t=0;subs=[];chapterdata=[]
for i,(clip,title) in enumerate(zip(clips,chapters),1):
 duration=float(probe(clip)['format']['duration']);subs.append(f'{i}\n{timestamp(t)} --> {timestamp(t+duration)}\n{title}\n');chapterdata.append({'start_seconds':round(t,3),'duration_seconds':duration,'caption':title});t+=duration
(MEDIA/'Votiva-Capitoli.srt').write_text('\n'.join(subs))
info=probe(MEDIA/'Votiva-Evoluzione-e-Demo.mp4');info['chapters_description']=chapterdata;info['audio_note']='Video senza audio, con cartelli e didascalie italiane; file SRT esterno con sintesi dei capitoli.';(MEDIA/'video-info.json').write_text(json.dumps(info,indent=2))
listing.unlink();print('MP4 duration',info['format']['duration'],'seconds; bytes',info['format']['size']);print('GIF ready')
