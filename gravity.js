// Anti-gravity background: particles drift upward, float, and are pushed away by the cursor.
(function(){
  const c = document.getElementById('gravity');
  if(!c) return;
  const ctx = c.getContext('2d');
  let w, h, dpr, parts = [];
  const mouse = {x:-9999, y:-9999};
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize(){
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = c.width = innerWidth * dpr; h = c.height = innerHeight * dpr;
    c.style.width = innerWidth + 'px'; c.style.height = innerHeight + 'px';
    const n = Math.round(Math.min(140, (innerWidth * innerHeight) / 11000));
    parts = Array.from({length:n}, () => make(Math.random() * h));
  }
  function make(y){
    const shapes = ['circle','ring','square','line'];
    return {
      x: Math.random() * w, y: y,
      r: (Math.random() * 3 + 1) * dpr * (Math.random() < .12 ? 3.5 : 1),
      vx: (Math.random() - .5) * .2 * dpr,
      vy: -(Math.random() * .45 + .12) * dpr,      // negative = rises (anti-gravity)
      a: Math.random() * Math.PI * 2, va: (Math.random() - .5) * .01,
      o: Math.random() * .55 + .15,
      s: shapes[Math.floor(Math.random() * shapes.length)],
      phase: Math.random() * 1000
    };
  }
  function step(t){
    ctx.clearRect(0, 0, w, h);
    // links between near particles
    ctx.lineWidth = .6 * dpr;
    for(let i = 0; i < parts.length; i++){
      for(let j = i + 1; j < parts.length; j++){
        const a = parts[i], b = parts[j], dx = a.x - b.x, dy = a.y - b.y, d = dx*dx + dy*dy, max = (110*dpr)**2;
        if(d < max){ ctx.strokeStyle = `rgba(255,255,255,${(1 - d/max) * .12})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
      }
    }
    for(const p of parts){
      // cursor repulsion
      const dx = p.x - mouse.x * dpr, dy = p.y - mouse.y * dpr, dist = Math.hypot(dx, dy), R = 160 * dpr;
      if(dist < R && dist > 0){ const f = (1 - dist / R) * 1.6; p.vx += dx / dist * f * .25; p.vy += dy / dist * f * .25; }
      // gentle sway + return to upward drift
      p.vx += Math.sin((t + p.phase) / 1400) * .004 * dpr;
      p.vx *= .985; p.vy = p.vy * .985 + (-(.25 * dpr)) * .015;
      p.x += p.vx; p.y += p.vy; p.a += p.va;
      if(p.y < -40) Object.assign(p, make(h + 40));
      if(p.x < -40) p.x = w + 40; if(p.x > w + 40) p.x = -40;

      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a);
      ctx.globalAlpha = p.o; ctx.strokeStyle = ctx.fillStyle = '#fff'; ctx.lineWidth = 1 * dpr;
      ctx.beginPath();
      if(p.s === 'circle'){ ctx.arc(0,0,p.r,0,Math.PI*2); ctx.fill(); }
      else if(p.s === 'ring'){ ctx.arc(0,0,p.r*1.6,0,Math.PI*2); ctx.stroke(); }
      else if(p.s === 'square'){ ctx.strokeRect(-p.r*1.3,-p.r*1.3,p.r*2.6,p.r*2.6); }
      else { ctx.moveTo(-p.r*2.5,0); ctx.lineTo(p.r*2.5,0); ctx.stroke(); }
      ctx.restore();
    }
    if(!reduce) requestAnimationFrame(step);
  }
  addEventListener('resize', resize);
  addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
  addEventListener('touchmove', e => { mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY; }, {passive:true});
  addEventListener('mouseleave', () => { mouse.x = mouse.y = -9999; });
  resize(); requestAnimationFrame(step);

  // mobile menu
  const b = document.querySelector('.burger'), m = document.querySelector('.nav ul');
  if(b) b.addEventListener('click', () => m.classList.toggle('open'));
})();
