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
function count(d){quantity=Math.max(1,Math.min(20,quantity+d));document.querySelector('#quantity').textContent=quantity;document.querySelector('#minus').disabled=quantity===1;document.querySelector('#plus').disabled=quantity===20}document.querySelector('#minus').addEventListener('click',()=>count(-1));document.querySelector('#plus').addEventListener('click',()=>count(1));count(0);
document.querySelector('#back-explore').addEventListener('click',()=>{order.close();showCard(current)});
