const METAS=[
  {k:'steps',nom:'👟 Pasos',meta:10000,paso:[500,1000]},
  {k:'abs',nom:'💪 Abdominales',meta:100,paso:[10,25]},
  {k:'push',nom:'🏋️ Flexiones',meta:100,paso:[10,25]},
  {k:'squats',nom:'🦵 Sentadillas',meta:100,paso:[10,25]},
];
const KEY='reto-diario-v1';
let db=cargar();
let vista=new Date();vista.setDate(1);

function cargar(){try{return JSON.parse(localStorage.getItem(KEY))||{days:{},cfg:{hora:'20:00',on:false}}}catch{return{days:{},cfg:{hora:'20:00',on:false}}}}
function guardar(){try{localStorage.setItem(KEY,JSON.stringify(db))}catch{}}
const $=s=>document.querySelector(s);
const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const hoy=()=>iso(new Date());
const dia=f=>db.days[f]||{};
const pct=(f)=>{const d=dia(f);return METAS.reduce((s,m)=>s+Math.min(1,(d[m.k]||0)/m.meta),0)/METAS.length};
const completo=f=>METAS.every(m=>(dia(f)[m.k]||0)>=m.meta);
const fmt=n=>n.toLocaleString('es');

function set(f,k,v){db.days[f]=db.days[f]||{};db.days[f][k]=Math.max(0,Math.round(v)||0);guardar();render()}

function rachas(){
  let actual=0,d=new Date();
  if(!completo(iso(d)))d.setDate(d.getDate()-1);
  while(completo(iso(d))){actual++;d.setDate(d.getDate()-1)}
  const fs=Object.keys(db.days).filter(completo).sort();
  let rec=0,run=0,prev=null;
  for(const f of fs){
    if(prev){const n=new Date(prev);n.setDate(n.getDate()+1);run=iso(n)===f?run+1:1}else run=1;
    rec=Math.max(rec,run);prev=f;
  }
  return{actual,rec};
}

function renderMetas(){
  const f=hoy(),d=dia(f);
  $('#metas').innerHTML=METAS.map(m=>{
    const v=d[m.k]||0,p=Math.min(100,v/m.meta*100);
    return `<div class="meta ${v>=m.meta?'done':''}">
      <div class="top"><span class="nom">${m.nom}</span><span class="val">${fmt(v)} / ${fmt(m.meta)}</span></div>
      <div class="bar"><i style="width:${p}%"></i></div>
      <div class="btns">
        <button data-k="${m.k}" data-d="-${m.paso[0]}">−${m.paso[0]}</button>
        <button data-k="${m.k}" data-d="${m.paso[0]}">+${m.paso[0]}</button>
        <button data-k="${m.k}" data-d="${m.paso[1]}">+${fmt(m.paso[1])}</button>
        <button data-k="${m.k}" data-e="1">✏️</button>
      </div></div>`}).join('');
  const b=$('#banner');
  if(completo(f)){b.hidden=false;b.className='banner';b.textContent='🎉 ¡Reto de hoy completado!'}
  else{const falta=METAS.filter(m=>(d[m.k]||0)<m.meta).length;b.hidden=true}
}

function renderCal(){
  const y=vista.getFullYear(),m=vista.getMonth();
  $('#mesTitulo').textContent=vista.toLocaleDateString('es',{month:'long',year:'numeric'});
  const primero=(new Date(y,m,1).getDay()+6)%7,dias=new Date(y,m+1,0).getDate(),h=hoy();
  let html='LMXJVSD'.split('').map(c=>`<b>${c}</b>`).join('')+'<span class="vacio"></span>'.repeat(primero);
  for(let i=1;i<=dias;i++){
    const f=iso(new Date(y,m,i)),p=pct(f);
    const cls=completo(f)?'ok':p>0?'part':'';
    html+=`<button data-f="${f}" class="${cls} ${f===h?'hoy':''} ${f>h?'fut':''}">${i}</button>`;
  }
  $('#cal').innerHTML=html;
}

function renderGrafica(){
  let html='';
  for(let i=13;i>=0;i--){
    const d=new Date();d.setDate(d.getDate()-i);const f=iso(d),p=Math.round(pct(f)*100);
    html+=`<div title="${f}: ${p}%"><i class="${completo(f)?'full':''}" style="height:${p}%"></i>${d.getDate()}</div>`;
  }
  $('#grafica').innerHTML=html;
}

function render(){
  $('#fecha').textContent=new Date().toLocaleDateString('es',{weekday:'long',day:'numeric',month:'long'});
  const r=rachas();$('#racha').textContent=r.actual;$('#record').textContent=`récord ${r.rec}`;
  renderMetas();renderCal();renderGrafica();
}

function editar(f,k){
  const m=METAS.find(x=>x.k===k);
  const modal=$('#detalle');modal.hidden=false;
  modal.innerHTML=`<div class="box"><h2>${m.nom} · ${f}</h2>
    <label>Cantidad<input type="number" id="val" min="0" inputmode="numeric" value="${dia(f)[k]||0}"></label>
    <div class="btns"><button id="cancel">Cancelar</button><button id="ok" style="background:#16a34a">Guardar</button></div></div>`;
  $('#val').focus();$('#val').select();
  $('#cancel').onclick=()=>modal.hidden=true;
  $('#ok').onclick=()=>{set(f,k,+$('#val').value);modal.hidden=true};
}

function editarDia(f){
  if(f>hoy())return;
  const modal=$('#detalle');modal.hidden=false;
  modal.innerHTML=`<div class="box"><h2>${f}</h2>`+METAS.map(m=>`<label>${m.nom}<input type="number" min="0" inputmode="numeric" data-k="${m.k}" value="${dia(f)[m.k]||0}"></label>`).join('')+
    `<div class="btns"><button id="cancel">Cancelar</button><button id="ok" style="background:#16a34a">Guardar</button></div></div>`;
  $('#cancel').onclick=()=>modal.hidden=true;
  $('#ok').onclick=()=>{db.days[f]=db.days[f]||{};modal.querySelectorAll('input').forEach(i=>db.days[f][i.dataset.k]=Math.max(0,Math.round(+i.value)||0));guardar();modal.hidden=true;render()};
}

$('#metas').onclick=e=>{
  const b=e.target.closest('button');if(!b)return;
  const f=hoy();
  if(b.dataset.e)return editar(f,b.dataset.k);
  set(f,b.dataset.k,(dia(f)[b.dataset.k]||0)+ +b.dataset.d);
};
$('#cal').onclick=e=>{const b=e.target.closest('button');if(b)editarDia(b.dataset.f)};
$('#prev').onclick=()=>{vista.setMonth(vista.getMonth()-1);renderCal()};
$('#next').onclick=()=>{vista.setMonth(vista.getMonth()+1);renderCal()};
$('#detalle').onclick=e=>{if(e.target.id==='detalle')e.target.hidden=true};

// Recordatorio (funciona mientras la app esté abierta o en segundo plano reciente)
$('#hora').value=db.cfg.hora;$('#recOn').checked=db.cfg.on;
$('#hora').onchange=e=>{db.cfg.hora=e.target.value;guardar()};
$('#recOn').onchange=async e=>{
  if(e.target.checked&&'Notification' in window&&Notification.permission==='default')await Notification.requestPermission();
  db.cfg.on=e.target.checked;guardar();
};
let avisado=null;
function chequearRecordatorio(){
  if(!db.cfg.on||completo(hoy()))return;
  const n=new Date(),hm=`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`;
  if(hm>=db.cfg.hora&&avisado!==hoy()){
    avisado=hoy();
    const b=$('#banner');b.hidden=false;b.className='banner warn';b.textContent='⏰ Aún te faltan metas por completar hoy';
    if('Notification' in window&&Notification.permission==='granted')new Notification('Reto Diario',{body:'Aún te faltan metas por completar hoy 💪',icon:'icon.svg'});
  }
}
let diaMostrado=hoy();
setInterval(()=>{if(hoy()!==diaMostrado){diaMostrado=hoy();vista=new Date();vista.setDate(1);render()}chequearRecordatorio()},30000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden){render();chequearRecordatorio()}});

// Copia de seguridad
$('#exp').onclick=()=>{
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([JSON.stringify(db)],{type:'application/json'}));
  a.download=`reto-diario-${hoy()}.json`;a.click();
};
$('#imp').onclick=()=>$('#file').click();
$('#file').onchange=async e=>{
  try{const j=JSON.parse(await e.target.files[0].text());if(!j.days)throw 0;db=j;db.cfg=db.cfg||{hora:'20:00',on:false};guardar();render();alert('Copia importada')}
  catch{alert('Archivo no válido')}
};

if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
render();chequearRecordatorio();
