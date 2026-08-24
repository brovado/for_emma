const pictures=[
  {src:'images/unicorn.svg',name:'a magical unicorn'},
  {src:'images/princess.svg',name:'a princess'},
  {src:'images/fairy.svg',name:'a fairy'},
  {src:'images/castle.svg',name:'a fairytale castle'}
];

const game=document.getElementById('game');
const bg=document.getElementById('bg');
const fog=document.getElementById('fog');
const fx=document.getElementById('fx');
const glass=document.getElementById('glass');
const hint=document.getElementById('hint');
const progress=document.getElementById('progress');
const progressText=document.getElementById('progressText');
const ctx=fog.getContext('2d');
const fctx=fx.getContext('2d');

let pictureIndex=0;
let finished=false;
let celebrationTimer=null;
let pictureLoadTimer=null;
let lastSpark=0;
let grid=[];
const COLS=24;
const ROWS=16;
const revealRadius=92;

function resetRevealState(){
  // Every picture gets its own completely fresh win condition.
  grid=Array.from({length:COLS*ROWS},()=>false);
  finished=false;
  progress.style.width='0%';
  progressText.textContent='0% revealed';
}

function resize(){
  fog.width=fx.width=window.innerWidth;
  fog.height=fx.height=window.innerHeight;
  resetRevealState();
  cover();
}

function cover(){
  ctx.globalCompositeOperation='source-over';
  ctx.fillStyle='#050505';
  ctx.fillRect(0,0,fog.width,fog.height);
  progress.style.width='0%';
  progressText.textContent='0% revealed';
}

function loadPicture(){
  clearTimeout(celebrationTimer);
  clearTimeout(pictureLoadTimer);

  // Reset BEFORE the next picture becomes playable. This prevents the
  // previous picture's revealed cells from satisfying the new win condition.
  resetRevealState();
  cover();

  bg.style.opacity='0';
  pictureLoadTimer=setTimeout(()=>{
    bg.style.backgroundImage=`url("${pictures[pictureIndex].src}")`;
    bg.style.transform='scale(1.02)';
    resetRevealState();
    cover();
    bg.style.opacity='1';
  },180);

  hint.textContent='Move the magnifying glass to reveal the magic!';
}

function markGrid(x,y){
  if(finished)return;

  const cellW=window.innerWidth/COLS;
  const cellH=window.innerHeight/ROWS;
  const r=Math.ceil(revealRadius/Math.min(cellW,cellH));
  const cx=Math.floor(x/cellW), cy=Math.floor(y/cellH);

  for(let gy=Math.max(0,cy-r);gy<=Math.min(ROWS-1,cy+r);gy++){
    for(let gx=Math.max(0,cx-r);gx<=Math.min(COLS-1,cx+r);gx++){
      const dx=(gx+.5)*cellW-x;
      const dy=(gy+.5)*cellH-y;
      if(Math.hypot(dx,dy)<=revealRadius) grid[gy*COLS+gx]=true;
    }
  }

  const revealed=grid.reduce((n,v)=>n+(v?1:0),0)/(COLS*ROWS);
  const pct=Math.floor(revealed*100);
  progress.style.width=pct+'%';
  progressText.textContent=pct+'% revealed';

  if(revealed>=.92) celebrate();
}

function reveal(x,y){
  if(finished)return;
  ctx.globalCompositeOperation='destination-out';
  ctx.beginPath();
  ctx.arc(x,y,revealRadius,0,Math.PI*2);
  ctx.fill();
  markGrid(x,y);
  addSpark(x,y);
}

function addSpark(x,y){
  const now=performance.now();
  if(now-lastSpark<55)return;
  lastSpark=now;
  const spark=document.createElement('div');
  spark.className='spark';
  spark.textContent=['✨','⭐','💖','🌈'][Math.floor(Math.random()*4)];
  spark.style.left=(x-10+Math.random()*20)+'px';
  spark.style.top=(y-10+Math.random()*20)+'px';
  game.appendChild(spark);
  setTimeout(()=>spark.remove(),700);
}

function fireworks(){
  const particles=[];
  for(let burst=0;burst<7;burst++){
    const ox=window.innerWidth*(.18+Math.random()*.64);
    const oy=window.innerHeight*(.18+Math.random()*.45);
    for(let i=0;i<42;i++){
      const a=(Math.PI*2*i)/42;
      const speed=2+Math.random()*5;
      particles.push({x:ox,y:oy,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:1,size:3+Math.random()*4,emoji:['✨','⭐','💖','🌟'][Math.floor(Math.random()*4)]});
    }
  }
  let frame=0;
  function animate(){
    fctx.clearRect(0,0,fx.width,fx.height);
    particles.forEach(p=>{
      p.x+=p.vx;
      p.y+=p.vy;
      p.vy+=.055;
      p.vx*=.992;
      p.life-=.018;
      fctx.globalAlpha=Math.max(0,p.life);
      fctx.font=p.size*5+'px sans-serif';
      fctx.fillText(p.emoji,p.x,p.y);
    });
    fctx.globalAlpha=1;
    if(frame++<90) requestAnimationFrame(animate);
    else fctx.clearRect(0,0,fx.width,fx.height);
  }
  animate();
}

function celebrate(){
  if(finished)return;
  finished=true;
  hint.textContent='You found it!';
  progress.style.width='100%';
  progressText.textContent='Magic complete!';
  fireworks();

  const celebration=document.createElement('div');
  celebration.className='celebrate';
  celebration.innerHTML=`<div class="celebrate-card">🎉 Amazing, Emma! 🎉<small>You found ${pictures[pictureIndex].name}! ✨</small></div>`;
  game.appendChild(celebration);

  celebrationTimer=setTimeout(()=>{
    celebration.remove();
    pictureIndex=(pictureIndex+1)%pictures.length;
    loadPicture();
  },2600);
}

function move(x,y){
  glass.style.left=x+'px';
  glass.style.top=y+'px';
  glass.style.transform='translate(-50%,-50%) rotate(-12deg) scale(1.08)';
  setTimeout(()=>glass.style.transform='translate(-50%,-50%) rotate(-12deg) scale(1)',70);
  reveal(x,y);
}

document.addEventListener('mousemove',e=>move(e.clientX,e.clientY));
document.addEventListener('touchmove',e=>{
  const t=e.touches[0];
  move(t.clientX,t.clientY);
},{passive:true});

window.addEventListener('resize',resize);
resize();
loadPicture();
