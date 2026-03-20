'use strict';
// ============================================================
// TOWER DEFENCE  –  Complete Implementation
// ============================================================

// ============================================================
// CONSTANTS
// ============================================================
const COLS = 20;
const ROWS = 24;
const SPAWN_COL = 10;
const SPAWN_ROW = 0;
const GOAL_COL  = 10;
const GOAL_ROW  = ROWS - 1;

let TILE = 30; // recalculated on resize

// ============================================================
// WEAPON DEFINITIONS
// ============================================================
const WEAPON_DEFS = {
  machine_gun: {
    id: 'machine_gun', name: 'マシンガン', icon: '🔫',
    color: '#4a90d9', baseCost: 150,
    desc: '高速連射・オーバーヒートあり',
    base: {
      damage: 14, fireRate: 8, range: 4.5, bulletSpeed: 11,
      overheatMax: 100, overheatPerShot: 6, overheatCoolRate: 22,
      magazine: 40, reloadTime: 2, hp: 80, aoe: 0, pellets: 1, spread: 0,
    },
  },
  shotgun: {
    id: 'shotgun', name: 'ショットガン', icon: '💥',
    color: '#e67e22', baseCost: 200,
    desc: '近距離散弾・広範囲ヒット',
    base: {
      damage: 28, fireRate: 1.2, range: 3.2, bulletSpeed: 9,
      overheatMax: 100, overheatPerShot: 22, overheatCoolRate: 30,
      magazine: 8, reloadTime: 3, hp: 100, aoe: 0, pellets: 6, spread: 40,
    },
  },
  arrow: {
    id: 'arrow', name: '弓矢塔', icon: '🏹',
    color: '#27ae60', baseCost: 80,
    desc: '長射程・オーバーヒートなし',
    base: {
      damage: 22, fireRate: 2.5, range: 6.5, bulletSpeed: 7,
      overheatMax: 0, overheatPerShot: 0, overheatCoolRate: 0,
      magazine: -1, reloadTime: 0, hp: 60, aoe: 0, pellets: 1, spread: 0,
    },
  },
  howitzer: {
    id: 'howitzer', name: '榴弾砲', icon: '💣',
    color: '#8e44ad', baseCost: 400,
    desc: '高ダメ・範囲爆発・低連射',
    base: {
      damage: 90, fireRate: 0.38, range: 7.5, bulletSpeed: 4.5,
      overheatMax: 100, overheatPerShot: 38, overheatCoolRate: 10,
      magazine: 4, reloadTime: 5, hp: 150, aoe: 1.6, pellets: 1, spread: 0,
    },
  },
  rocket: {
    id: 'rocket', name: 'ロケラン', icon: '🚀',
    color: '#c0392b', baseCost: 350,
    desc: '最大AOE爆発・少マガジン',
    base: {
      damage: 130, fireRate: 0.65, range: 6.5, bulletSpeed: 6.5,
      overheatMax: 100, overheatPerShot: 42, overheatCoolRate: 12,
      magazine: 3, reloadTime: 4, hp: 120, aoe: 2.2, pellets: 1, spread: 0,
    },
  },
};

const SANDBAG_DEF = {
  id: 'sandbag', name: '土嚢', icon: '🧱',
  color: '#c8a96e', baseCost: 2,
  desc: '敵進路を妨害・HPあり',
  baseHp: 250,
};

const ITEM_ORDER = ['sandbag','machine_gun','shotgun','arrow','howitzer','rocket'];

// Upgrade stat definitions per weapon
const UPGRADE_STATS = ['damage','fireRate','range','hp','overheat','magazine'];
const UPGRADE_STAT_NAMES = {
  damage: '⚔️ ダメージ', fireRate: '🔄 連射速度', range: '🎯 射程',
  hp: '❤️ HP', overheat: '🌡️ 耐熱性', magazine: '📦 マガジン',
};

// ============================================================
// ENEMY DEFINITIONS
// ============================================================
const ENEMY_DEFS = {
  grunt: {
    id: 'grunt', name: 'グラント', color: '#e74c3c',
    type: 'ground', baseHp: 100, baseSpeed: 1.5, baseReward: 10,
    baseDps: 25, baseThresh: 0, size: 0.38,
    agility: 0.35,  // 弾回避能力 0=なし 1=最大
  },
  runner: {
    id: 'runner', name: 'ランナー', color: '#f39c12',
    type: 'ground', baseHp: 50, baseSpeed: 3.2, baseReward: 8,
    baseDps: 15, baseThresh: 0, size: 0.28,
    agility: 0.85,  // ランナーは超俊敏
  },
  tank: {
    id: 'tank', name: 'タンク', color: '#7f8c8d',
    type: 'ground', baseHp: 500, baseSpeed: 0.75, baseReward: 55,
    baseDps: 60, baseThresh: 12, size: 0.52,
    agility: 0.05,  // タンクはほぼ避けない
  },
  brute: {
    id: 'brute', name: 'ブルート', color: '#8e44ad',
    type: 'ground', baseHp: 1200, baseSpeed: 0.6, baseReward: 120,
    baseDps: 120, baseThresh: 25, size: 0.62,
    agility: 0.0,   // ブルートは避けない（デカすぎて）
  },
  flyer: {
    id: 'flyer', name: 'フライヤー', color: '#3498db',
    type: 'flying', baseHp: 80, baseSpeed: 2.2, baseReward: 15,
    baseDps: 0, baseThresh: 0, size: 0.38,
    agility: 0.7,
  },
  bomber: {
    id: 'bomber', name: 'ボンバー', color: '#2c3e50',
    type: 'flying', baseHp: 320, baseSpeed: 1.0, baseReward: 42,
    baseDps: 0, baseThresh: 8, size: 0.52,
    agility: 0.25,
  },
  angel: {
    id: 'angel', name: 'エンジェル', color: '#ecf0f1',
    type: 'flying', baseHp: 1500, baseSpeed: 1.8, baseReward: 200,
    baseDps: 0, baseThresh: 20, size: 0.6,
    agility: 0.55,
  },
};

// ============================================================
// GAME STATE
// ============================================================
let state = {};

function makeInitialState() {
  return {
    phase: 'idle',   // 'idle' | 'wave' | 'gameover'
    grid: Array.from({length: ROWS}, () => new Array(COLS).fill(null)),
    enemies: [],
    projectiles: [],
    explosions: [],
    particles: [],
    dangerMap: null,
    dangerMapDirty: true,

    wave: 0,
    gold: 500,
    totalGold: 0,

    waveTimer: 15,
    waveEnemies: [],
    enemiesSpawned: 0,
    spawnTimer: 0,

    selectedItem: 'sandbag',
    interactionMode: 'place',

    nextId: 1,
    lastTime: performance.now(),
    gameTime: 0,

    hoveredCell: null,
  };
}

// ============================================================
// A* PATHFINDING
// ============================================================
function heuristic(r1, c1, r2, c2) {
  return Math.abs(r1 - r2) + Math.abs(c1 - c2);
}

const DIRS = [[-1,0],[1,0],[0,-1],[0,1]];

/** DDA ライン上に障害物があるか確認 (danger map 計算用 LOS) */
function hasLOS(r0, c0, r1, c1) {
  const steps = Math.max(Math.abs(r1 - r0), Math.abs(c1 - c0));
  if (steps === 0) return true;
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const r = Math.round(r0 + (r1 - r0) * t);
    const c = Math.round(c0 + (c1 - c0) * t);
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue;
    if (state.grid[r] && state.grid[r][c]) return false; // 障害物で遮蔽
  }
  return true;
}

/**
 * 武器の射程範囲を「コスト増」として表現した danger map を計算する。
 * 敵はこのコストを避けてルートを選ぶ (agility で重み調整)。
 * グリッド変更時に再計算。
 */
function computeBaseDangerMap() {
  const map = Array.from({ length: ROWS }, () => new Float32Array(COLS));
  for (let wr = 0; wr < ROWS; wr++) {
    for (let wc = 0; wc < COLS; wc++) {
      const cell = state.grid[wr][wc];
      if (!cell || cell.type !== 'weapon') continue;
      const stats = weaponStats(cell.weaponType, cell.upgrades);
      const range = stats.range;
      const rangeSq = range * range;
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (state.grid[r][c]) continue;
          const dx = c + 0.5 - (wc + 0.5);
          const dy = r + 0.5 - (wr + 0.5);
          const d2 = dx * dx + dy * dy;
          if (d2 > rangeSq) continue;
          // LOS チェック: 土嚢などに遮られていれば見えない
          if (!hasLOS(r, c, wr, wc)) continue;
          const dist = Math.sqrt(d2);
          // 中心に近いほど危険度大 (最大コスト +7)
          map[r][c] += (1 - dist / range) * 7;
        }
      }
    }
  }
  state.dangerMap = map;
  state.dangerMapDirty = false;
}

/** A* from (sr,sc) to (gr,gc) avoiding blocked cells. Returns path or null. */
function aStar(sr, sc, gr, gc, grid, ignoreObstacles, dangerMap) {
  const key = (r,c) => r * COLS + c;

  if (!ignoreObstacles && grid[sr] && grid[sr][sc]) return null;

  const openArr = [];
  const gScore = new Map();
  const parent = new Map();

  const startKey = key(sr, sc);
  gScore.set(startKey, 0);
  openArr.push({ r: sr, c: sc, f: heuristic(sr,sc,gr,gc) });
  parent.set(startKey, null);

  // Simple priority queue via sort – for grid sizes <= 20x24 it's fine
  while (openArr.length) {
    openArr.sort((a,b) => a.f - b.f);
    const cur = openArr.shift();
    const { r, c } = cur;

    if (r === gr && c === gc) {
      // Reconstruct
      const path = [];
      let k = key(r,c);
      while (k !== null) {
        const pr = Math.floor(k / COLS);
        const pc = k % COLS;
        path.unshift({ r: pr, c: pc });
        k = parent.get(k);
      }
      return path;
    }

    const curKey = key(r,c);
    const curG = gScore.get(curKey);

    for (const [dr, dc] of DIRS) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
      if (!ignoreObstacles && grid[nr][nc]) continue;

      const nk = key(nr, nc);
      // 武器射程内のセルはコスト増 (agility で重み付け)
      const danger = dangerMap ? (dangerMap[nr][nc] || 0) : 0;
      const ng = curG + 1 + danger;
      if (!gScore.has(nk) || ng < gScore.get(nk)) {
        gScore.set(nk, ng);
        parent.set(nk, curKey);
        openArr.push({ r: nr, c: nc, f: ng + heuristic(nr,nc,gr,gc) });
      }
    }
  }
  return null;
}

/** Find first blocked cell on direct path (ignoring obstacles) */
function findBlocker(sr, sc, gr, gc, grid) {
  const path = aStar(sr, sc, gr, gc, grid, true);
  if (!path) return null;
  for (const { r, c } of path) {
    if (grid[r] && grid[r][c]) return { r, c };
  }
  return null;
}

/** dangerMap を agility 倍にスケールした新しいマップを返す */
function scaledDangerMap(base, agility) {
  if (!base || agility <= 0) return null;
  return base.map(row => row.map(v => v * agility));
}

function invalidateAllPaths() {
  for (const e of state.enemies) {
    if (!e.flying) e.pathDirty = true;
  }
  state.dangerMapDirty = true;
}

// ============================================================
// WEAPON STAT COMPUTATION
// ============================================================
function weaponStats(def_id, upgrades) {
  const def = WEAPON_DEFS[def_id];
  const b = def.base;
  const u = upgrades || {};

  const dmgLv   = u.damage   || 0;
  const rateLv  = u.fireRate || 0;
  const rangeLv = u.range    || 0;
  const hpLv    = u.hp       || 0;
  const heatLv  = u.overheat || 0;
  const magLv   = u.magazine || 0;

  // Each level gives compounding benefit that accelerates
  const scale = lv => 1 + lv * 0.38 + lv * lv * 0.018;

  return {
    damage:          b.damage   * scale(dmgLv),
    fireRate:        b.fireRate * scale(rateLv),
    range:           b.range    + rangeLv * 0.55,
    bulletSpeed:     b.bulletSpeed,
    overheatMax:     b.overheatMax > 0 ? b.overheatMax * (1 + heatLv * 0.35) : 0,
    overheatPerShot: b.overheatMax > 0 ? Math.max(1, b.overheatPerShot * Math.pow(0.92, heatLv)) : 0,
    overheatCoolRate:b.overheatCoolRate * (1 + heatLv * 0.2),
    magazine:        b.magazine < 0 ? -1 : Math.floor(b.magazine * (1 + magLv * 0.55)),
    reloadTime:      Math.max(0.4, b.reloadTime * Math.pow(0.88, magLv)),
    hp:              b.hp * scale(hpLv),
    aoe:             b.aoe,
    pellets:         b.pellets,
    spread:          b.spread,
  };
}

function sandbagHp(upgradeLevel) {
  return SANDBAG_DEF.baseHp * (1 + (upgradeLevel || 0) * 0.6);
}

// ============================================================
// UPGRADE COSTS
// ============================================================
function upgradeCost(defId, stat, currentLv) {
  const def = WEAPON_DEFS[defId] || SANDBAG_DEF;
  const base = (def.baseCost || 30) * 0.6;
  return Math.ceil(base * Math.pow(1.65, currentLv) * (1 + currentLv * 0.08));
}

function upgradeRefund(defId, stat, currentLv) {
  // 40% of the total spent to reach currentLv
  let total = 0;
  for (let i = 0; i < currentLv; i++) total += upgradeCost(defId, stat, i);
  return Math.floor(total * 0.4);
}

function placeCost(itemId) {
  if (itemId === 'sandbag') return SANDBAG_DEF.baseCost;
  return WEAPON_DEFS[itemId]?.baseCost || 0;
}

// ============================================================
// WAVE SYSTEM
// ============================================================
function waveScale(wave) {
  // Smooth exponential growth – mild early, steep later
  return 1 + wave * 0.10 + Math.pow(wave, 1.12) * 0.007;
}

function buildWave(wave) {
  const scale = waveScale(wave);
  const count = Math.floor(10 + wave * 1.6 + Math.random() * wave * 0.5);
  const enemies = [];

  for (let i = 0; i < count; i++) {
    const r = Math.random();
    let type;
    if (wave < 3) {
      type = 'grunt';
    } else if (wave < 5) {
      type = r < 0.65 ? 'grunt' : 'runner';
    } else if (wave < 8) {
      if (r < 0.45) type = 'grunt';
      else if (r < 0.75) type = 'runner';
      else type = 'flyer';
    } else if (wave < 12) {
      if (r < 0.30) type = 'grunt';
      else if (r < 0.55) type = 'runner';
      else if (r < 0.75) type = 'flyer';
      else type = 'tank';
    } else if (wave < 20) {
      if (r < 0.20) type = 'grunt';
      else if (r < 0.40) type = 'runner';
      else if (r < 0.58) type = 'flyer';
      else if (r < 0.75) type = 'tank';
      else if (r < 0.90) type = 'bomber';
      else type = 'brute';
    } else {
      if (r < 0.15) type = 'grunt';
      else if (r < 0.30) type = 'runner';
      else if (r < 0.45) type = 'flyer';
      else if (r < 0.60) type = 'bomber';
      else if (r < 0.76) type = 'tank';
      else if (r < 0.90) type = 'brute';
      else type = 'angel';
    }
    enemies.push({ type, scale });
  }

  return enemies;
}

function waveInterval(wave) {
  return Math.max(12, 40 - wave * 0.6);
}

function spawnInterval(wave) {
  return Math.max(0.18, 1.8 - wave * 0.06);
}

// ============================================================
// ENTITY FACTORY
// ============================================================
let _id = 1;
function uid() { return _id++; }

function makeWeapon(type, r, c, upgrades) {
  const stats = weaponStats(type, upgrades || {});
  return {
    id: uid(), type: 'weapon', weaponType: type,
    r, c,
    hp: stats.hp, maxHp: stats.hp,
    upgrades: Object.assign({}, upgrades || {}),
    fireCooldown: 0,
    overheat: 0, isOverheated: false,
    magLeft: stats.magazine < 0 ? Infinity : stats.magazine,
    isReloading: false, reloadTimer: 0,
  };
}

function makeSandbag(r, c, level) {
  level = level || 0;
  const hp = sandbagHp(level);
  return { id: uid(), type: 'sandbag', r, c, hp, maxHp: hp, upgradeLevel: level };
}

function makeEnemy(type, scale, spawnCol) {
  const def = ENEMY_DEFS[type];
  const hp = def.baseHp * 1.5 * scale;
  const spd = def.baseSpeed * (0.85 + Math.random() * 0.3) * (1 + (scale - 1) * 0.25);
  const dps = def.baseDps * scale;
  const thresh = def.baseThresh > 0 ? Math.floor(def.baseThresh * Math.pow(scale, 0.7)) : 0;

  return {
    id: uid(), type: 'enemy', enemyType: type,
    x: spawnCol + 0.5, y: SPAWN_ROW + 0.5,
    hp, maxHp: hp, speed: Math.min(spd, 8),
    reward: Math.ceil(def.baseReward * scale),
    dps, thresh,
    flying: def.type === 'flying',
    size: def.size,
    color: def.color,
    agility: def.agility || 0,
    // Ground pathfinding
    path: null, pathIdx: 0, pathDirty: true,
    // Attack state
    isAttacking: false, attackTarget: null, attackTimer: 0,
    // Evasion state
    dodgeVx: 0, dodgeVy: 0,
    dodgeCooldown: 0,
    // Visuals
    dir: { x: 0, y: 1 },
    animT: Math.random() * Math.PI * 2,
  };
}

function makeProjectile(weapon, tx, ty, angleOverride) {
  const stats = weaponStats(weapon.weaponType, weapon.upgrades);
  const wx = weapon.c + 0.5;
  const wy = weapon.r + 0.5;
  const angle = angleOverride !== undefined ? angleOverride : Math.atan2(ty - wy, tx - wx);

  return {
    id: uid(), type: 'projectile',
    weaponType: weapon.weaponType,
    x: wx, y: wy,
    vx: Math.cos(angle) * stats.bulletSpeed,
    vy: Math.sin(angle) * stats.bulletSpeed,
    damage: stats.damage, aoe: stats.aoe,
    lifetime: (stats.range + 2) / stats.bulletSpeed,
    age: 0, dead: false,
  };
}

// ============================================================
// PROJECTILE LEAD CALCULATION
// ============================================================
function calcLead(sx, sy, enemy, bulletSpeed) {
  const dx = enemy.x - sx;
  const dy = enemy.y - sy;
  const tvx = (enemy.dir.x || 0) * enemy.speed;
  const tvy = (enemy.dir.y || 1) * enemy.speed;

  // Solve quadratic: |d + t*v|^2 = (bs*t)^2
  const a = tvx*tvx + tvy*tvy - bulletSpeed*bulletSpeed;
  const b = 2*(dx*tvx + dy*tvy);
  const c = dx*dx + dy*dy;

  let T = -1;
  if (Math.abs(a) < 1e-5) {
    if (Math.abs(b) > 1e-5) T = -c / b;
  } else {
    const disc = b*b - 4*a*c;
    if (disc >= 0) {
      const t1 = (-b - Math.sqrt(disc)) / (2*a);
      const t2 = (-b + Math.sqrt(disc)) / (2*a);
      if (t1 > 0) T = t1;
      else if (t2 > 0) T = t2;
    }
  }

  if (T < 0 || T > 3) return { x: enemy.x, y: enemy.y }; // fallback: aim directly
  return { x: enemy.x + tvx * T, y: enemy.y + tvy * T };
}

// ============================================================
// BULLET EVASION
// ============================================================

/**
 * 各敵につき、向かってくる弾を検知して
 * 回避ベクトル (tiles/s) を返す。
 * 弾の進行方向に垂直な方向へ押し出す。
 */
function calcEvasion(enemy) {
  if (enemy.agility <= 0) return { x: 0, y: 0 };

  // 検知半径: 敏捷性に応じて広くなる
  const detR = 1.8 + enemy.agility * 1.8;
  const detR2 = detR * detR;

  let evX = 0, evY = 0;

  for (const proj of state.projectiles) {
    const toEx = enemy.x - proj.x;
    const toEy = enemy.y - proj.y;
    const d2 = toEx * toEx + toEy * toEy;
    if (d2 > detR2) continue;

    const spd = Math.sqrt(proj.vx * proj.vx + proj.vy * proj.vy);
    if (spd < 0.01) continue;
    const bDx = proj.vx / spd;
    const bDy = proj.vy / spd;

    // 弾が敵の方向に向かっているか (内積 > 0)
    const dot = toEx * bDx + toEy * bDy;
    if (dot < 0.05) continue; // 遠ざかっている弾は無視

    // 最接近時刻 & 最接近距離
    const t = Math.min(dot / spd, 2.0);
    const cxF = proj.x + proj.vx * t;
    const cyF = proj.y + proj.vy * t;
    const closeDist = Math.sqrt((cxF - enemy.x) ** 2 + (cyF - enemy.y) ** 2);

    // ヒット圏内に来ない弾は無視
    const hitRadius = enemy.size * 2.2;
    if (closeDist > hitRadius) continue;

    // 回避方向: 弾の進行に垂直 (2択あるので敵から見て外側を選ぶ)
    const perpX = -bDy;
    const perpY =  bDx;
    // 外積で「敵が弾のどちら側にいるか」を判定
    const cross = toEx * bDy - toEy * bDx;
    const sign = cross >= 0 ? 1 : -1;

    // 緊急度: 近いほど・衝突まで時間が短いほど強い
    const urgency = (1 - closeDist / hitRadius) * (1 - t / 2.0);
    const strength = urgency * enemy.agility;

    evX += perpX * sign * strength;
    evY += perpY * sign * strength;
  }

  if (evX === 0 && evY === 0) return { x: 0, y: 0 };

  // 正規化して速度スケール
  const mag = Math.sqrt(evX * evX + evY * evY);
  const scale = Math.min(mag, 1.5) / mag;
  return {
    x: evX * scale * enemy.agility * enemy.speed,
    y: evY * scale * enemy.agility * enemy.speed,
  };
}

// ============================================================
// MAIN UPDATE
// ============================================================
function update(dt) {
  if (state.phase === 'gameover') return;
  state.gameTime += dt;

  // Auto-wave progression
  if (state.phase === 'idle') {
    state.waveTimer -= dt;
    if (state.waveTimer <= 0) startWave();
  }

  if (state.phase === 'wave') {
    // Spawn enemies
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0 && state.enemiesSpawned < state.waveEnemies.length) {
      spawnEnemy();
      state.spawnTimer += spawnInterval(state.wave);
    }
    // Wave done? → 全滅なら3秒で即次Wave
    if (state.enemiesSpawned >= state.waveEnemies.length && state.enemies.length === 0) {
      state.phase = 'idle';
      state.waveTimer = 3;
      showToast(`✅ Wave ${state.wave} クリア！`, '#3fb950');
    }
  }

  updateEnemies(dt);
  updateWeapons(dt);
  updateProjectiles(dt);
  updateParticles(dt);
  updateExplosions(dt);
  updateHUD();
}

function startWave() {
  state.wave++;
  state.phase = 'wave';
  state.waveEnemies = buildWave(state.wave);
  state.enemiesSpawned = 0;
  state.spawnTimer = 0.3;
  updateHUD();
}

function spawnEnemy() {
  const { type, scale } = state.waveEnemies[state.enemiesSpawned++];

  // Find unoccupied column near SPAWN_COL
  let col = SPAWN_COL;
  if (state.enemies.some(e => Math.abs(e.x - (col+0.5)) < 0.5 && e.y < 1.5)) {
    for (let off = 1; off <= 5; off++) {
      const c1 = SPAWN_COL - off, c2 = SPAWN_COL + off;
      if (c1 >= 0 && !state.enemies.some(e => Math.abs(e.x-(c1+0.5))<0.5 && e.y<1.5)) { col=c1; break; }
      if (c2 < COLS && !state.enemies.some(e => Math.abs(e.x-(c2+0.5))<0.5 && e.y<1.5)) { col=c2; break; }
    }
  }
  state.enemies.push(makeEnemy(type, scale, col));
}

// ============================================================
// ENEMY UPDATE
// ============================================================
function updateEnemies(dt) {
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const e = state.enemies[i];
    e.animT += dt * 3;

    if (e.flying) {
      updateFlyingEnemy(e, dt);
    } else {
      updateGroundEnemy(e, dt);
    }

    // Goal reached? → 画面下端に到達したら即ゲームオーバー (x無関係)
    if (e.y >= ROWS - 0.3) {
      triggerGameOver();
      return;
    }
  }
}

function updateFlyingEnemy(e, dt) {
  // 弾回避: 飛行系は左右に自由に動ける
  const ev = calcEvasion(e);

  // 回避Xを滑らかに適用 (慣性あり)
  e.dodgeVx = e.dodgeVx * 0.75 + ev.x * 0.25;
  e.dodgeVy = e.dodgeVy * 0.75 + ev.y * 0.25;

  // 横方向の回避速度を足す (縦は基本方向を維持しつつわずかに影響)
  const newX = e.x + (e.dodgeVx) * dt;
  const newY = e.y + (e.speed + e.dodgeVy * 0.2) * dt;

  // 画面外に出ないようにクランプ
  e.x = Math.max(0.3, Math.min(COLS - 0.3, newX));
  e.y = newY;

  // 向きを更新
  const dx = e.x - (e.x - e.dodgeVx * dt);
  e.dir = {
    x: Math.abs(e.dodgeVx) > 0.1 ? Math.sign(e.dodgeVx) * 0.5 : 0,
    y: 1,
  };
}

function updateGroundEnemy(e, dt) {
  // --- PATH REFRESH ---
  if (e.pathDirty || !e.path) {
    // dangerMap が古ければ再計算
    if (state.dangerMapDirty || !state.dangerMap) computeBaseDangerMap();

    const sr = Math.max(0, Math.min(ROWS-1, Math.round(e.y - 0.5)));
    const sc = Math.max(0, Math.min(COLS-1, Math.round(e.x - 0.5)));

    // agility > 0 なら danger map を使って武器射程を迂回するルートを選ぶ
    // agility=0 (タンク/ブルート) は最短距離のみ
    const dmap = e.agility > 0
      ? scaledDangerMap(state.dangerMap, e.agility)
      : null;

    e.path = aStar(sr, sc, GOAL_ROW, GOAL_COL, state.grid, false, dmap);
    e.pathIdx = 0;
    e.pathDirty = false;

    if (!e.path) {
      // No path: find blocking obstacle
      const blocker = findBlocker(sr, sc, GOAL_ROW, GOAL_COL, state.grid);
      e.isAttacking = !!blocker;
      e.attackTarget = blocker;
    } else {
      e.isAttacking = false;
      e.attackTarget = null;
    }
  }

  // --- ATTACKING OBSTACLE ---
  if (e.isAttacking && e.attackTarget) {
    const { r, c } = e.attackTarget;
    const cell = state.grid[r]?.[c];
    if (!cell) {
      // Obstacle gone
      e.pathDirty = true;
      e.isAttacking = false;
      e.attackTarget = null;
      return;
    }

    const tx = c + 0.5, ty = r + 0.5;
    const dx = tx - e.x, dy = ty - e.y;
    const dist = Math.sqrt(dx*dx + dy*dy);

    if (dist > 0.95) {
      // Move toward blocker
      const spd = Math.min(e.speed * dt, dist - 0.9);
      e.x += (dx/dist) * spd;
      e.y += (dy/dist) * spd;
      e.dir = { x: dx/dist, y: dy/dist };
    } else {
      // Attack it
      e.dir = { x: dx/dist, y: dy/dist };
      const dmg = e.dps * dt;
      cell.hp -= dmg;
      if (cell.hp <= 0) {
        state.grid[r][c] = null;
        invalidateAllPaths();
        e.pathDirty = true;
        e.isAttacking = false;
        e.attackTarget = null;
        spawnParticles(tx, ty, '#c8a96e', 8);
      }
    }
    return;
  }

  // --- FOLLOW PATH ---
  if (!e.path || e.pathIdx >= e.path.length) {
    e.pathDirty = true;
    return;
  }

  const step = e.path[e.pathIdx];
  const tx = step.c + 0.5, ty = step.r + 0.5;
  const dx = tx - e.x, dy = ty - e.y;
  const dist = Math.sqrt(dx*dx + dy*dy);

  // ステップ到達判定を緩く (0.15タイル以内で次へ)
  if (dist < 0.15) {
    e.x = tx; e.y = ty;
    e.pathIdx++;
    return;
  }

  const move = e.speed * dt;
  const nx = dx / dist, ny = dy / dist;

  // --- 弾回避ベクトル (垂直成分のみ抽出) ---
  const ev = calcEvasion(e);
  e.dodgeVx = e.dodgeVx * 0.7 + ev.x * 0.3;
  e.dodgeVy = e.dodgeVy * 0.7 + ev.y * 0.3;
  const dot = e.dodgeVx * nx + e.dodgeVy * ny;
  const perpDX = e.dodgeVx - dot * nx;
  const perpDY = e.dodgeVy - dot * ny;
  const perpMag = Math.sqrt(perpDX * perpDX + perpDY * perpDY);
  const maxDodge = e.speed * 0.55 * dt;
  const ds = perpMag > 0 ? Math.min(maxDodge, perpMag * dt) / (perpMag * dt + 1e-9) : 0;

  // --- 敵同士のソフト反発力 (完全停止させない！) ---
  let sepX = 0, sepY = 0;
  const minSep = (e.size + 0.3) * 0.9; // 反発開始距離
  for (const o of state.enemies) {
    if (o.id === e.id || o.flying) continue;
    const sdx = e.x - o.x, sdy = e.y - o.y;
    const sd = Math.sqrt(sdx * sdx + sdy * sdy);
    if (sd < minSep && sd > 0.001) {
      const push = (minSep - sd) / minSep * 0.6;
      sepX += (sdx / sd) * push;
      sepY += (sdy / sd) * push;
    }
  }

  // --- 候補位置: パス方向 + 回避横ズレ + 反発 ---
  const candX = e.x + nx * move + perpDX * ds * dt + sepX * e.speed * dt;
  const candY = e.y + ny * move + perpDY * ds * dt + sepY * e.speed * dt;

  const cr = Math.floor(candY), cc = Math.floor(candX);
  const candOk = cr >= 0 && cr < ROWS && cc >= 0 && cc < COLS && !state.grid[cr][cc];

  if (candOk) {
    // 候補位置OK
    e.x = candX; e.y = candY;
    const fx = nx + perpDX * ds, fy = ny + perpDY * ds;
    const fm = Math.sqrt(fx*fx + fy*fy);
    if (fm > 0.01) e.dir = { x: fx/fm, y: fy/fm };
    e.stuckTimer = 0;
  } else {
    // 候補がダメ → 回避・反発なしでパス方向だけ試す
    const fallX = e.x + nx * move;
    const fallY = e.y + ny * move;
    const fr2 = Math.floor(fallY), fc2 = Math.floor(fallX);
    const fallOk = fr2 >= 0 && fr2 < ROWS && fc2 >= 0 && fc2 < COLS && !state.grid[fr2][fc2];
    if (fallOk) {
      e.x = fallX; e.y = fallY;
      e.dir = { x: nx, y: ny };
      e.stuckTimer = 0;
    } else {
      // 障害物に完全に阻まれた → スタックタイマー
      e.stuckTimer = (e.stuckTimer || 0) + dt;
      if (e.stuckTimer > 1.2) {
        // 強制解放: パス再計算
        e.pathDirty = true;
        e.stuckTimer = 0;
      }
    }
  }
}

// ============================================================
// WEAPON UPDATE
// ============================================================
function updateWeapons(dt) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = state.grid[r][c];
      if (cell && cell.type === 'weapon') tickWeapon(cell, dt);
    }
  }
}

function tickWeapon(w, dt) {
  const stats = weaponStats(w.weaponType, w.upgrades);

  // Reload
  if (w.isReloading) {
    w.reloadTimer -= dt;
    if (w.reloadTimer <= 0) {
      w.isReloading = false;
      w.magLeft = stats.magazine < 0 ? Infinity : stats.magazine;
    }
    return;
  }

  // Overheat cooldown
  if (stats.overheatMax > 0) {
    if (w.isOverheated) {
      w.overheat -= stats.overheatCoolRate * 3 * dt;
      if (w.overheat <= 0) { w.overheat = 0; w.isOverheated = false; }
      return;
    }
    w.overheat = Math.max(0, w.overheat - stats.overheatCoolRate * dt);
  }

  // Fire cooldown
  w.fireCooldown -= dt;
  if (w.fireCooldown > 0) return;

  // Find target
  const target = pickTarget(w, stats);
  if (!target) return;

  // Fire!
  fireWeapon(w, stats, target);
  w.fireCooldown = 1 / stats.fireRate;

  // Overheat
  if (stats.overheatMax > 0) {
    w.overheat += stats.overheatPerShot;
    if (w.overheat >= stats.overheatMax) {
      w.isOverheated = true;
      w.overheat = stats.overheatMax;
    }
  }

  // Magazine
  if (w.magLeft !== Infinity) {
    w.magLeft--;
    if (w.magLeft <= 0) {
      w.isReloading = true;
      w.reloadTimer = stats.reloadTime;
    }
  }
}

function pickTarget(w, stats) {
  const wx = w.c + 0.5, wy = w.r + 0.5;
  const rangeSq = stats.range * stats.range;

  // ダメージが入る敵を最優先 (prog=ゴール到達度 で比較)
  // 全員に閾値超えてなければ次善策として誰でも狙う
  let bestOk = null, bestOkProg = -1;   // ダメージ入る敵の最前線
  let bestAny = null, bestAnyProg = -1; // 誰でもいいの最前線

  for (const e of state.enemies) {
    const dx = e.x - wx, dy = e.y - wy;
    if (dx*dx + dy*dy > rangeSq) continue;

    const prog = e.y + (e.flying ? 0.5 : 0);
    if (prog > bestAnyProg) { bestAnyProg = prog; bestAny = e; }

    // AOE武器は爆風ダメ÷2でも閾値超えればOK扱い
    const effectiveDmg = stats.aoe > 0 ? stats.damage * 0.5 : stats.damage;
    if (effectiveDmg > e.thresh) {
      if (prog > bestOkProg) { bestOkProg = prog; bestOk = e; }
    }
  }

  return bestOk ?? bestAny; // ダメ入る敵優先、全員無敵ならとりあえず撃つ
}

function fireWeapon(w, stats, target) {
  const wx = w.c + 0.5, wy = w.r + 0.5;

  if (stats.pellets > 1) {
    // Shotgun scatter
    const baseAngle = Math.atan2(target.y - wy, target.x - wx);
    const spreadRad = stats.spread * Math.PI / 180;
    for (let i = 0; i < stats.pellets; i++) {
      const angle = baseAngle + (Math.random() - 0.5) * spreadRad;
      state.projectiles.push(makeProjectile(w, 0, 0, angle));
    }
  } else {
    const lead = calcLead(wx, wy, target, stats.bulletSpeed);
    const angle = Math.atan2(lead.y - wy, lead.x - wx);
    state.projectiles.push(makeProjectile(w, 0, 0, angle));
  }
}

// ============================================================
// PROJECTILE UPDATE
// ============================================================
function updateProjectiles(dt) {
  const PROJ_COLORS = {
    machine_gun: '#ffffaa', shotgun: '#ff8800', arrow: '#8B4513',
    howitzer: '#555', rocket: '#ff4444',
  };

  for (let i = state.projectiles.length - 1; i >= 0; i--) {
    const p = state.projectiles[i];
    p.age += dt;
    if (p.dead || p.age >= p.lifetime) { state.projectiles.splice(i,1); continue; }

    p.x += p.vx * dt;
    p.y += p.vy * dt;

    if (p.x < -1 || p.x > COLS+1 || p.y < -1 || p.y > ROWS+1) {
      state.projectiles.splice(i,1); continue;
    }

    // Hit check
    let hit = false;
    for (let j = state.enemies.length - 1; j >= 0; j--) {
      const e = state.enemies[j];
      const dx = e.x - p.x, dy = e.y - p.y;
      if (dx*dx + dy*dy <= (e.size + 0.15)*(e.size + 0.15)) {
        if (p.aoe > 0) {
          applyAoe(p.x, p.y, p.aoe, p.damage);
          spawnExplosion(p.x, p.y, p.aoe);
        } else {
          const eff = Math.max(0, p.damage - e.thresh);
          hurtEnemy(j, eff);
        }
        p.dead = true;
        hit = true;
        break;
      }
    }
    if (hit) { state.projectiles.splice(i,1); continue; }
  }
}

function applyAoe(x, y, radius, damage) {
  for (let j = state.enemies.length - 1; j >= 0; j--) {
    const e = state.enemies[j];
    const dx = e.x - x, dy = e.y - y;
    const d = Math.sqrt(dx*dx + dy*dy);
    if (d <= radius) {
      const falloff = 1 - d/radius * 0.6;
      const eff = Math.max(0, damage * falloff - e.thresh);
      hurtEnemy(j, eff);
    }
  }
  // Friendly fire: tiny damage to structures in AOE
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = state.grid[r][c];
      if (!cell) continue;
      const dx = c + 0.5 - x, dy = r + 0.5 - y;
      const d = Math.sqrt(dx*dx + dy*dy);
      if (d <= radius) {
        cell.hp -= damage * (1 - d/radius*0.6) * 0.05;
        if (cell.hp <= 0) {
          state.grid[r][c] = null;
          invalidateAllPaths();
          spawnParticles(c+0.5, r+0.5, '#c8a96e', 6);
        }
      }
    }
  }
}

function hurtEnemy(idx, damage) {
  const e = state.enemies[idx];
  e.hp -= damage;
  spawnParticles(e.x, e.y, e.color, 3);
  if (e.hp <= 0) {
    const reward = e.reward;
    state.gold += reward;
    state.totalGold += reward;
    spawnParticles(e.x, e.y, '#ffd700', 8);
    spawnGoldText(e.x, e.y, reward);
    state.enemies.splice(idx, 1);
  }
}

// ============================================================
// PARTICLES & EXPLOSIONS
// ============================================================
function spawnParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.5 + Math.random() * 1.5;
    state.particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color, size: 0.04 + Math.random() * 0.06,
      life: 0.3 + Math.random() * 0.4, age: 0,
    });
  }
}

function spawnGoldText(x, y, amount) {
  state.particles.push({
    type: 'text', x, y, vy: -1.2, text: `+${fmtGold(amount)}`,
    life: 1.2, age: 0, color: '#ffd700',
  });
}

function spawnExplosion(x, y, radius) {
  state.explosions.push({ x, y, radius, age: 0, life: 0.45 });
}

function updateParticles(dt) {
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.age += dt;
    p.x += (p.vx || 0) * dt;
    p.y += (p.vy || 0) * dt;
    if (p.age >= p.life) state.particles.splice(i, 1);
  }
}

function updateExplosions(dt) {
  for (let i = state.explosions.length - 1; i >= 0; i--) {
    const e = state.explosions[i];
    e.age += dt;
    if (e.age >= e.life) state.explosions.splice(i, 1);
  }
}

// ============================================================
// RENDER
// ============================================================
let canvas, ctx;

function render() {
  if (!canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBackground();
  drawGrid();
  drawPathPreview();
  drawEntities();
  drawEnemies();
  drawProjectiles();
  drawExplosions();
  drawParticles();
}

function drawBackground() {
  ctx.fillStyle = '#0a0e13';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle gradient from spawn to goal
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, 'rgba(255,50,50,0.04)');
  grad.addColorStop(1, 'rgba(50,255,50,0.04)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawGrid() {
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 0.5;
  for (let r = 0; r <= ROWS; r++) {
    ctx.beginPath(); ctx.moveTo(0, r*TILE); ctx.lineTo(COLS*TILE, r*TILE); ctx.stroke();
  }
  for (let c = 0; c <= COLS; c++) {
    ctx.beginPath(); ctx.moveTo(c*TILE, 0); ctx.lineTo(c*TILE, ROWS*TILE); ctx.stroke();
  }

  // Spawn marker
  ctx.fillStyle = 'rgba(255,60,60,0.25)';
  ctx.fillRect(SPAWN_COL*TILE, SPAWN_ROW*TILE, TILE, TILE);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = `bold ${Math.max(7,TILE*0.32)}px monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('SPAWN', (SPAWN_COL+0.5)*TILE, (SPAWN_ROW+0.5)*TILE);

  // Goal marker
  ctx.fillStyle = 'rgba(60,255,60,0.25)';
  ctx.fillRect(GOAL_COL*TILE, GOAL_ROW*TILE, TILE, TILE);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText('GOAL', (GOAL_COL+0.5)*TILE, (GOAL_ROW+0.5)*TILE);
}

function drawPathPreview() {
  // Highlight hovered cell when placing
  if (state.interactionMode !== 'place' || !state.selectedItem) return;
  const hc = state.hoveredCell;
  if (!hc) return;

  const { r, c } = hc;
  const canPlace = !state.grid[r][c] && !(r===SPAWN_ROW&&c===SPAWN_COL) && !(r===GOAL_ROW&&c===GOAL_COL);
  ctx.fillStyle = canPlace ? 'rgba(88,166,255,0.25)' : 'rgba(255,50,50,0.25)';
  ctx.fillRect(c*TILE+1, r*TILE+1, TILE-2, TILE-2);
}

function drawEntities() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = state.grid[r][c];
      if (!cell) continue;
      drawCell(cell, r, c);
    }
  }
}

function drawCell(cell, r, c) {
  const x = c * TILE, y = r * TILE;
  const pad = 1;

  if (cell.type === 'sandbag') {
    // Draw sandbag
    ctx.fillStyle = '#7d6038';
    ctx.fillRect(x+pad, y+pad, TILE-pad*2, TILE-pad*2);
    ctx.fillStyle = '#c8a96e';
    // Brick pattern
    const bh = TILE/4;
    for (let row = 0; row < 4; row++) {
      const offset = row % 2 === 0 ? 0 : TILE*0.2;
      ctx.fillStyle = row % 2 === 0 ? '#c8a96e' : '#b8955a';
      ctx.fillRect(x+pad+offset, y+pad+row*bh, TILE-pad*2-offset, bh-1);
    }
    // HP bar
    drawBar(x, y+y*0, TILE, 3, cell.hp/cell.maxHp, '#4caf50', '#f44336');

  } else if (cell.type === 'weapon') {
    const def = WEAPON_DEFS[cell.weaponType];
    const stats = weaponStats(cell.weaponType, cell.upgrades);

    // Background
    ctx.fillStyle = def.color + '33';
    ctx.fillRect(x+pad, y+pad, TILE-pad*2, TILE-pad*2);
    ctx.strokeStyle = def.color;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x+pad, y+pad, TILE-pad*2, TILE-pad*2);

    // Icon
    const iconSize = Math.max(10, TILE * 0.52);
    ctx.font = `${iconSize}px serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(def.icon, x + TILE/2, y + TILE/2);

    // HP bar
    drawBar(x, y, TILE, 3, cell.hp/cell.maxHp, '#4caf50', '#f44336');

    // Overheat bar
    if (stats.overheatMax > 0) {
      const ratio = cell.overheat / stats.overheatMax;
      if (ratio > 0) {
        const col2 = cell.isOverheated ? '#ff3333' : '#ff9900';
        drawBar(x, y + TILE - 3, TILE, 3, ratio, col2, col2);
      }
    }

    // Reload bar
    if (cell.isReloading) {
      const ratio = 1 - cell.reloadTimer / stats.reloadTime;
      drawBar(x, y + TILE - 6, TILE, 2, ratio, '#44aaff', '#44aaff');
    }

    // Upgrade level badge (top-right)
    const totalLv = Object.values(cell.upgrades||{}).reduce((a,b)=>a+b, 0);
    if (totalLv > 0) {
      ctx.fillStyle = '#ffd700';
      ctx.font = `bold ${Math.max(7,TILE*0.28)}px sans-serif`;
      ctx.textAlign = 'right'; ctx.textBaseline = 'top';
      ctx.fillText(`★${totalLv}`, x+TILE-2, y+2);
    }

    // Range ring on hover
    if (state.hoveredCell && state.hoveredCell.r === r && state.hoveredCell.c === c) {
      ctx.strokeStyle = 'rgba(255,255,100,0.35)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3,3]);
      ctx.beginPath();
      ctx.arc((c+0.5)*TILE, (r+0.5)*TILE, stats.range*TILE, 0, Math.PI*2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}

function drawBar(x, y, w, h, ratio, colorHi, colorLo) {
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(x+1, y+1, w-2, h);
  const col = ratio > 0.5 ? colorHi : ratio > 0.25 ? '#ff9800' : colorLo;
  ctx.fillStyle = col;
  ctx.fillRect(x+1, y+1, Math.max(0, (w-2)*ratio), h);
}

const ENEMY_SHAPES = {
  grunt: drawGrunt,
  runner: drawRunner,
  tank: drawTank,
  brute: drawBrute,
  flyer: drawFlyer,
  bomber: drawBomber,
  angel: drawAngel,
};

function drawEnemies() {
  for (const e of state.enemies) {
    const px = e.x * TILE, py = e.y * TILE;
    const s = e.size * TILE;

    ctx.save();
    ctx.translate(px, py);

    const drawFn = ENEMY_SHAPES[e.enemyType];
    if (drawFn) drawFn(e, s);
    else drawDefaultEnemy(e, s);

    ctx.restore();

    // HP bar above
    const bw = s * 2.2, bh = 3;
    const bx = px - bw/2, by = py - s - 6;
    ctx.fillStyle = '#222'; ctx.fillRect(bx, by, bw, bh);
    const hr = e.hp/e.maxHp;
    ctx.fillStyle = hr > 0.6 ? '#4caf50' : hr > 0.3 ? '#ff9800' : '#f44336';
    ctx.fillRect(bx, by, bw * hr, bh);

    // Attack ring
    if (e.isAttacking) {
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([2,2]);
      ctx.beginPath(); ctx.arc(px, py, s*1.3, 0, Math.PI*2); ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}

function drawDefaultEnemy(e, s) {
  ctx.fillStyle = e.color;
  ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI*2); ctx.fill();
}

function drawGrunt(e, s) {
  ctx.fillStyle = e.color;
  ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI*2); ctx.fill();
  // Helmet
  ctx.fillStyle = '#8B0000';
  ctx.beginPath(); ctx.ellipse(0, -s*0.4, s*0.55, s*0.35, 0, Math.PI, 0); ctx.fill();
  // Eyes
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(-s*0.28, -s*0.05, s*0.16, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( s*0.28, -s*0.05, s*0.16, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(-s*0.28+e.dir.x*s*0.06, -s*0.05+e.dir.y*s*0.06, s*0.08, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( s*0.28+e.dir.x*s*0.06, -s*0.05+e.dir.y*s*0.06, s*0.08, 0, Math.PI*2); ctx.fill();
}

function drawRunner(e, s) {
  // Lean body
  ctx.fillStyle = e.color;
  ctx.save(); ctx.rotate(e.dir.x * 0.3);
  ctx.beginPath(); ctx.ellipse(0, 0, s*0.6, s, 0, 0, Math.PI*2); ctx.fill();
  ctx.restore();
  // Speed lines
  ctx.strokeStyle = 'rgba(255,150,0,0.6)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-e.dir.x*(s*0.8+i*s*0.4), -e.dir.y*(s*0.8+i*s*0.4));
    ctx.lineTo(-e.dir.x*(s*1.3+i*s*0.4), -e.dir.y*(s*1.3+i*s*0.4));
    ctx.stroke();
  }
}

function drawTank(e, s) {
  // Body
  ctx.fillStyle = '#5a6268';
  ctx.fillRect(-s, -s*0.7, s*2, s*1.4);
  // Turret
  ctx.fillStyle = '#7f8c8d';
  ctx.beginPath(); ctx.arc(0, 0, s*0.55, 0, Math.PI*2); ctx.fill();
  // Gun barrel
  ctx.fillStyle = '#555';
  ctx.save();
  ctx.rotate(Math.atan2(e.dir.y, e.dir.x));
  ctx.fillRect(s*0.4, -s*0.12, s*0.7, s*0.24);
  ctx.restore();
  // Tracks
  ctx.fillStyle = '#333';
  ctx.fillRect(-s, -s*0.9, s*2, s*0.25);
  ctx.fillRect(-s,  s*0.65, s*2, s*0.25);
}

function drawBrute(e, s) {
  // Huge body
  ctx.fillStyle = e.color;
  ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI*2); ctx.fill();
  // Spikes
  ctx.fillStyle = '#6c3483';
  for (let i = 0; i < 6; i++) {
    const a = (i/6)*Math.PI*2 + e.animT*0.3;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a)*s, Math.sin(a)*s);
    ctx.lineTo(Math.cos(a+0.2)*(s*1.35), Math.sin(a+0.2)*(s*1.35));
    ctx.lineTo(Math.cos(a-0.2)*(s*1.35), Math.sin(a-0.2)*(s*1.35));
    ctx.fill();
  }
  // Eyes glow
  ctx.fillStyle = '#ff0000';
  ctx.beginPath(); ctx.arc(-s*0.3, -s*0.2, s*0.16, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( s*0.3, -s*0.2, s*0.16, 0, Math.PI*2); ctx.fill();
}

function drawFlyer(e, s) {
  // Body
  ctx.fillStyle = e.color;
  ctx.beginPath();
  ctx.moveTo(0, -s*1.0);
  ctx.lineTo(s*0.6, s*0.4);
  ctx.lineTo(0, s*0.2);
  ctx.lineTo(-s*0.6, s*0.4);
  ctx.closePath(); ctx.fill();
  // Wings
  const wf = Math.sin(e.animT * 4) * 0.25;
  ctx.fillStyle = 'rgba(100,200,255,0.55)';
  ctx.beginPath();
  ctx.moveTo(-s*0.1, 0);
  ctx.lineTo(-s*(1.1+wf), -s*0.5);
  ctx.lineTo(-s*0.5, s*0.3);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo( s*0.1, 0);
  ctx.lineTo( s*(1.1+wf), -s*0.5);
  ctx.lineTo( s*0.5, s*0.3);
  ctx.closePath(); ctx.fill();
}

function drawBomber(e, s) {
  ctx.fillStyle = e.color;
  ctx.beginPath(); ctx.ellipse(0, 0, s*0.8, s*1.1, 0, 0, Math.PI*2); ctx.fill();
  // Wings
  ctx.fillStyle = '#34495e';
  ctx.beginPath();
  ctx.moveTo(-s*0.5, 0); ctx.lineTo(-s*1.8, -s*0.2); ctx.lineTo(-s*1.4, s*0.4); ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo( s*0.5, 0); ctx.lineTo( s*1.8, -s*0.2); ctx.lineTo( s*1.4, s*0.4); ctx.closePath(); ctx.fill();
  // Bomb bay
  ctx.fillStyle = '#555';
  ctx.beginPath(); ctx.ellipse(0, s*0.3, s*0.25, s*0.35, 0, 0, Math.PI*2); ctx.fill();
}

function drawAngel(e, s) {
  const pulse = 0.9 + Math.sin(e.animT*2)*0.1;
  // Glow
  const grd = ctx.createRadialGradient(0,0,s*0.3,0,0,s*2);
  grd.addColorStop(0,'rgba(255,255,255,0.25)');
  grd.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle = grd;
  ctx.beginPath(); ctx.arc(0,0,s*2,0,Math.PI*2); ctx.fill();
  // Body
  ctx.fillStyle = '#ecf0f1';
  ctx.beginPath(); ctx.arc(0, 0, s*pulse, 0, Math.PI*2); ctx.fill();
  // Halo
  ctx.strokeStyle = '#f1c40f'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, -s*1.1, s*0.5, 0, Math.PI*2); ctx.stroke();
  // Wings
  const wf = Math.sin(e.animT*3)*0.3;
  ctx.fillStyle='rgba(220,220,255,0.7)';
  for (let side of [-1,1]) {
    ctx.save(); ctx.scale(side, 1);
    ctx.beginPath();
    ctx.moveTo(s*0.2, -s*0.3);
    ctx.bezierCurveTo(s*0.8+wf*s, -s*(1+wf), s*1.8, -s*0.5, s*0.8, s*0.4);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}

function drawProjectiles() {
  const PROJ_STYLES = {
    machine_gun: { color: '#ffffa0', size: 3, trail: 8 },
    shotgun:     { color: '#ff8800', size: 4, trail: 5 },
    arrow:       { color: '#8B4513', size: 3, trail: 12 },
    howitzer:    { color: '#888888', size: 7, trail: 6 },
    rocket:      { color: '#ff4444', size: 6, trail: 10 },
  };

  for (const p of state.projectiles) {
    const style = PROJ_STYLES[p.weaponType] || { color: '#fff', size: 3, trail: 5 };
    const px = p.x * TILE, py = p.y * TILE;
    const spd = Math.sqrt(p.vx*p.vx+p.vy*p.vy);
    const trailLen = style.trail * TILE * 0.008;

    // Trail
    const trailX = px - p.vx/spd * trailLen * TILE;
    const trailY = py - p.vy/spd * trailLen * TILE;
    const grad = ctx.createLinearGradient(trailX, trailY, px, py);
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(1, style.color);
    ctx.strokeStyle = grad;
    ctx.lineWidth = style.size * 0.6;
    ctx.beginPath(); ctx.moveTo(trailX, trailY); ctx.lineTo(px, py); ctx.stroke();

    // Head
    ctx.fillStyle = style.color;
    ctx.beginPath(); ctx.arc(px, py, style.size/2, 0, Math.PI*2); ctx.fill();

    // Rocket exhaust
    if (p.weaponType === 'rocket') {
      const exAngle = Math.atan2(p.vy, p.vx) + Math.PI;
      const exLen = 6 + Math.random()*4;
      ctx.strokeStyle = '#ff8800';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + Math.cos(exAngle)*exLen, py + Math.sin(exAngle)*exLen);
      ctx.stroke();
    }
  }
}

function drawExplosions() {
  for (const exp of state.explosions) {
    const t = exp.age / exp.life;
    const alpha = 1 - t;
    const r = exp.radius * TILE * (0.3 + t * 0.7);
    const px = exp.x * TILE, py = exp.y * TILE;

    const grd = ctx.createRadialGradient(px, py, 0, px, py, r);
    grd.addColorStop(0,   `rgba(255,255,200,${alpha})`);
    grd.addColorStop(0.3, `rgba(255,120,20,${alpha*0.8})`);
    grd.addColorStop(0.7, `rgba(180,40,10,${alpha*0.4})`);
    grd.addColorStop(1,   'transparent');
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI*2); ctx.fill();
  }
}

function drawParticles() {
  for (const p of state.particles) {
    const t = p.age / p.life;
    const alpha = 1 - t;
    const px = p.x * TILE, py = p.y * TILE;

    if (p.type === 'text') {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.font = `bold ${Math.max(9, TILE*0.35)}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(p.text, px, py);
      ctx.globalAlpha = 1;
    } else {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      const sz = (p.size || 0.05) * TILE;
      ctx.beginPath(); ctx.arc(px, py, sz, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
}

// ============================================================
// HUD
// ============================================================
function updateHUD() {
  document.getElementById('wave-num').textContent = state.wave;
  document.getElementById('gold-amount').textContent = fmtGold(state.gold);

  if (state.phase === 'idle') {
    document.getElementById('wave-status').textContent = `Wave ${state.wave+1} まで: ${Math.ceil(state.waveTimer)}s`;
    document.getElementById('enemy-count').textContent = '';
  } else {
    const remaining = state.waveEnemies.length - state.enemiesSpawned;
    document.getElementById('wave-status').textContent = `⚔️ WAVE ${state.wave} 進行中`;
    document.getElementById('enemy-count').textContent =
      `敵: ${state.enemies.length} 体 | 出現待ち: ${remaining}`;
  }
}

function fmtGold(n) {
  n = Math.floor(n);
  if (n >= 1e9) return (n/1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n/1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n/1e3).toFixed(1) + 'K';
  return String(n);
}

function showToast(msg, color) {
  const area = document.getElementById('toast-area');
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  if (color) el.style.borderColor = color;
  area.appendChild(el);
  setTimeout(() => el.remove(), 2000);
}

// ============================================================
// ITEM PALETTE UI
// ============================================================
function buildPalette() {
  const palette = document.getElementById('item-palette');
  palette.innerHTML = '';

  for (const id of ITEM_ORDER) {
    const def = id === 'sandbag' ? SANDBAG_DEF : WEAPON_DEFS[id];
    const cost = placeCost(id);
    const canAfford = state.gold >= cost;

    const el = document.createElement('div');
    el.className = 'palette-item' + (state.selectedItem === id ? ' selected' : '') + (!canAfford ? ' cant-afford' : '');
    el.dataset.id = id;
    el.innerHTML = `
      <div class="item-icon">${def.icon}</div>
      <div class="item-name">${def.name}</div>
      <div class="item-cost">💰${fmtGold(cost)}</div>
      <div class="item-desc">${def.desc}</div>
    `;
    el.addEventListener('click', () => {
      state.selectedItem = id;
      buildPalette();
    });
    el.addEventListener('touchend', e => { e.preventDefault(); state.selectedItem = id; buildPalette(); });
    palette.appendChild(el);
  }
}

function setMode(mode) {
  state.interactionMode = mode;
  document.querySelectorAll('.mode-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.mode === mode);
  });
  if (mode === 'place') buildPalette();
  else {
    document.getElementById('item-palette').innerHTML =
      `<div style="padding:8px;color:#8b949e;font-size:13px;">
        ${mode === 'upgrade' ? '🎯 武器をタップして強化' : '💸 武器/土嚢をタップして売却 (40%返金)'}
      </div>`;
  }
}

// ============================================================
// INPUT HANDLING
// ============================================================
function canvasCoords(e) {
  const rect = canvas.getBoundingClientRect();
  const sx = canvas.width / rect.width;
  const sy = canvas.height / rect.height;
  let cx, cy;
  if (e.touches) {
    cx = (e.touches[0].clientX - rect.left) * sx;
    cy = (e.touches[0].clientY - rect.top) * sy;
  } else {
    cx = (e.clientX - rect.left) * sx;
    cy = (e.clientY - rect.top) * sy;
  }
  return { r: Math.floor(cy/TILE), c: Math.floor(cx/TILE) };
}

function handleInteraction(r, c) {
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;

  if (state.interactionMode === 'place') {
    doPlace(r, c);
  } else if (state.interactionMode === 'upgrade') {
    doUpgrade(r, c);
  } else if (state.interactionMode === 'sell') {
    doSell(r, c);
  }
}

function doPlace(r, c) {
  if (!state.selectedItem) return;
  if (r === SPAWN_ROW && c === SPAWN_COL) { showToast('⛔ スポーン地点には置けない'); return; }
  if (r === GOAL_ROW && c === GOAL_COL) { showToast('⛔ ゴール地点には置けない'); return; }
  if (state.grid[r][c]) { showToast('⛔ すでに配置済み'); return; }

  const cost = placeCost(state.selectedItem);
  if (state.gold < cost) { showToast('💰 ゴールドが足りない！', '#f85149'); return; }

  let entity;
  if (state.selectedItem === 'sandbag') {
    entity = makeSandbag(r, c, 0);
  } else {
    entity = makeWeapon(state.selectedItem, r, c, {});
  }

  state.grid[r][c] = entity;
  state.gold -= cost;
  invalidateAllPaths();
  buildPalette();
  updateHUD();
}

function doSell(r, c) {
  const cell = state.grid[r][c];
  if (!cell) { showToast('⛔ ここには何もない'); return; }

  let refund = 0;
  if (cell.type === 'sandbag') {
    refund = Math.floor(SANDBAG_DEF.baseCost * 0.4);
    // Sandbag upgrade refund
    const lv = cell.upgradeLevel || 0;
    for (let i = 0; i < lv; i++) refund += Math.floor(upgradeCost('sandbag','hp',i) * 0.4);
  } else {
    refund = Math.floor(WEAPON_DEFS[cell.weaponType].baseCost * 0.4);
    for (const [stat, lv] of Object.entries(cell.upgrades || {})) {
      refund += upgradeRefund(cell.weaponType, stat, lv);
    }
  }

  state.grid[r][c] = null;
  state.gold += refund;
  invalidateAllPaths();
  showToast(`💸 売却 +${fmtGold(refund)}💰`);
  buildPalette();
  updateHUD();
}

// ============================================================
// UPGRADE PANEL
// ============================================================
let upgradeTarget = null;

function doUpgrade(r, c) {
  const cell = state.grid[r][c];
  if (!cell) { showToast('⛔ ここには何もない'); return; }
  upgradeTarget = cell;
  renderUpgradePanel();
  document.getElementById('upgrade-panel').classList.remove('hidden');
}

function closeUpgradePanel() {
  document.getElementById('upgrade-panel').classList.add('hidden');
  upgradeTarget = null;
}

function renderUpgradePanel() {
  if (!upgradeTarget) return;
  const cell = upgradeTarget;

  if (cell.type === 'sandbag') {
    renderSandbagUpgrade(cell);
    return;
  }

  const def = WEAPON_DEFS[cell.weaponType];
  const stats = weaponStats(cell.weaponType, cell.upgrades);
  const upgrades = cell.upgrades || {};

  document.getElementById('upgrade-title').textContent = `${def.icon} ${def.name}`;

  let html = `<div class="weapon-info-box">`;
  html += `ダメージ: ${stats.damage.toFixed(1)} | 連射: ${stats.fireRate.toFixed(2)}/s | 射程: ${stats.range.toFixed(1)}<br>`;
  if (stats.overheatMax > 0) html += `耐熱: ${stats.overheatMax.toFixed(0)} | `;
  html += `弾速: ${stats.bulletSpeed.toFixed(1)} | HP: ${cell.hp.toFixed(0)}/${stats.hp.toFixed(0)}`;
  if (stats.aoe > 0) html += ` | AOE: ${stats.aoe.toFixed(1)}`;
  html += `</div>`;

  html += `<div class="upgrade-section-title">アップグレード</div>`;

  for (const stat of UPGRADE_STATS) {
    const lv = upgrades[stat] || 0;
    const cost = upgradeCost(cell.weaponType, stat, lv);
    const refund = upgradeRefund(cell.weaponType, stat, lv);
    const canAfford = state.gold >= cost;
    const statLabel = UPGRADE_STAT_NAMES[stat];
    const nextVal = getStatPreview(cell.weaponType, upgrades, stat);

    html += `<div class="upgrade-row">
      <span class="upgrade-stat-name">${statLabel}</span>
      <span class="upgrade-stat-val">${nextVal}</span>
      <span class="upgrade-level-badge">Lv.${lv}</span>
      <button class="btn-up" onclick="doUpgradeStat('${stat}')" ${canAfford?'':'disabled'}>
        ↑ 💰${fmtGold(cost)}
      </button>
      ${lv > 0 ? `<button class="btn-down" onclick="doDowngradeStat('${stat}')">↓ 💰${fmtGold(refund)}</button>` : ''}
    </div>`;
  }

  document.getElementById('upgrade-content').innerHTML = html;
}

function getStatPreview(weaponType, upgrades, stat) {
  const uCurrent = Object.assign({}, upgrades);
  const uNext = Object.assign({}, upgrades, { [stat]: (upgrades[stat]||0) + 1 });
  const sCur = weaponStats(weaponType, uCurrent);
  const sNext = weaponStats(weaponType, uNext);

  const fmt = v => v >= 100 ? Math.round(v) : v >= 10 ? v.toFixed(1) : v.toFixed(2);
  switch (stat) {
    case 'damage':   return `${fmt(sCur.damage)}→${fmt(sNext.damage)}`;
    case 'fireRate': return `${fmt(sCur.fireRate)}→${fmt(sNext.fireRate)}/s`;
    case 'range':    return `${fmt(sCur.range)}→${fmt(sNext.range)}`;
    case 'hp':       return `${fmt(sCur.hp)}→${fmt(sNext.hp)}`;
    case 'overheat': return `耐熱${fmt(sCur.overheatMax)}→${fmt(sNext.overheatMax)}`;
    case 'magazine': return sCur.magazine < 0 ? '∞' : `${sCur.magazine}→${sNext.magazine}`;
    default: return '';
  }
}

function doUpgradeStat(stat) {
  if (!upgradeTarget) return;
  const cell = upgradeTarget;
  const lv = cell.upgrades[stat] || 0;
  const cost = upgradeCost(cell.weaponType, stat, lv);
  if (state.gold < cost) { showToast('💰 ゴールドが足りない！', '#f85149'); return; }

  state.gold -= cost;
  cell.upgrades[stat] = lv + 1;

  // Update HP if HP stat upgraded
  if (stat === 'hp') {
    const newStats = weaponStats(cell.weaponType, cell.upgrades);
    const ratio = cell.hp / cell.maxHp;
    cell.maxHp = newStats.hp;
    cell.hp = cell.maxHp * Math.min(1, ratio + 0.1); // slight heal on upgrade
  }

  renderUpgradePanel();
  buildPalette();
  updateHUD();
}

function doDowngradeStat(stat) {
  if (!upgradeTarget) return;
  const cell = upgradeTarget;
  const lv = cell.upgrades[stat] || 0;
  if (lv <= 0) return;

  const refund = upgradeRefund(cell.weaponType, stat, lv);
  state.gold += refund;
  cell.upgrades[stat] = lv - 1;

  if (stat === 'hp') {
    const newStats = weaponStats(cell.weaponType, cell.upgrades);
    const ratio = cell.hp / cell.maxHp;
    cell.maxHp = newStats.hp;
    cell.hp = Math.min(cell.hp, cell.maxHp);
  }

  renderUpgradePanel();
  buildPalette();
  updateHUD();
}

function renderSandbagUpgrade(cell) {
  document.getElementById('upgrade-title').textContent = `🧱 土嚢`;
  const lv = cell.upgradeLevel || 0;
  const cost = upgradeCost('sandbag', 'hp', lv);
  const refund = upgradeRefund('sandbag', 'hp', lv);
  const canAfford = state.gold >= cost;

  const html = `
    <div class="weapon-info-box">HP: ${cell.hp.toFixed(0)} / ${cell.maxHp.toFixed(0)}</div>
    <div class="upgrade-section-title">アップグレード</div>
    <div class="upgrade-row">
      <span class="upgrade-stat-name">❤️ HP強化</span>
      <span class="upgrade-stat-val">${cell.maxHp.toFixed(0)}→${sandbagHp(lv+1).toFixed(0)}</span>
      <span class="upgrade-level-badge">Lv.${lv}</span>
      <button class="btn-up" onclick="doSandbagUpgrade()" ${canAfford?'':'disabled'}>
        ↑ 💰${fmtGold(cost)}
      </button>
      ${lv > 0 ? `<button class="btn-down" onclick="doSandbagDowngrade()">↓ 💰${fmtGold(refund)}</button>` : ''}
    </div>
  `;
  document.getElementById('upgrade-content').innerHTML = html;
}

function doSandbagUpgrade() {
  if (!upgradeTarget) return;
  const cell = upgradeTarget;
  const lv = cell.upgradeLevel || 0;
  const cost = upgradeCost('sandbag', 'hp', lv);
  if (state.gold < cost) { showToast('💰 ゴールドが足りない！', '#f85149'); return; }

  state.gold -= cost;
  const ratio = cell.hp / cell.maxHp;
  cell.upgradeLevel = lv + 1;
  cell.maxHp = sandbagHp(cell.upgradeLevel);
  cell.hp = cell.maxHp * Math.min(1, ratio + 0.1);

  renderSandbagUpgrade(cell);
  buildPalette();
  updateHUD();
}

function doSandbagDowngrade() {
  if (!upgradeTarget) return;
  const cell = upgradeTarget;
  const lv = cell.upgradeLevel || 0;
  if (lv <= 0) return;

  const refund = upgradeRefund('sandbag', 'hp', lv);
  state.gold += refund;
  cell.upgradeLevel = lv - 1;
  cell.maxHp = sandbagHp(cell.upgradeLevel);
  cell.hp = Math.min(cell.hp, cell.maxHp);

  renderSandbagUpgrade(cell);
  buildPalette();
  updateHUD();
}

// ============================================================
// GAMEOVER
// ============================================================
function triggerGameOver() {
  if (state.phase === 'gameover') return;
  state.phase = 'gameover';

  // 画面を赤フラッシュ
  const flash = document.createElement('div');
  flash.style.cssText = 'position:fixed;inset:0;background:rgba(255,0,0,0.45);z-index:150;pointer-events:none;animation:flashOut 0.6s ease forwards';
  document.body.appendChild(flash);
  flash.addEventListener('animationend', () => flash.remove());

  setTimeout(() => {
    document.getElementById('final-wave').textContent = state.wave;
    document.getElementById('final-gold').textContent = fmtGold(state.totalGold);
    document.getElementById('gameover-screen').classList.remove('hidden');
  }, 400);
}

function restartGame() {
  document.getElementById('gameover-screen').classList.add('hidden');
  document.getElementById('upgrade-panel').classList.add('hidden');
  state = makeInitialState();
  _id = 1;
  buildPalette();
  updateHUD();
}

// ============================================================
// BACKGROUND MODE
// ============================================================
let bgPauseMode = false; // true = バックグラウンドで停止, false = 継続

function toggleBgMode() {
  bgPauseMode = !bgPauseMode;
  const btn = document.getElementById('btn-bg');
  if (bgPauseMode) {
    btn.textContent = '⏸ BG停止中';
    btn.className = 'bg-pause';
    showToast('⏸ バックグラウンドで停止するよ');
  } else {
    btn.textContent = '▶ BG継続中';
    btn.className = 'bg-run';
    showToast('▶ バックグラウンドでも動き続けるよ');
  }
}

// フォアグラウンドに戻ったとき dt が爆発しないようリセット
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    state.lastTime = performance.now();
    render();
  }
});

// バックグラウンド継続用の独立インターバル (RAF は非表示タブでは ~1fps になるため)
setInterval(() => {
  if (!document.hidden) return;       // 表示中は RAF に任せる
  if (bgPauseMode) return;            // 停止モードはスキップ
  if (state.phase === 'gameover') return;
  const now = performance.now();
  const dt = Math.min((now - state.lastTime) / 1000, 0.1);
  state.lastTime = now;
  update(dt);
}, 50); // 20fps でバックグラウンド放置には十分

// ============================================================
// GAME LOOP
// ============================================================
function gameLoop(ts) {
  // タブが非表示 & 停止モードなら何もしない
  if (document.hidden && bgPauseMode) {
    requestAnimationFrame(gameLoop);
    return;
  }
  // バックグラウンド継続中はインターバルが update を担うので render だけ
  if (!document.hidden) {
    const dt = Math.min((ts - state.lastTime) / 1000, 0.05);
    state.lastTime = ts;
    if (state.phase !== 'gameover') update(dt);
    render();
  }
  requestAnimationFrame(gameLoop);
}

// ============================================================
// RESIZE
// ============================================================
function resizeCanvas() {
  const wrap = document.getElementById('canvas-wrap');
  const ww = wrap.clientWidth;
  const wh = wrap.clientHeight;
  const tw = Math.floor(ww / COLS);
  const th = Math.floor(wh / ROWS);
  TILE = Math.max(14, Math.min(tw, th, 40));
  canvas.width  = COLS * TILE;
  canvas.height = ROWS * TILE;
}

// ============================================================
// INIT
// ============================================================
window.addEventListener('DOMContentLoaded', () => {
  canvas = document.getElementById('game-canvas');
  ctx = canvas.getContext('2d');

  state = makeInitialState();
  buildPalette();
  setMode('place');
  updateHUD();
  resizeCanvas();

  // Canvas events
  canvas.addEventListener('click', e => {
    const { r, c } = canvasCoords(e);
    handleInteraction(r, c);
  });

  canvas.addEventListener('touchend', e => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    const touch = e.changedTouches[0];
    const r = Math.floor((touch.clientY - rect.top) * sy / TILE);
    const c = Math.floor((touch.clientX - rect.left) * sx / TILE);
    handleInteraction(r, c);
  }, { passive: false });

  canvas.addEventListener('mousemove', e => {
    const { r, c } = canvasCoords(e);
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
      state.hoveredCell = { r, c };
    } else {
      state.hoveredCell = null;
    }
  });
  canvas.addEventListener('mouseleave', () => { state.hoveredCell = null; });

  window.addEventListener('resize', () => { resizeCanvas(); });

  state.lastTime = performance.now();
  requestAnimationFrame(gameLoop);
});
