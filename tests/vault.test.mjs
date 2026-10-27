import 'fake-indexeddb/auto';
import {test} from 'node:test';import assert from 'node:assert/strict';import * as vault from '../vault.mjs';
const password='Una-password-lunga-2026';
const schoolData={subjects:[{id:'mat',name:'MateriaRiservata',target:7}],grades:[{id:'vote1',subjectId:'mat',value:8.5,weight:1,date:'2026-12-31',type:'Orale',note:'Nota personale riservata'}],tasks:[]};
test('archivio cifrato, password errata, persistenza, isolamento e cancellazione',async()=>{
 const session=await vault.register({username:'alice',name:'NomeRiservato',password});await vault.save(session,schoolData);
 await assert.rejects(vault.login('alice','password-sbagliata-lunga'));
 const restored=await vault.login('alice',password);assert.deepEqual(restored.data,schoolData);
 const backup=await vault.exportBackup(session),serialized=JSON.stringify(backup);assert.ok(!serialized.includes('MateriaRiservata'));assert.ok(!serialized.includes('NomeRiservato'));assert.ok(!serialized.includes(password));
 const bob=await vault.register({username:'bob',name:'Bob',password});assert.equal(bob.data.grades.length,0);
 const a=await vault.login('alice',password),b=await vault.login('alice',password);await vault.save(a,{...schoolData,tasks:[{id:'task',title:'Compito',subjectId:'mat',date:'2027-01-03',done:false}]});await assert.rejects(vault.save(b,schoolData),/altra finestra/);
 await assert.rejects(vault.deleteAccount(a,'password-sbagliata-lunga'));await vault.deleteAccount(a,password);await assert.rejects(vault.login('alice',password),/non trovato/);
 const imported=await vault.restoreBackup(backup,password);assert.deepEqual(imported.data,schoolData);await assert.rejects(vault.restoreBackup(backup,password),/già presente/);
 const tampered=structuredClone(backup);tampered.account.ciphertext='AAAA'+tampered.account.ciphertext.slice(4);await assert.rejects(vault.restoreBackup(tampered,password,true));
 const badRevision=structuredClone(backup);badRevision.account.revision++;await assert.rejects(vault.restoreBackup(badRevision,password,true));
 assert.equal((await vault.login('bob',password)).data.grades.length,0);
});
