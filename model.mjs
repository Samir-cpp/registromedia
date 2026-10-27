export const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export function validDate(date){return typeof date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(Date.parse(date))&&new Date(date).toISOString().slice(0,10)===date;}
export function schoolYear(date=today()){if(!validDate(date))throw Error('Data non valida');const y=Number(date.slice(0,4));return Number(date.slice(5,7))>=9?y:y-1;}
export function periodForDate(date){if(!validDate(date))throw Error('Data non valida');const m=Number(date.slice(5,7));return m>=9?'first':m<=6?'second':'summer';}
export function weightedAverage(grades){return grades.length?grades.reduce((s,g)=>s+g.value*g.weight,0)/grades.reduce((s,g)=>s+g.weight,0):null;}
export function generalAverage(grades,subjects){const values=subjects.map(s=>weightedAverage(grades.filter(g=>g.subjectId===s.id))).filter(v=>v!==null);return values.length?values.reduce((a,b)=>a+b,0)/values.length:null;}
export function neededGrade(grades,target,weight=1){if(!Number.isFinite(target)||target<1||target>10||!Number.isFinite(weight)||weight<=0||weight>10)throw Error('Obiettivo o peso non valido');return (target*(grades.reduce((s,g)=>s+g.weight,0)+weight)-grades.reduce((s,g)=>s+g.value*g.weight,0))/weight;}
const text=(s,max=80)=>typeof s==='string'&&s.trim().length>0&&s.length<=max;
const id=s=>typeof s==='string'&&/^[a-zA-Z0-9-]{1,64}$/.test(s);
export function validateData(data){
 if(!data||!Array.isArray(data.subjects)||!Array.isArray(data.grades)||!Array.isArray(data.tasks)||data.subjects.length>100||data.grades.length>10000||data.tasks.length>2000)throw Error('Archivio non valido o troppo grande');
 const ids=new Set(),names=new Set();
 const subjects=data.subjects.map(s=>{if(!s||!id(s.id)||ids.has(s.id)||!text(s.name)||!Number.isFinite(s.target)||s.target<1||s.target>10||names.has(s.name.trim().toLocaleLowerCase('it')))throw Error('Materia duplicata o non valida');ids.add(s.id);names.add(s.name.trim().toLocaleLowerCase('it'));return {id:s.id,name:s.name.trim(),target:s.target};});
 const gradeIds=new Set();
 const grades=data.grades.map(g=>{if(!g||!id(g.id)||gradeIds.has(g.id)||!ids.has(g.subjectId)||!Number.isFinite(g.value)||g.value<1||g.value>10||!Number.isFinite(g.weight)||g.weight<=0||g.weight>10||!validDate(g.date)||periodForDate(g.date)==='summer'||!['Orale','Scritto','Pratico'].includes(g.type)||typeof g.note!=='string'||g.note.length>160)throw Error('Voto non valido: usa date da settembre a giugno e voti da 1 a 10');gradeIds.add(g.id);return {id:g.id,subjectId:g.subjectId,value:g.value,weight:g.weight,date:g.date,type:g.type,note:g.note.trim()};});
 const taskIds=new Set();
 const tasks=data.tasks.map(t=>{if(!t||!id(t.id)||taskIds.has(t.id)||!text(t.title,200)||!validDate(t.date)||typeof t.done!=='boolean'||(t.subjectId!==''&&!ids.has(t.subjectId)))throw Error('Impegno non valido');taskIds.add(t.id);return {id:t.id,title:t.title.trim(),date:t.date,done:t.done,subjectId:t.subjectId};});
 return {subjects,grades,tasks};
}
