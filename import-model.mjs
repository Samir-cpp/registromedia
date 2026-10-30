import {validDate,periodForDate,schoolYear,today} from './model.mjs';
export const normalized=s=>String(s||'').normalize('NFKC').trim().toLocaleLowerCase('it').replace(/\s+/g,' ');
const ignored=/^(?:registro|didup|argo|famiglia|valutazioni?|voti?|voto|data|materia|materie|media|medie|scritto|orale|pratico|tipo|peso|anno scolastico|primo periodo|secondo periodo|trimestre|pentamestre|quadrimestre|studente|docente|dettaglio|indietro|home|pagina)(?:\s|$)/i;
const datePattern=/\b(?:(\d{4})-(\d{2})-(\d{2})|(\d{1,2})[/.](\d{1,2})(?:[/.](\d{2,4}))?)\b/;
export function readDate(text,year=schoolYear()){const match=text.match(datePattern);if(!match)return null;let y,m,d;if(match[1]){[,y,m,d]=match;}else{d=match[4];m=match[5];y=match[6]?(match[6].length===2?'20'+match[6]:match[6]):String(Number(m)>=9?year:year+1);}const value=`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;return {raw:match[0],date:validDate(value)?value:'',index:match.index};}
function findVote(text){const matches=[...text.matchAll(/(?:^|\s|[|:;])(10|[1-9])(?:([.,]\d{1,2})|([+−–-]|\s?½))?(?=$|\s|[|;:])/g)];if(matches.length!==1)return null;const m=matches[0];return {raw:m[0].trim(),value:m[3]?'':Number(m[1]+(m[2]||'').replace(',','.')),index:m.index,length:m[0].length};}
function cleanSubject(text){return text.replace(/\b(?:scritto|orale|pratico|valutazione|voto|peso\s*\d+(?:[.,]\d+)?)\b/gi,' ').replace(/[|:;•]/g,' ').replace(/\s+/g,' ').trim();}
function plausibleSubject(s){return s.length>=2&&s.length<=80&&/[\p{L}]/u.test(s)&&!/[0-9]/.test(s)&&!ignored.test(s)&&s.split(' ').length<=10;}
export function parseImportText(text,{year=schoolYear(),subjects=[],mode='grades'}={}){
 if(typeof text!=='string'||text.length>50000)throw Error('Testo troppo lungo (massimo 50.000 caratteri)');
 const known=new Map(subjects.map(s=>[normalized(s.name),s.name])),lines=text.normalize('NFKC').split(/\r?\n/).map(s=>s.trim().replace(/\t/g,' ')).filter(Boolean);const rows=[];let current='',pendingDate='',pendingSubject='';
 for(const line of lines){
  if(mode==='subjects'){const subject=cleanSubject(line);if(plausibleSubject(subject)&&!rows.some(r=>normalized(r.subject)===normalized(subject)))rows.push({subject:known.get(normalized(subject))||subject,kind:'subject',date:'',value:'',weight:1,type:'Orale',raw:line});continue;}
  const foundDate=readDate(line,year);let remainder=foundDate?line.replace(foundDate.raw,' '):line;
  if(/\bmedia\b/i.test(remainder))continue;
  const vote=findVote(remainder);let candidate=vote?cleanSubject(remainder.slice(0,vote.index)+remainder.slice(vote.index+vote.length)):cleanSubject(remainder);
  const exact=known.get(normalized(candidate));if(exact)candidate=exact;
  const subject=plausibleSubject(candidate)?candidate:(pendingSubject||current);
  if(vote){if(!subject)continue;const type=/scritto/i.test(line)?'Scritto':/pratico/i.test(line)?'Pratico':'Orale';rows.push({kind:'grade',subject,date:foundDate?.date||pendingDate||'',value:vote.value,weight:1,type,raw:line});current=subject;pendingDate='';pendingSubject='';}
  else if(foundDate){pendingDate=foundDate.date;if(plausibleSubject(candidate))pendingSubject=candidate;}
  else if(plausibleSubject(candidate)){current=candidate;pendingSubject=candidate;pendingDate='';}
 }
 if(rows.length>300)throw Error('Troppi dati in una volta: importa meno screenshot (massimo 300 righe)');return rows;
}
export function rowError(row){if(!row.subject?.trim()||row.subject.trim().length>80)return 'Indica la materia';if(row.kind==='subject')return '';if(row.value===''||!Number.isFinite(Number(row.value))||Number(row.value)<1||Number(row.value)>10)return 'Correggi il voto (1–10)';if(!validDate(row.date))return 'Completa la data';if(periodForDate(row.date)==='summer')return 'Data fuori dai periodi settembre–giugno';if(!Number.isFinite(Number(row.weight))||Number(row.weight)<=0||Number(row.weight)>10)return 'Peso non valido';if(!['Orale','Scritto','Pratico'].includes(row.type))return 'Tipo non valido';return '';}
export function fingerprint(row){return [normalized(row.subject),row.date,Number(row.value),Number(row.weight),row.type].join('|');}
export function mergeImport(data,rows,{id=()=>crypto.randomUUID()}={}){
 const result=structuredClone(data),byName=new Map(result.subjects.map(s=>[normalized(s.name),s]));const existing=new Set(result.grades.map(g=>fingerprint({...g,subject:byName.size?result.subjects.find(s=>s.id===g.subjectId).name:''})));let addedSubjects=0,addedGrades=0,duplicates=0;
 for(const row of rows){const error=rowError(row);if(error)throw Error(error);let subject=byName.get(normalized(row.subject));if(!subject){subject={id:id(),name:row.subject.trim(),target:7};result.subjects.push(subject);byName.set(normalized(subject.name),subject);addedSubjects++;}
  if(row.kind==='subject')continue;
  const fp=fingerprint(row);if(existing.has(fp)){duplicates++;continue;}existing.add(fp);result.grades.push({id:id(),subjectId:subject.id,value:Number(row.value),weight:Number(row.weight),date:row.date,type:row.type,note:''});addedGrades++;
 }
 return {data:result,addedSubjects,addedGrades,duplicates};
}
