import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ARGO_LOGIN_URL,isOfficialArgoLogin} from '../argo.mjs';
import {readFile} from 'node:fs/promises';

test('apertura esterna consentita solo alla destinazione ufficiale esatta',()=>{
 assert.ok(isOfficialArgoLogin(ARGO_LOGIN_URL));
 for(const value of ['http://www.portaleargo.it/famiglia/','https://www.portaleargo.it.evil.example/famiglia/','https://www.portaleargo.it@evil.example/famiglia/','https://www.portaleargo.it/famiglia/?token=secret','https://www.portaleargo.it/famiglia/#token','https://www.portaleargo.it/other','javascript:alert(1)','file:///etc/passwd',null,{}])assert.equal(isOfficialArgoLogin(value),false);
});
test('il collegamento web non espone opener o referrer e non richiede password',async()=>{
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 const link=html.match(/<a id="argo-login"[^>]+>/)?.[0];
 assert.ok(link);assert.ok(link.includes(`href="${ARGO_LOGIN_URL}"`));
 assert.match(link,/rel="noopener noreferrer"/);assert.match(link,/referrerpolicy="no-referrer"/);
 assert.doesNotMatch(html.slice(html.indexOf('<dialog id="argo-dialog"')),/<input[^>]+type=["']password["']/i);
 assert.match(html,/Sincronizzazione non attiva/);
});
