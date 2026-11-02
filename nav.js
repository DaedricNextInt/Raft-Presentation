// Shared navigation: hamburger menu, slide counter, and ←/→ slide transitions.
// Load from <head> (blocking) so the entrance overlay can cover the page before first paint.
(function(){
const pages=[['index.html','Raft & How Vault uses it','Title page'],['raft_dark_mode.html','Consensus in Motion','What Raft is, leader election, and replication',['Introduction: What Is Raft?','Distributed Systems Basics']],['raft_log_consistency.html','How Raft Keeps Data Consistent','Log append, replicate, commit'],['raft_vault_storage.html','How Vault Uses Raft','Integrated Storage and quorum writes'],['raft_failover.html','Failure Recovery','Node failure, failover, and recovery'],['raft_bank_example.html','A Bank\'s Vault Cluster','Real-world scenarios'],['raft_key_takeaways.html','Key Takeaways','Raft consensus in Vault'],['raft_sources.html','Sources','References and further reading']];
window.RAFT_PAGES=pages;
const file=decodeURIComponent(location.pathname.split('/').pop())||pages[0][0];
const idx=Math.max(0,pages.findIndex(p=>p[0]===file));
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
let dir=0;try{dir=reduce?0:+sessionStorage.getItem('raftdir')||0;sessionStorage.removeItem('raftdir')}catch(e){}
window.raftArrivalDir=dir;
const num=i=>String(i+1).padStart(2,'0');
const st=document.createElement('style');
st.textContent=`body{padding-top:76px!important;padding-bottom:76px!important}
.navwrap{position:fixed;top:16px;left:16px;z-index:100;font-family:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif}.navbtn{width:44px;height:44px;padding:0;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:5px;background:#1a293e;border:1px solid #41516a;border-radius:12px;cursor:pointer}.navbtn:hover{background:#2b3b55}.navbtn i{display:block;width:20px;height:2px;background:#eef2ff;border-radius:2px;transition:transform .2s,opacity .2s}.navbtn[aria-expanded=true] i:nth-child(1){transform:translateY(7px) rotate(45deg)}.navbtn[aria-expanded=true] i:nth-child(2){opacity:0}.navbtn[aria-expanded=true] i:nth-child(3){transform:translateY(-7px) rotate(-45deg)}.navmenu{display:none;margin-top:8px;min-width:260px;background:#101827;border:1px solid #29354b;border-radius:14px;padding:8px;box-shadow:0 18px 50px #0008}.navmenu.open{display:block}.navmenu a{display:block;padding:10px 12px;border-radius:9px;color:#eef2ff;text-decoration:none;font-weight:750;font-size:14px}.navmenu a small{display:block;color:#8fa1ba;font-weight:500;font-size:12px;margin-top:2px}.navmenu a:hover{background:#1a293e}.navmenu a.cur{background:#2a2150;color:#cbb2ff}.navmenu .lbl{font-size:11px;letter-spacing:1.4px;color:#8fa1ba;padding:6px 12px 4px;font-weight:800}
.rtbar{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);z-index:100;display:flex;align-items:center;gap:12px;background:#101827d9;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border:1px solid #29354b;border-radius:999px;padding:6px 8px;font-family:Inter,ui-sans-serif,system-ui,sans-serif;box-shadow:0 10px 30px #0006}.rtbar button{width:32px;height:32px;padding:0;border-radius:50%;border:1px solid #41516a;background:#1a293e;color:#eef2ff;font-size:15px;cursor:pointer}.rtbar button:hover:not(:disabled){background:#7547d5;border-color:#7547d5}.rtbar button:disabled{opacity:.3;cursor:default}.rtbar .dots{display:flex;gap:6px;align-items:center}.rtbar .dots i{width:7px;height:7px;border-radius:50%;background:#41516a;transition:all .3s}.rtbar .dots i.on{width:22px;border-radius:6px;background:linear-gradient(90deg,#7547d5,#38b6f5)}.rtbar .cnt{font-size:12px;font-weight:800;color:#8fa1ba;min-width:42px;text-align:center}
#rt{position:fixed;inset:0;z-index:1000;pointer-events:none;visibility:hidden;overflow:hidden}#rt>*{position:absolute;inset:0;will-change:transform}#rt .s0{background:linear-gradient(135deg,#7547d5,#5b34b8)}#rt .s1{background:linear-gradient(135deg,#38b6f5,#2b8fd1)}#rt .s2{background:linear-gradient(135deg,#20c8ad,#14a08a)}#rt .plate{background:radial-gradient(ellipse at 30% 20%,#211a3c 0%,#090d18 65%);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;font-family:Inter,ui-sans-serif,system-ui,sans-serif;padding:20px}#rt .n{font-size:clamp(70px,16vw,190px);font-weight:900;letter-spacing:-6px;line-height:1;background:linear-gradient(100deg,#fff 20%,#cbb2ff 60%,#7be3d3);-webkit-background-clip:text;background-clip:text;color:transparent}#rt .t{font-size:clamp(20px,3.4vw,38px);font-weight:800;color:#eef2ff;margin-top:8px;letter-spacing:-.5px}#rt .u{font-size:clamp(13px,1.6vw,17px);color:#8fa1ba;margin-top:8px}`;
document.head.appendChild(st);
const ov=document.createElement('div');ov.id='rt';
// Arriving forward on a slide that opens with an intro view shows the intro's title on the card.
const plateHTML=(i,d)=>{const p=pages[i],t=d>0&&p[3]?[p[3][0],p[3][1]]:[p[1],p[2]];return `<div class="n">${num(i)}</div><div class="t">${t[0].replace(/&/g,'&amp;')}</div><div class="u">${t[1]}</div>`};
ov.innerHTML='<div class="s0"></div><div class="s1"></div><div class="s2"></div><div class="plate"></div>';
document.documentElement.appendChild(ov);
const layers=[...ov.children],plate=ov.querySelector('.plate');
const EASE='cubic-bezier(.76,0,.24,1)';
let busy=false,leaving=false;
const mainEl=()=>document.querySelector('main:not([hidden])')||document.body;
function hideOverlay(){if(leaving)return;busy=false;ov.style.visibility='hidden';layers.forEach(l=>{l.getAnimations().forEach(a=>a.cancel());l.style.transform=''})}
// Entrance: overlay already covering the page; hold briefly, then sweep it away while the slide flies in.
let busy0=false;if(dir){plate.innerHTML=plateHTML(idx,dir);ov.style.visibility='visible';busy0=true}
function enter(){
  const m=mainEl();if(busy0)busy=true;
  if(!dir){if(!reduce)m.animate([{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'none'}],{duration:600,easing:'ease-out'});return}
  m.animate([{opacity:0,transform:`translateX(${70*dir}px) scale(1.04)`},{opacity:1,transform:'none'}],{duration:850,delay:1150,easing:'cubic-bezier(.2,.8,.2,1)',fill:'backwards'});
  const out=[3,2,1,0].map((li,k)=>layers[li].animate([{transform:'translateX(0)'},{transform:`translateX(${-100*dir}%)`}],{duration:700,delay:1000+k*100,easing:EASE,fill:'forwards'}));
  Promise.allSettled(out.map(a=>a.finished)).then(hideOverlay);
  setTimeout(hideOverlay,4500);
  setTimeout(()=>{if(!leaving)busy=false},4600);
}
// Exit: stripes sweep over the page, then the destination's title plate lands, then we navigate.
function go(to){
  if(busy)return;
  if(to<0||to>=pages.length){bump(to<0?-1:1);return}
  const d=to>idx?1:-1;
  if(reduce){location.href=pages[to][0];return}
  busy=true;leaving=true;plate.innerHTML=plateHTML(to,d);ov.style.visibility='visible';
  mainEl().animate([{opacity:1,transform:'none'},{opacity:0,transform:`translateX(${-70*d}px) scale(.94)`}],{duration:700,easing:'cubic-bezier(.6,0,.8,.4)',fill:'forwards'});
  const ins=layers.map((l,k)=>l.animate([{transform:`translateX(${100*d}%)`},{transform:'translateX(0)'}],{duration:700,delay:k*110,easing:EASE,fill:'both'}));
  Promise.all(ins.map(a=>a.finished)).then(()=>{try{sessionStorage.setItem('raftdir',String(d))}catch(e){}location.href=pages[to][0]}).catch(()=>{location.href=pages[to][0]});
}
const step=d=>{if(busy)return;if(window.raftSub&&window.raftSub(d))return;go(idx+d)};
function bump(d){const m=mainEl();m.animate([{transform:'none'},{transform:`translateX(${-24*d}px)`},{transform:'none'}],{duration:320,easing:'ease-out'})}
addEventListener('keydown',e=>{
  if(e.altKey||e.ctrlKey||e.metaKey||e.shiftKey)return;
  const t=e.target&&e.target.tagName;if(t==='INPUT'||t==='SELECT'||t==='TEXTAREA')return;
  if(e.key==='ArrowRight'){e.preventDefault();step(1)}else if(e.key==='ArrowLeft'){e.preventDefault();step(-1)}
});
addEventListener('pageshow',e=>{if(e.persisted){busy=false;leaving=false;hideOverlay();mainEl().getAnimations().forEach(a=>a.cancel())}});
document.addEventListener('DOMContentLoaded',()=>{
  const w=document.createElement('nav');w.className='navwrap';w.setAttribute('aria-label','Pages');
  w.innerHTML='<button class="navbtn" aria-label="Menu" aria-expanded="false" aria-haspopup="true"><i></i><i></i><i></i></button><div class="navmenu"><div class="lbl">RAFT PRESENTATION</div>'+pages.map((p,i)=>`<a href="${p[0]}" data-i="${i}"${i===idx?' class="cur" aria-current="page"':''}>${p[1].replace(/&/g,'&amp;')}<small>${p[2]}</small></a>`).join('')+'</div>';
  document.body.prepend(w);
  const b=w.querySelector('button'),m=w.querySelector('.navmenu');
  const set=o=>{m.classList.toggle('open',o);b.setAttribute('aria-expanded',o)};
  b.onclick=e=>{e.stopPropagation();set(!m.classList.contains('open'))};
  m.addEventListener('click',e=>{const a=e.target.closest('a');if(a&&!e.metaKey&&!e.ctrlKey){e.preventDefault();set(false);const i=+a.dataset.i;if(i!==idx)go(i)}});
  document.addEventListener('click',e=>{if(!w.contains(e.target))set(false)});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')set(false)});
  const bar=document.createElement('div');bar.className='rtbar';
  bar.innerHTML=`<button aria-label="Previous slide" ${idx===0?'disabled':''}>←</button><div class="dots">${pages.map((p,i)=>`<i class="${i===idx?'on':''}" title="${p[1].replace(/&/g,'&amp;')}"></i>`).join('')}</div><span class="cnt">${idx+1} / ${pages.length}</span><button aria-label="Next slide" ${idx===pages.length-1?'disabled':''}>→</button>`;
  const [pb,nb]=bar.querySelectorAll('button');pb.onclick=()=>step(-1);nb.onclick=()=>step(1);
  document.body.appendChild(bar);
  enter();
});
})();
