import './fuglekort-box.js';
const box=document.querySelector('fuglekort-box');
const viewer=document.querySelector('#viewer'),order=document.querySelector('#order');
let cards=[],current=0,quantity=1;
const editionNames={photos:'Ekte bilder',illustrations:'Illustrasjoner for barn'};
function showDialog(el){if(!el.open){el.showModal();document.body.classList.add('modal-open')}}
function showCard(i){if(!cards.length)return;current=(i+cards.length)%cards.length;const c=cards[current];document.querySelector('#large-card').src=c.image;document.querySelector('#large-card').alt=`${c.name} – ${editionNames[box.edition]}`;document.querySelector('#card-counter').textContent=`${c.name} · ${String(current+1).padStart(2,'0')} / ${cards.length} · ${editionNames[box.edition]}`;showDialog(viewer)}
box.addEventListener('cards-ready',e=>{cards=e.detail.slice(0,5);const rail=document.querySelector('#card-rail');rail.replaceChildren();cards.forEach((c,i)=>{const b=document.createElement('button');b.className='card-tile';b.setAttribute('aria-label',`Se kortet for ${c.name}`);b.innerHTML=`<img src="${c.image}" alt="${c.name}" loading="lazy" width="${c.width}" height="${c.height}"><span class="card-label"><span>${c.name}</span><small>${c.number} ↗</small></span>`;b.addEventListener('click',()=>showCard(i));rail.append(b)});
 const label=editionNames[box.edition];
 document.querySelectorAll('[data-edition]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.edition===box.edition)));
 document.querySelector('#edition-note').textContent=`${label} · 5 kort fra kortstokken`;
 document.querySelector('#order-edition').textContent=`Versjon: ${label}`;
 if(viewer.open)showCard(current);
});
document.querySelectorAll('[data-edition]').forEach(b=>b.addEventListener('click',()=>box.setEdition(b.dataset.edition)));
box.addEventListener('inspect-card',e=>showCard(e.detail.index));
document.querySelector('#explore').addEventListener('click',()=>{box.toggle(true);if(innerWidth<760)box.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth',block:'center'})});
document.querySelectorAll('[data-order]').forEach(b=>b.addEventListener('click',()=>showDialog(order)));
document.querySelectorAll('dialog').forEach(d=>{d.querySelector('[data-close]').addEventListener('click',()=>d.close());d.addEventListener('close',()=>{document.body.classList.remove('modal-open')});d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()}})});
viewer.querySelector('.prev').addEventListener('click',()=>showCard(current-1));viewer.querySelector('.next').addEventListener('click',()=>showCard(current+1));
viewer.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){e.preventDefault();showCard(current-1)}if(e.key==='ArrowRight'){e.preventDefault();showCard(current+1)}});
let tx=null;viewer.addEventListener('touchstart',e=>{tx=e.touches[0].clientX},{passive:true});viewer.addEventListener('touchend',e=>{if(tx!==null&&Math.abs(e.changedTouches[0].clientX-tx)>45)showCard(current+(e.changedTouches[0].clientX<tx?1:-1));tx=null},{passive:true});
const rail=document.querySelector('#card-rail');for(const [id,dir] of [['scroll-left',-1],['scroll-right',1]])document.getElementById(id).addEventListener('click',()=>rail.scrollBy({left:dir*rail.clientWidth*.75,behavior:'smooth'}));
function count(d){quantity=Math.max(1,Math.min(20,quantity+d));document.querySelector('#quantity').textContent=quantity;document.querySelector('#minus').disabled=quantity===1;document.querySelector('#plus').disabled=quantity===20;updateTotal()}document.querySelector('#minus').addEventListener('click',()=>count(-1));document.querySelector('#plus').addEventListener('click',()=>count(1));
document.querySelector('#back-explore').addEventListener('click',()=>{order.close();showCard(current)});

/* Bestillingslisten: påmeldingen lagres i Supabase (tabellen i supabase/forhandsbestillinger.sql).
   Nettsiden kan bare legge inn påmeldinger og hente tellertallene, aldri lese navn, e-post eller mobil. */
const SUPA={url:'https://qfustbltxgbpwsntcrpd.supabase.co',key:'sb_publishable_tQmgTjIyvYtMLJRL3o2Vaw_o2sYYpYt'};
const PRICE=199,SHIPPING=69,GOAL=100,CONTACT='post.fuglekort@gmail.com';
const form=document.querySelector('#order-form'),formError=document.querySelector('#form-error'),submit=document.querySelector('#order-submit');
const kr=n=>`${n.toLocaleString('nb-NO')} kr`;
const decks=n=>`${n} kortstokk${n===1?'':'er'}`;
const delivery=()=>form.elements.levering.value;
function updateTotal(){const post=delivery()==='post',sum=quantity*PRICE+(post?SHIPPING:0);document.querySelector('#total-detail').textContent=`${decks(quantity)} ${kr(quantity*PRICE)}${post?` + frakt ${kr(SHIPPING)}`:', hentes'}`;document.querySelector('#total-sum').textContent=kr(sum);document.querySelector('#address-fields').hidden=!post}
form.addEventListener('change',e=>{if(e.target.name==='levering')updateTotal()});
count(0);

function supa(path,body,headers={}){return fetch(SUPA.url+path,{method:'POST',headers:{apikey:SUPA.key,'Content-Type':'application/json',...headers},body:JSON.stringify(body)})}
async function loadProgress(){try{const r=await supa('/rest/v1/rpc/forhandsbestilling_status',{});if(!r.ok)return;const s=await r.json(),n=Number(s.totalt)||0;
 document.querySelector('#progress-text').textContent=n>=GOAL?`${n} kortstokker bestilt. Målet er nådd!`:`${n} av ${GOAL} kortstokker bestilt`;
 document.querySelector('#progress-split').textContent=n?`Ekte bilder ${s.foto} · Illustrasjoner ${s.illustrasjoner}`:'';
 document.querySelector('#progress-fill').style.width=`${Math.min(100,n/GOAL*100)}%`;
 document.querySelector('.progress-bar').setAttribute('aria-valuenow',String(Math.min(GOAL,n)));
 document.querySelector('#list-progress').hidden=false}catch(e){}}
document.querySelectorAll('[data-order]').forEach(b=>b.addEventListener('click',loadProgress));

const phone=v=>v.replace(/[\s.()-]/g,'').replace(/^(\+47|0047)/,'');
function validate(f){const v=k=>f.elements[k].value.trim(),post=delivery()==='post';
 if(v('navn').length<2)return['navn','Skriv inn navnet ditt.'];
 if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v('epost')))return['epost','Skriv inn en gyldig e-postadresse.'];
 if(!/^[49]\d{7}$/.test(phone(v('mobil'))))return['mobil','Skriv inn et norsk mobilnummer med 8 siffer.'];
 if(post&&v('adresse').length<3)return['adresse','Skriv inn adressen kortene skal sendes til.'];
 if(post&&!/^\d{4}$/.test(v('postnummer')))return['postnummer','Postnummeret skal ha 4 siffer.'];
 if(post&&v('poststed').length<2)return['poststed','Skriv inn poststedet.'];
 if(!f.elements.samtykke.checked)return['samtykke','Du må godta vilkårene og Vipps-forespørselen for å sette deg på listen.'];
 return null}
function showError(msg,field){formError.textContent=msg;formError.hidden=false;if(field){const el=form.elements[field];el.setAttribute('aria-invalid','true');el.focus()}}
function clearError(){formError.hidden=true;form.querySelectorAll('[aria-invalid]').forEach(el=>el.removeAttribute('aria-invalid'))}
form.addEventListener('input',e=>{if(e.target.getAttribute('aria-invalid')){e.target.removeAttribute('aria-invalid');formError.hidden=true}});
function showDone(d){const post=d.levering==='post';document.querySelector('#done-summary').textContent=`${decks(d.antall)}, ${editionNames[d.versjon==='foto'?'photos':'illustrations'].toLowerCase()}, ${post?'sendes i posten':'hentes i Oslo'}. Blir kortene trykket, er prisen ${kr(d.antall*PRICE+(post?SHIPPING:0))}${post?' med frakt':''}.`;
 document.querySelector('#order-start').hidden=true;const done=document.querySelector('#order-done');done.hidden=false;done.focus();order.scrollTop=0}
document.querySelector('#order-again').addEventListener('click',()=>{form.reset();quantity=1;count(0);clearError();document.querySelector('#order-done').hidden=true;document.querySelector('#order-start').hidden=false;form.elements.navn.focus()});

form.addEventListener('submit',async e=>{e.preventDefault();clearError();
 const post=delivery()==='post',v=k=>form.elements[k].value.trim();
 const d={navn:v('navn'),epost:v('epost').toLowerCase(),mobil:phone(v('mobil')),antall:quantity,versjon:box.edition==='illustrations'?'illustrasjoner':'foto',levering:post?'post':'hent',adresse:post?v('adresse'):null,postnummer:post?v('postnummer'):null,poststed:post?v('poststed'):null,samtykke:form.elements.samtykke.checked};
 if(v('nettside')){showDone(d);return}                     // fylt ut av en robot
 const bad=validate(form);if(bad){showError(bad[1],bad[0]);return}
 submit.disabled=true;submit.firstChild.textContent='Sender … ';
 try{const r=await supa('/rest/v1/forhandsbestillinger?columns=navn,epost,mobil,antall,versjon,levering,adresse,postnummer,poststed,samtykke',d,{Prefer:'return=minimal'});
  if(r.ok){showDone(d);loadProgress();return}
  let j={};try{j=await r.json()}catch(x){}
  if(r.status===409||j.code==='23505')showError(`Denne e-postadressen står allerede på listen. Vil du endre noe, skriv til ${CONTACT}.`,'epost');
  else if(j.code==='P0001'&&j.message)showError(j.message);
  else showError(`Påmeldingen ble ikke lagret. Prøv igjen, eller skriv til ${CONTACT}.`)}
 catch(x){showError('Fikk ikke kontakt. Sjekk nettet og prøv igjen.')}
 finally{submit.disabled=false;submit.firstChild.textContent='Sett meg på listen '}});
