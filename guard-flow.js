// The Guard picture: your team on the right, Guard in the middle, MCP tools on the left. Allowed calls
// pass through to the tool; a call that person isn't allowed stops at Guard in red. Same rules as the
// sample rules table at the top of guard.html. On a phone it stacks top to bottom. With "reduce motion"
// it shows one still frame. It only runs while it is on screen.
(function () {
  var box = document.getElementById('flow-pic');
  if (!box) return;
  var NS = 'http://www.w3.org/2000/svg';
  var TOOLS = ['jira.read_ticket', 'orders.search', 'orders.refund', 'github.create_pr', 'github.delete_repo'];
  var PEOPLE = [
    { name: 'Priya', team: 'support', ok: [0, 1] },
    { name: 'Dev', team: 'engineering', ok: [0, 3] },
    { name: 'Sam', team: 'finance', ok: [0, 1, 2] },
  ];
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var running = false, raf = 0, svg, note, core, halo, toolP, peopleP, dots = [], n = 0, last = 0, flash = 0, wide;

  function mk(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    parent.appendChild(e);
    return e;
  }
  function text(x, y, s, cls, anchor) {
    var t = mk('text', { x: x, y: y, class: cls, 'text-anchor': anchor || 'middle' }, svg);
    t.textContent = s;
    return t;
  }

  function draw() {
    box.textContent = '';
    dots = [];
    wide = box.clientWidth >= 460;
    var W = wide ? 760 : 360, H = wide ? 360 : 640;
    svg = mk('svg', { class: wide ? 'gf-wide' : '', viewBox: '0 0 ' + W + ' ' + H, width: '100%', role: 'img', 'aria-label': 'Each person on your team asks for MCP tools through Guard. Guard lets through only the tools that person is allowed, and stops the rest.' }, box);
    var G = wide ? { x: 380, y: 180 } : { x: 180, y: 300 };
    var toolPos = TOOLS.map(function (_, i) { return wide ? { x: 112, y: 70 + i * 56 } : { x: 180, y: 470 + i * 34 }; });
    var pplPos = PEOPLE.map(function (_, i) { return wide ? { x: 660, y: 100 + i * 80 } : { x: 60 + i * 120, y: 110 }; });

    if (wide) {
      text(112, 28, 'MCP TOOLS', 'gf-lab'); text(G.x, 28, 'QAMCP GUARD', 'gf-lab'); text(660, 28, 'YOUR TEAM', 'gf-lab');
    } else {
      text(180, 28, 'YOUR TEAM', 'gf-lab'); text(180, 210, 'QAMCP GUARD', 'gf-lab'); text(180, 448, 'MCP TOOLS', 'gf-lab');
    }

    toolP = toolPos.map(function (p) {
      var d = wide
        ? 'M' + (G.x - 42) + ' ' + G.y + ' C ' + (G.x - 100) + ' ' + G.y + ', ' + (p.x + 150) + ' ' + p.y + ', ' + (p.x + 98) + ' ' + p.y
        : 'M' + G.x + ' ' + (G.y + 42) + ' C ' + G.x + ' ' + (G.y + 110) + ', 40 ' + (G.y + 80) + ', 40 ' + (G.y + 150) + ' L 40 ' + (p.y - 10) + ' Q 40 ' + p.y + ', 50 ' + p.y + ' L ' + (p.x - 110) + ' ' + p.y;
      mk('path', { d: d, class: 'gf-line' }, svg);
      return mk('path', { d: d, fill: 'none', stroke: 'none' }, svg);
    });
    peopleP = pplPos.map(function (p) {
      var d = wide
        ? 'M' + (p.x - 75) + ' ' + p.y + ' C ' + (p.x - 150) + ' ' + p.y + ', ' + (G.x + 100) + ' ' + G.y + ', ' + (G.x + 42) + ' ' + G.y
        : 'M' + p.x + ' ' + (p.y + 26) + ' C ' + p.x + ' ' + (p.y + 100) + ', ' + G.x + ' ' + (G.y - 110) + ', ' + G.x + ' ' + (G.y - 42);
      mk('path', { d: d, class: 'gf-line' }, svg);
      return mk('path', { d: d, fill: 'none', stroke: 'none' }, svg);
    });

    TOOLS.forEach(function (t, i) {
      var p = toolPos[i], w = wide ? 196 : 220;
      mk('rect', { x: p.x - w / 2, y: p.y - 15, width: w, height: 30, rx: 8, class: i === 4 ? 'gf-box gf-risky' : 'gf-box' }, svg);
      text(p.x, p.y + 4, t, 'gf-t');
    });

    halo = mk('rect', { x: G.x - 46, y: G.y - 46, width: 92, height: 92, rx: 18, transform: 'rotate(45 ' + G.x + ' ' + G.y + ')', class: 'gf-halo' }, svg);
    core = mk('rect', { x: G.x - 32, y: G.y - 32, width: 64, height: 64, rx: 14, transform: 'rotate(45 ' + G.x + ' ' + G.y + ')', class: 'gf-core' }, svg);
    var g = mk('g', { class: 'gf-shield', transform: 'translate(' + (G.x - 12) + ' ' + (G.y - 13) + ')' }, svg);
    mk('path', { d: 'M12 1 L22 5 V12 C22 18 17.5 22.5 12 25 C6.5 22.5 2 18 2 12 V5 Z', fill: 'none', 'stroke-width': 1.8, 'stroke-linejoin': 'round' }, g);
    mk('path', { d: 'M7.5 13 L11 16.5 L17 9.5', fill: 'none', 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);

    PEOPLE.forEach(function (who, i) {
      var p = pplPos[i];
      if (wide) {
        mk('rect', { x: p.x - 75, y: p.y - 24, width: 160, height: 48, rx: 24, class: 'gf-box' }, svg);
        mk('circle', { cx: p.x - 50, cy: p.y, r: 15, class: 'gf-av' }, svg);
        text(p.x - 50, p.y + 4, who.name[0], 'gf-t gf-ini');
        text(p.x - 26, p.y - 2, who.name, 'gf-t', 'start');
        text(p.x - 26, p.y + 13, who.team, 'gf-s', 'start');
      } else {
        mk('circle', { cx: p.x, cy: p.y, r: 22, class: 'gf-av' }, svg);
        text(p.x, p.y + 5, who.name[0], 'gf-t gf-ini');
        text(p.x, p.y - 34, who.name, 'gf-t');
        text(p.x, p.y + 42, who.team, 'gf-s');
      }
    });

    note = text(G.x, wide ? G.y + 82 : G.y + 76, '', 'gf-note');
    if (still) { note.textContent = "Dev can't use orders.refund"; note.style.opacity = 1; core.classList.add('gf-stop'); }
  }

  function spawn() {
    var pi = Math.floor(Math.random() * PEOPLE.length), who = PEOPLE[pi], bad = n++ % 4 === 3, ti;
    if (bad) {
      var no = TOOLS.map(function (_, i) { return i; }).filter(function (i) { return who.ok.indexOf(i) < 0; });
      ti = no[Math.floor(Math.random() * no.length)];
    } else ti = who.ok[Math.floor(Math.random() * who.ok.length)];
    var c = mk('circle', { r: 4.5, class: bad ? 'gf-dot gf-bad' : 'gf-dot' }, svg);
    dots.push({ c: c, p: peopleP[pi], next: toolP[ti], t: 0, leg: 0, bad: bad, who: who.name, tool: TOOLS[ti] });
  }

  function step(ts) {
    var dt = Math.min(50, ts - (last || ts)); last = ts;
    if (Math.random() < dt / 650) spawn();
    for (var k = dots.length - 1; k >= 0; k--) {
      var d = dots[k];
      d.t += dt / 1400;
      if (d.t >= 1) {
        if (d.leg === 0 && !d.bad) { d.leg = 1; d.t = 0; d.p = d.next; }
        else {
          if (d.bad) { flash = 1; note.textContent = d.who + " can't use " + d.tool; }
          d.c.remove(); dots.splice(k, 1); continue;
        }
      }
      var L = d.p.getTotalLength(), pt = d.p.getPointAtLength(L * d.t);
      d.c.setAttribute('cx', pt.x); d.c.setAttribute('cy', pt.y);
    }
    flash = Math.max(0, flash - dt / 1800);
    note.style.opacity = flash;
    core.classList.toggle('gf-stop', flash > 0.3);
    halo.style.opacity = 0.35 + 0.3 * Math.sin(ts / 500);
    if (running) raf = requestAnimationFrame(step);
  }

  function play(on) {
    if (still || on === running) return;
    running = on;
    if (on) { last = 0; raf = requestAnimationFrame(step); } else cancelAnimationFrame(raf);
  }

  draw();
  if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { play(e[0].isIntersecting); }).observe(box);
  else play(true);
  var rw;
  window.addEventListener('resize', function () {
    clearTimeout(rw);
    rw = setTimeout(function () { if ((box.clientWidth >= 460) !== wide) { var was = running; play(false); draw(); play(was); } }, 150);
  });
})();
