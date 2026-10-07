// ================= 1. DATA =================

// Map points. x and y are positions on the SVG map.
const nodes = {
  D:  { x: 60,  y: 150, name: 'Depot' },
  B1: { x: 170, y: 60,  name: 'Bin B1' },
  B2: { x: 170, y: 240, name: 'Bin B2' },
  B3: { x: 300, y: 140, name: 'Bin B3' },
  B4: { x: 300, y: 255, name: 'Bin B4' },
  B5: { x: 450, y: 60,  name: 'Bin B5' }
};

// Roads: [from, to, length in km]
const roads = [
  ['D',  'B1', 3.2],
  ['D',  'B2', 3.8],
  ['B1', 'B3', 4.1],
  ['B2', 'B3', 3.5],
  ['B2', 'B4', 3.0],
  ['B3', 'B4', 2.9],
  ['B3', 'B5', 4.6],
  ['B1', 'B5', 6.0]
];

// BACKEND: put your backend URL here (example: 'http://localhost:8080/api/bins').
// It must return JSON like: [{ "id": "B1", "street": "Main Street", "c": 82, "r": 3 }, ...]
// Leave it empty ('') to use the sample data below.
const API_URL = '';

// Bins: c = current fill %, r = fill rate (% per hour)
function makeBins() {
  return [
    { id: 'B1', street: 'Main Street',  c: 82, r: 3 },
    { id: 'B2', street: 'Station Road', c: 45, r: 2 },
    { id: 'B3', street: 'College Road', c: 88, r: 4 },
    { id: 'B4', street: 'Market Road',  c: 45, r: 2 },
    { id: 'B5', street: 'Bus Stand',    c: 91, r: 3 }
  ];
}

// ================= 2. STATE (values that change) =================
let bins = [];
let threshold = 75;       // collect bins at or above this %
let selected = null;      // bin the user clicked
let route = [];           // e.g. ['D','B1','B3','B5','D']
let legs = [];            // list of paths between stops
let totalKm = 0;
let busy = false;         // true while the truck is moving

// Shortcut for document.getElementById
function $(id) {
  return document.getElementById(id);
}

// Gets the bins from your backend, or uses sample data if API_URL is empty or fails
async function loadBins() {
  if (!API_URL) return makeBins();
  try {
    const response = await fetch(API_URL);
    return await response.json();
  } catch (error) {
    console.log('Backend not reachable, using sample data', error);
    return makeBins();
  }
}

// ================= 3. A* ALGORITHM =================

// Build "neighbors": for each point, which points are connected
const neighbors = {};
for (const id in nodes) {
  neighbors[id] = [];
}
roads.forEach(function (road) {
  const a = road[0];
  const b = road[1];
  const km = road[2];
  neighbors[a].push([b, km]);
  neighbors[b].push([a, km]);
});

// Straight-line distance in map pixels
function pixelDistance(a, b) {
  return Math.hypot(nodes[a].x - nodes[b].x, nodes[a].y - nodes[b].y);
}

// Smallest km-per-pixel ratio, so our guess never overestimates
const kmPerPixel = Math.min(
  ...roads.map(function (r) {
    return r[2] / pixelDistance(r[0], r[1]);
  })
);

// Heuristic = A*'s estimate of the distance still left
function heuristic(a, b) {
  return kmPerPixel * pixelDistance(a, b);
}

// Finds the shortest path from start to goal
function aStar(start, goal) {
  const open = [[heuristic(start, goal), start]];   // [score, point]
  const cost = {};                                   // km travelled so far
  const cameFrom = {};                               // to rebuild the path
  const closed = new Set();
  cost[start] = 0;

  while (open.length > 0) {
    open.sort(function (p, q) { return p[0] - q[0]; });   // lowest score first
    const current = open.shift()[1];

    // Reached the goal: walk backwards to build the path
    if (current === goal) {
      const path = [current];
      while (cameFrom[path[0]]) {
        path.unshift(cameFrom[path[0]]);
      }
      return { path: path, km: cost[goal] };
    }

    if (closed.has(current)) continue;
    closed.add(current);

    // Check every connected point
    neighbors[current].forEach(function (n) {
      const next = n[0];
      const newCost = cost[current] + n[1];
      if (cost[next] === undefined || newCost < cost[next]) {
        cost[next] = newCost;
        cameFrom[next] = current;
        open.push([newCost + heuristic(next, goal), next]);
      }
    });
  }
}

// ================= 4. ROUTE PLANNING =================

// Which bins need collecting, and in what order
function planRoute() {
  const todo = bins
    .filter(function (b) { return b.c >= threshold; })
    .sort(function (a, b) { return b.c - a.c; })
    .map(function (b) { return b.id; });

  route = ['D'];
  legs = [];
  totalKm = 0;
  let here = 'D';
  let left = todo.slice();

  // Repeatedly go to the best next bin (close + very full)
  while (left.length > 0) {
    let best = null;
    left.forEach(function (id) {
      const result = aStar(here, id);
      const fill = bins.find(function (b) { return b.id === id; }).c;
      const score = result.km - 0.06 * fill;     // fuller bins get a bonus
      if (best === null || score < best.score) {
        best = { id: id, result: result, score: score };
      }
    });
    legs.push(best.result.path);
    totalKm += best.result.km;
    here = best.id;
    route.push(here);
    left = left.filter(function (id) { return id !== best.id; });
  }

  // Drive back to the depot if the checkbox is ticked
  if (todo.length > 0 && $('returnBox').checked) {
    const back = aStar(here, 'D');
    legs.push(back.path);
    totalKm += back.km;
    route.push('D');
  }

  return todo;
}

// ================= 5. HELPERS =================

// Returns [label, css class, color] for a fill %
function level(c) {
  if (c >= 85) return ['URGENT', 'tag-urgent', 'var(--red)'];
  if (c >= 70) return ['HIGH',   'tag-high',   'var(--orange)'];
  return ['NORMAL', 'tag-normal', 'var(--green)'];
}

// Predicted fill after 2 hours
function predicted(b) {
  return Math.min(100, b.c + b.r * 2);
}

// ================= 6. DRAWING THE PAGE =================

function render() {
  const todo = planRoute();

  // Stat cards and route text
  $('statCollect').textContent = todo.length;
  $('statDistance').textContent = totalKm.toFixed(1) + ' km';
  $('routeText').textContent = todo.length
    ? route.map(function (r) { return r === 'D' ? 'DEPOT' : r; }).join(' → ')
    : 'No bins need collection';

  renderBins();
  renderMap();
  renderDetail();
  renderStops();

  $('btnDispatch').disabled = busy || todo.length === 0;
}

// --- Bin list ---
function renderBins() {
  let html = '';

  bins.forEach(function (b) {
    const lv = level(b.c);
    const cls = selected === b.id ? 'bin selected' : 'bin';

    html += '<div class="' + cls + '" data-id="' + b.id + '" tabindex="0">' +
      '<div><b>' + b.id + '</b><span class="street">' + b.street + '</span></div>' +
      '<div>' +
        '<div class="bar-label"><span>Current</span><span>' + b.c + '%</span></div>' +
        '<div class="bar">' +
          '<i class="predicted" style="width:' + predicted(b) + '%;background:' + lv[2] + '"></i>' +
          '<i style="width:' + b.c + '%;background:' + lv[2] + '"></i>' +
          '<u style="left:' + threshold + '%"></u>' +
        '</div>' +
      '</div>' +
      '<div class="pct">' + predicted(b) + '%</div>' +
      '<div class="tag ' + lv[1] + '">' + lv[0] + '</div>' +
    '</div>';
  });

  $('binList').innerHTML = html;

  // Make each row clickable
  document.querySelectorAll('.bin').forEach(function (row) {
    row.onclick = function () {
      toggleSelect(row.dataset.id);
    };
    row.onkeydown = function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleSelect(row.dataset.id);
      }
    };
  });
}

function toggleSelect(id) {
  selected = (selected === id) ? null : id;
  render();
}

// --- Info box under the list ---
function renderDetail() {
  const box = $('detail');
  const b = bins.find(function (x) { return x.id === selected; });

  if (!b) {
    box.textContent = 'Select a bin to see its fill rate and when it will overflow.';
    return;
  }

  const hoursLeft = Math.max(0, (100 - b.c) / b.r);
  const onRoute = route.includes(b.id);

  box.innerHTML = '<b>' + b.id + ' · ' + b.street + '</b><br>' +
    'Fills about ' + b.r + '% per hour, full in about ' + hoursLeft.toFixed(1) + ' h. ' +
    'Predicted ' + predicted(b) + '% in 2 h. ' +
    (onRoute ? 'Scheduled on this route.' : 'Below the threshold, so it is skipped.');
}

// --- Map (SVG) ---
function renderMap() {
  let svg = '';
  const onRoute = new Set(route);

  // 1. Grey roads
  roads.forEach(function (r) {
    const a = nodes[r[0]];
    const b = nodes[r[1]];
    svg += '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y +
           '" style="stroke:var(--line);stroke-width:6;stroke-linecap:round"/>';
  });

  // 2. Green lines for the chosen route
  legs.forEach(function (path) {
    for (let i = 0; i < path.length - 1; i++) {
      const a = nodes[path[i]];
      const b = nodes[path[i + 1]];
      svg += '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y +
             '" style="stroke:var(--green);stroke-width:6;stroke-linecap:round"/>';
    }
  });

  // 3. Distance labels (drawn after the lines so nothing hides them)
  roads.forEach(function (r) {
    const a = nodes[r[0]];
    const b = nodes[r[1]];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const lx = (a.x + b.x) / 2 - ((b.y - a.y) / len) * 14;   // push the label to the side of the road
    const ly = (a.y + b.y) / 2 + ((b.x - a.x) / len) * 14 + 4;
    svg += '<text class="map-label km" x="' + lx + '" y="' + ly + '">' + r[2] + ' km</text>';
  });

  // 4. Circles for depot and bins
  for (const id in nodes) {
    const n = nodes[id];
    const bin = bins.find(function (x) { return x.id === id; });

    let color = '#8a978f';                                  // grey = skipped
    if (id === 'D') color = '#1e9e57';                      // depot = green
    else if (onRoute.has(id)) color = level(bin.c)[2];      // on route = level color

    const isSelected = (selected === id);
    const pulse = (id !== 'D' && onRoute.has(id) && bin.c >= 85) ? 'pulse' : '';
    svg += '<g class="node" data-id="' + id + '">' +
      '<circle class="' + pulse + '" cx="' + n.x + '" cy="' + n.y + '" r="' + (isSelected ? 26 : 22) +
      '" style="fill:' + color + ';stroke:' + (isSelected ? 'var(--ink)' : 'none') + ';stroke-width:2"/>' +
      '<text x="' + n.x + '" y="' + (n.y + 4) + '">' + id + '</text>' +
      '<text class="map-label" x="' + n.x + '" y="' + (n.y + 40) + '">' + n.name + '</text>' +
    '</g>';
  }

  // 5. The truck
  svg += '<text id="truck" x="' + nodes.D.x + '" y="' + (nodes.D.y - 30) +
         '" font-size="24" text-anchor="middle">🚛</text>';

  $('map').innerHTML = svg;

  // Clicking a circle selects that bin
  document.querySelectorAll('.node').forEach(function (g) {
    g.onclick = function () {
      if (g.dataset.id !== 'D') toggleSelect(g.dataset.id);
    };
    g.onmousemove = function (e) { showTip(e, g.dataset.id); };
    g.onmouseleave = function () { $('tip').style.display = 'none'; };
  });
}

// ================= 7. TRUCK ANIMATION =================

let speed = 0.025;             // how far the truck moves each frame (set by the Speed slider)
let reached = -1;              // how many route stops the truck has reached
const TRUCK_CAPACITY = 1000;   // kg
const KG_PER_PERCENT = 2;      // a bin that is 50% full holds 100 kg

function dispatchTruck() {
  // Join all legs into one list of points to drive through
  const stops = [];
  legs.forEach(function (path) {
    path.forEach(function (id, i) {
      if (i > 0 || stops.length === 0) stops.push(id);
    });
  });

  const svgEl = $('map');
  const truck = $('truck');
  const firstNode = svgEl.querySelector('.node');   // trail lines go under the circles
  const totalRouteKm = totalKm;
  let step = 0;       // which road piece we are on
  let t = 0;          // progress on that piece, 0 to 1
  let load = 0;       // kg picked up so far
  let trail = newTrail(stops[0]);

  busy = true;
  reached = 0;
  $('btnDispatch').disabled = true;
  $('truckText').textContent = 'TRUCK-01 · en route';
  setLoad(0);
  renderStops();

  // A dark green line that follows the truck and shows where it has been
  function newTrail(id) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', nodes[id].x);
    line.setAttribute('y1', nodes[id].y);
    line.setAttribute('x2', nodes[id].x);
    line.setAttribute('y2', nodes[id].y);
    line.setAttribute('style', 'stroke:#0d6b38;stroke-width:6;stroke-linecap:round');
    svgEl.insertBefore(line, firstNode);
    return line;
  }

  // Called every time the truck arrives at a point
  function arrive(id) {
    $('truckText').textContent = 'TRUCK-01 · at ' + nodes[id].name;
    if (id !== route[reached + 1]) return;           // just passing through

    reached++;
    const bin = bins.find(function (b) { return b.id === id; });
    if (bin) {
      const kg = bin.c * KG_PER_PERCENT;
      load += kg;
      bin.c = 0;                                     // bin is emptied
      setLoad(load);
      toast('Collected ' + id + ' · +' + kg + ' kg');
      renderBins();
    }
    renderStops();
  }

  function move() {
    // Finished the whole route
    if (step >= stops.length - 1) {
      busy = false;
      reached = -1;
      $('truckText').textContent = 'TRUCK-01 · done';
      toast('Route complete · ' + totalRouteKm.toFixed(1) + ' km · ' + load + ' kg collected');
      render();
      return;
    }

    const from = nodes[stops[step]];
    const to = nodes[stops[step + 1]];
    t += speed;
    const p = Math.min(t, 1);
    const x = from.x + (to.x - from.x) * p;
    const y = from.y + (to.y - from.y) * p;

    truck.setAttribute('x', x);
    truck.setAttribute('y', y - 30);
    trail.setAttribute('x2', x);
    trail.setAttribute('y2', y);

    if (t >= 1) {
      t = 0;
      step++;
      trail = newTrail(stops[step]);
      arrive(stops[step]);
    }

    requestAnimationFrame(move);
  }

  move();
}

// Step-by-step list of stops under the map
function renderStops() {
  let html = '';
  route.forEach(function (id, i) {
    const bin = bins.find(function (b) { return b.id === id; });
    let label;
    if (id === 'D') label = (i === 0) ? 'Depot (start)' : 'Back to depot';
    else label = id + ' · ' + bin.street;

    let cls = 'stop';
    if (i <= reached) cls += ' done';
    else if (busy && i === reached + 1) cls += ' now';

    html += '<li class="' + cls + '"><span class="num">' + (i <= reached ? '✓' : i + 1) + '</span>' + label + '</li>';
  });
  $('stops').innerHTML = (route.length > 1) ? html : '';
}

// Truck load meter
function setLoad(kg) {
  $('loadBar').style.width = Math.min(100, kg / TRUCK_CAPACITY * 100) + '%';
  $('loadText').textContent = kg + ' / ' + TRUCK_CAPACITY + ' kg';
}

// Small message at the bottom of the screen
let toastTimer = null;
function toast(message) {
  const el = $('toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2200);
}

// Tooltip when the mouse is over a circle on the map
function showTip(e, id) {
  const tip = $('tip');
  const box = $('mapbox').getBoundingClientRect();
  const bin = bins.find(function (b) { return b.id === id; });

  if (bin) {
    const hoursLeft = Math.max(0, (100 - bin.c) / bin.r);
    tip.innerHTML = '<b>' + id + ' · ' + bin.street + '</b>' +
      'Fill: ' + bin.c + '% (+' + bin.r + '% per hour)<br>Full in ' + hoursLeft.toFixed(1) + ' h';
  } else {
    tip.innerHTML = '<b>Depot</b>The truck starts and ends here';
  }

  tip.style.display = 'block';
  tip.style.left = (e.clientX - box.left + 14) + 'px';
  tip.style.top = (e.clientY - box.top + 14) + 'px';
}

// ================= 8. BUTTONS AND SLIDER =================

// Slider: change the collection threshold
$('threshold').oninput = function (e) {
  threshold = Number(e.target.value);
  $('thresholdText').textContent = threshold + '%';
  if (!busy) render();
};

// +1 hour: every bin fills by its own rate
$('btnHour').onclick = function () {
  if (busy) return;
  bins.forEach(function (b) {
    b.c = Math.min(100, b.c + b.r);
  });
  render();
};

// Reset: back to the starting values
$('btnReset').onclick = async function () {
  if (busy) return;
  bins = await loadBins();
  selected = null;
  render();
};

// Return-to-depot checkbox
$('returnBox').onchange = function () {
  if (!busy) render();
};

// Speed slider: 1 (slow) to 10 (fast). 5 gives 0.025, the original speed
$('speed').oninput = function (e) {
  speed = Number(e.target.value) * 0.005;
};

// Live simulation: bins fill up by themselves every 1.5 seconds
let liveTimer = null;
$('liveBox').onchange = function (e) {
  if (e.target.checked) {
    liveTimer = setInterval(function () {
      if (busy) return;                     // pause while the truck is driving
      bins.forEach(function (b) { b.c = Math.min(100, b.c + b.r); });
      render();
    }, 1500);
  } else {
    clearInterval(liveTimer);
  }
};

// Dispatch button
$('btnDispatch').onclick = dispatchTruck;

// Theme button: switch between light and dark
$('theme').onclick = function () {
  const root = document.documentElement;
  root.dataset.theme = (root.dataset.theme === 'dark') ? 'light' : 'dark';
};

// ================= 9. START =================
loadBins().then(function (data) {
  bins = data;
  render();
});
