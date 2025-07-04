const NUM_REELS = 5;
const NUM_ROWS = 5;
const SPIN_DURATION = 1200; // ms total spin time per reel
const SPIN_DELAY = 250;     // ms delay between each reel's stop

let featureActive = false;
let featureSpinsLeft = 0;
let featureBet = 0;

// Animated Sprites
const SPRITE_EMOJIS = ['💰', '💵', '💎', '💵'];
let spriteCount = 1; // Start with one sprite
const MAX_SPRITES = 10;
let sprites = [];

const BET_OPTIONS = [1, 10, 50, 100, 250, 500, 1000, 5000, 10000, 50000]; // Array of bet options
let betIndex = 1; // Default to 10

// Slot symbols and weights
const WILD_SYMBOL = '🃏';
const FEATURE_SYMBOL = '🎁';
const symbols = ['🍒', '🍋', '7️⃣', '🔔', '🍀', '⭐', WILD_SYMBOL, FEATURE_SYMBOL];

const payoutTable = {
  '🍒': { 3: 0.2, 4: 0.4, 5: 0.8 },
  '🍋': { 3: 0.3, 4: 0.6, 5: 1 },
  '🔔': { 3: 0.4, 4: 0.8, 5: 1.2 },
  '🍀': { 3: 0.6, 4: 1, 5: 1.5 },
  '⭐': { 3: 1, 4: 2, 5: 3 },
  '7️⃣': { 3: 2, 4: 4, 5: 10 },
  '💎': { 3: 3, 4: 6, 5: 15 },
};

// Horizontal paylines for all rows
const paylines = [
  [0,0,0,0,0], // Top row
  [1,1,1,1,1],
  [2,2,2,2,2],
  [3,3,3,3,3],
  [4,4,4,4,4], // Bottom row

  // Two main diagonals
  [0,1,2,3,4], // TL to BR
  [4,3,2,1,0], // BL to TR

  // V shapes and zigzags (add as many as you want)
  [0,1,2,1,0],
  [4,3,2,3,4],
  [1,2,3,2,1],
  [3,2,1,2,3],

  // More complex patterns
  [0,1,1,1,0],
  [1,2,2,2,1],
  [2,3,3,3,2],
  [3,4,4,4,3],

  [4,3,3,3,4],
  [3,2,2,2,3],
  [2,1,1,1,2],
  [1,0,0,0,1],

  [0,0,1,0,0],
  [1,1,2,1,1],
  [2,2,3,2,2],
  [3,3,4,3,3],

  [4,4,3,4,4],
  [3,3,2,3,3],
  [2,2,1,2,2],
  [1,1,0,1,1],

  [0,4,0,4,0],
  [4,0,4,0,4],
  [0,3,0,3,0],
  [0,2,0,2,0],
  [0,1,0,1,0],
  [1,4,1,4,1],
  [2,4,2,4,2],
  [3,4,3,4,3],
  [4,0,4,0,4],
  [4,1,4,1,4],
  [4,2,4,2,4],
  [4,3,4,3,4],
  [0,0,1,1,0],
  [1,1,2,2,1],
  [2,2,3,3,2],
  [3,3,4,4,3],
  [0,0,0,1,1],
  [1,1,1,2,2],
  [2,2,2,3,3],
  [3,3,3,4,4],

  // ... (add more creative lines as desired)
];

// Define symbol counts for each reel (adjust as needed)
const SYMBOL_COUNTS = [
  { '🍒': 4, '🍋': 4, '🔔': 4, '🍀': 3, '7️⃣': 4, '⭐': 3, '💎': 2, [WILD_SYMBOL]: 0, [FEATURE_SYMBOL]: 3  }, // Reel 1
  { '🍒': 5, '🍋': 3, '🔔': 3, '🍀': 4, '7️⃣': 2, '⭐': 3, '💎': 2, [WILD_SYMBOL]: 1, [FEATURE_SYMBOL]: 0  }, // Reel 2
  { '🍒': 4, '🍋': 4, '🔔': 4, '🍀': 3, '7️⃣': 3, '⭐': 1, '💎': 1, [WILD_SYMBOL]: 2, [FEATURE_SYMBOL]: 3  }, // Reel 3
  { '🍒': 3, '🍋': 4, '🔔': 3, '🍀': 4, '7️⃣': 4, '⭐': 3, '💎': 2, [WILD_SYMBOL]: 1, [FEATURE_SYMBOL]: 0  }, // Reel 4
  { '🍒': 4, '🍋': 3, '🔔': 4, '🍀': 3, '7️⃣': 2, '⭐': 2, '💎': 1, [WILD_SYMBOL]: 0, [FEATURE_SYMBOL]: 3  }  // Reel 5
];

// Helper to create a shuffled reel strip for a given symbol count object
function createShuffledReel(symbolCount) {
  let strip = [];
  for (const [symbol, count] of Object.entries(symbolCount)) {
    for (let i = 0; i < count; i++) {
      strip.push(symbol);
    }
  }
  // Shuffle the strip
  for (let i = strip.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [strip[i], strip[j]] = [strip[j], strip[i]];
  }
  return strip;
}

// On each spin, generate a new shuffled strip for each reel
function spinReels() {
  let result = [];
  for (let i = 0; i < NUM_REELS; i++) {
    const reelStrip = createShuffledReel(SYMBOL_COUNTS[i]);
    const stop = Math.floor(Math.random() * reelStrip.length);
    // Get 5 symbols centered on stop (wrap around)
    let window = [];
    for (let j = -2; j <= 2; j++) {
      let idx = (stop + j + reelStrip.length) % reelStrip.length;
      window.push(reelStrip[idx]);
    }
    result.push(window);
  }
  return result;
}

function checkFeatureTrigger(result) {
  // Count how many reels contain the feature symbol
  const reelsWithFeature = result.filter(reel => reel.includes(FEATURE_SYMBOL)).length;
  return reelsWithFeature >= 3;
}

function isMatch(symbol, target) {
  return symbol === target || symbol === WILD_SYMBOL;
}

function checkPaylineWins(result, paylines, payoutTable) {
  let wins = [];
  for (const line of paylines) {
    // Build the symbol sequence along this line
    let symbolsLine = line.map((row, reel) => result[reel][row]);

    // Find the first non-wild symbol to use as the "target" for this line
    let targetSymbol = symbolsLine.find(sym => sym !== WILD_SYMBOL);
    if (!targetSymbol) continue; // All wilds, skip (or handle as special case if you want)

    let consecutive = 0;
    for (let i = 0; i < symbolsLine.length; i++) {
      if (symbolsLine[i] === targetSymbol || symbolsLine[i] === WILD_SYMBOL) {
        consecutive++;
      } else {
        break;
      }
    }

    // Pay for 3, 4, or 5 matches (using the target symbol's payout)
    if (consecutive >= 3 && payoutTable[targetSymbol] && payoutTable[targetSymbol][consecutive]) {
      wins.push({
        line,
        symbol: targetSymbol,
        count: consecutive,
        payout: payoutTable[targetSymbol][consecutive]
      });
    }
  }
  return wins;
}

function calculatePayout(bet, wins) {
  let total = 0;
  for (const win of wins) {
    total += bet * win.payout;
  }
  return total;
}

function renderReels(result, winningPositions = []) {
  for (let i = 0; i < NUM_REELS; i++) {
    // Build this reel's HTML
    let html = '';
    for (let j = 0; j < NUM_ROWS; j++) {
      // Check if this position is in winningPositions
      const isWinningSymbol = winningPositions.some(
        pos => pos.reel === i && pos.row === j
      );
      html += `<div class="${isWinningSymbol ? 'win-symbol' : ''}">${result[i][j]}</div>`;
    }
    document.getElementById('reel' + (i + 1)).innerHTML = html;
  }
}

function animateSpin(finalResult, onFinish) {
  let currentResult = Array.from({ length: NUM_REELS }, () => Array(NUM_ROWS).fill(''));
  let reelIntervals = [];
  let reelStopped = Array(NUM_REELS).fill(false);

  // Start spinning all reels
  for (let reel = 0; reel < NUM_REELS; reel++) {
    reelIntervals[reel] = setInterval(() => {
      // For each row, pick a random symbol for animation
      for (let row = 0; row < NUM_ROWS; row++) {
        currentResult[reel][row] = symbols[Math.floor(Math.random() * symbols.length)];
      }
      renderReels(currentResult);
    }, 50);
  }

  // Sequentially stop reels
  for (let reel = 0; reel < NUM_REELS; reel++) {
    setTimeout(() => {
      clearInterval(reelIntervals[reel]);
      // Set final result for the stopped reel
      currentResult[reel] = finalResult[reel];
      renderReels(currentResult);
      reelStopped[reel] = true;
      // When all reels stopped, call onFinish
      if (reelStopped.every(Boolean)) {
        onFinish();
      }
    }, SPIN_DURATION + reel * SPIN_DELAY);
  }
}

function getWinningPositions(wins) {
  let positions = [];
  for (const win of wins) {
    // For each win, highlight only the consecutive matches (3, 4, or 5)
    for (let k = 0; k < win.count; k++) {
      positions.push({ reel: k, row: win.line[k] });
    }
  }
  return positions;
}

function displayResult(wins, payout) {
  if (wins.length > 0) {
    // Aggregate total multiplier per symbol and round to nearest 0.1
    const symbolTotals = {};
    wins.forEach(w => {
      if (!symbolTotals[w.symbol]) symbolTotals[w.symbol] = 0;
      symbolTotals[w.symbol] += w.payout;
    });

    // Build an array of formatted symbol results
    const symbolLines = Object.entries(symbolTotals).map(
      ([symbol, totalPayout]) =>
        `${symbol} <span style="color:#ffd700">x${Math.round(totalPayout * 10) / 10}</span>`
    );

    // Group into rows of 3
    let groupedLines = '';
    for (let i = 0; i < symbolLines.length; i += 3) {
      groupedLines += symbolLines.slice(i, i + 3).join(' &nbsp; ') + '<br>';
    }

    document.getElementById('result').innerHTML =
      `<span style="color:#ffd700;font-weight:bold;">WIN!</span><br>${groupedLines}<br>Payout: <span style="color:#2ecc40;font-weight:bold;">$${Math.round(payout * 10) / 10}</span>`;
  } else {
    document.getElementById('result').innerHTML =
      '<span style="color:#e74c3c">No win. Try again!</span>';
  }
}

let playerCash = 0; // You will update this from Lua in your FiveM NUI callback

// Update the cash display in the UI
function updateCashDisplay(amount) {
  playerCash = amount;
  const cashBox = document.getElementById('cash-box');
  if (cashBox) {
    cashBox.textContent = `$${amount}`;
  }
}

// Initial render
renderReels([
  ['🍒', '🍋', '7️⃣', '🔔', '🍀'],
  ['🍀', '⭐', '🍒', '🍋', '7️⃣'],
  ['🍒', '🍋', '7️⃣', '🔔', '🍀'],
  ['⭐', '🍀', '7️⃣', '🍋', '🍒'],
  ['🍋', '🍒', '🍀', '⭐', '7️⃣']
]);

function updateBetDisplay() {
  document.getElementById('bet-display').textContent = `$${BET_OPTIONS[betIndex]}`;
}

document.getElementById('bet-decrease').addEventListener('click', () => {
  if (betIndex > 0) {
    betIndex--;
    updateBetDisplay();
  }
});

document.getElementById('bet-increase').addEventListener('click', () => {
  if (betIndex < BET_OPTIONS.length - 1) {
    betIndex++;
    updateBetDisplay();
  }
});

// Initialize display on page load
updateBetDisplay();

function renderSprites() {
  const spritesContainer = document.querySelector('.slot-sprites');
  spritesContainer.innerHTML = '';
  sprites = [];
  for (let i = 0; i < spriteCount; i++) {
    const sprite = document.createElement('div');
    sprite.className = 'sprite';
    sprite.innerText = SPRITE_EMOJIS[i % SPRITE_EMOJIS.length];
    spritesContainer.appendChild(sprite);
    sprites.push(sprite);
  }
  setTimeout(() => {
    const areaWidth = spritesContainer.offsetWidth || 340;
    sprites.forEach(sprite => wanderSprite(sprite, areaWidth));
  }, 100);
}

function wanderSprite(sprite, areaWidth) {
  const minX = 0;
  const maxX = areaWidth - 48; // 48px sprite width
  function move() {
    const x = minX + Math.random() * (maxX - minX);
    sprite.style.transform = `translateX(${x}px)`;
    const duration = 1200 + Math.random() * 1800;
    setTimeout(move, duration);
  }
  move();
}

function addSpriteOnBigWin() {
  if (spriteCount < MAX_SPRITES) {
    spriteCount++;
    renderSprites();
  }
}

// Create the slot bulbs dynamically
window.addEventListener('DOMContentLoaded', () => {
  const bulbsContainer = document.querySelector('.slot-bulbs');
  const bulbsPerTop = 18;
  const bulbsPerSide = 12;
  const bulbSize = 14; // px, should match your .bulb width/height

  // Top (left to right)
  for (let i = 0; i < bulbsPerTop; i++) {
    const bulb = document.createElement('div');
    bulb.className = 'bulb';
    bulb.style.left = `calc(${(i / (bulbsPerTop - 1)) * 100}% - ${bulbSize / 2}px)`;
    bulb.style.top = `-${bulbSize / 2}px`;
    bulbsContainer.appendChild(bulb);
  }
  // Right (top to bottom, skip first and last)
  for (let i = 1; i < bulbsPerSide - 1; i++) {
    const bulb = document.createElement('div');
    bulb.className = 'bulb';
    bulb.style.left = `calc(100% - ${bulbSize / 2}px)`;
    bulb.style.top = `calc(${(i / (bulbsPerSide - 1)) * 100}% - ${bulbSize / 2}px)`;
    bulbsContainer.appendChild(bulb);
  }
  // Left (top to bottom, skip first and last)
  for (let i = bulbsPerSide - 2; i > 0; i--) {
    const bulb = document.createElement('div');
    bulb.className = 'bulb';
    bulb.style.left = `-${bulbSize / 2}px`;
    bulb.style.top = `calc(${(i / (bulbsPerSide - 1)) * 100}% - ${bulbSize / 2}px)`;
    bulbsContainer.appendChild(bulb);
  }
  // Starfield
  const starsContainer = document.querySelector('.slot-stars');
  if (starsContainer) {
    const STAR_COUNT = 18; // Fewer stars
    for (let i = 0; i < STAR_COUNT; i++) {
      const star = document.createElement('div');
      star.className = 'slot-star';
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      starsContainer.appendChild(star);

      // Start the random flicker loop for this star
      flickerStar(star);
    }
  }

  function flickerStar(star) {
    // Longer off time: 5s to 15s
    const offTime = 5000 + Math.random() * 10000;
    setTimeout(() => {
      // Twinkle on: make it bigger and brighter
      star.classList.add('twinkle');
      // Stay on for a longer time (220ms to 350ms)
      setTimeout(() => {
        star.classList.remove('twinkle');
        // Recursively schedule the next flicker
        flickerStar(star);
      }, 220 + Math.random() * 130);
    }, offTime);
  }

  renderSprites();
});

function triggerBurst(count = 12, symbol = '🪙') {
  const burst = document.querySelector('.coin-burst');
  if (!burst) return;

  for (let i = 0; i < count; i++) {
    const item = document.createElement('div');
    item.className = 'coin';
    item.innerHTML = symbol;

    // Random angle and distance
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3;
    const distance = 80 + Math.random() * 40;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;

    item.style.left = `calc(50% - 16px + ${x}px)`;
    item.style.top = `calc(60% - 16px + ${y}px)`;
    item.style.animationDelay = `${Math.random() * 0.2}s`;

    burst.appendChild(item);

    setTimeout(() => {
      item.remove();
    }, 1200);
  }
}

function runFeatureSpin() {
  const bet = featureBet;
  document.getElementById('spin').disabled = true;
  document.getElementById('result').textContent = 'Spinning...';

  // Use reels with more wilds during feature
  const FEATURE_SYMBOL_COUNTS = [
    { ...SYMBOL_COUNTS[0], [WILD_SYMBOL]: (SYMBOL_COUNTS[0][WILD_SYMBOL] || 0) + 5 },
    { ...SYMBOL_COUNTS[1], [WILD_SYMBOL]: (SYMBOL_COUNTS[1][WILD_SYMBOL] || 0) + 4 },
    { ...SYMBOL_COUNTS[2], [WILD_SYMBOL]: (SYMBOL_COUNTS[2][WILD_SYMBOL] || 0) + 5 },
    { ...SYMBOL_COUNTS[3], [WILD_SYMBOL]: (SYMBOL_COUNTS[3][WILD_SYMBOL] || 0) + 4 },
    { ...SYMBOL_COUNTS[4], [WILD_SYMBOL]: (SYMBOL_COUNTS[4][WILD_SYMBOL] || 0) + 3 },
  ];

  function featureSpinReels() {
    let result = [];
    for (let i = 0; i < NUM_REELS; i++) {
      const reelStrip = createShuffledReel(FEATURE_SYMBOL_COUNTS[i]);
      const stop = Math.floor(Math.random() * reelStrip.length);
      let window = [];
      for (let j = -2; j <= 2; j++) {
        let idx = (stop + j + reelStrip.length) % reelStrip.length;
        window.push(reelStrip[idx]);
      }
      result.push(window);
    }
    return result;
  }

  const result = featureSpinReels();

  animateSpin(result, () => {
    const wins = checkPaylineWins(result, paylines, payoutTable);
    const payout = calculatePayout(bet, wins);

    if (payout > 0) {
      fetch(`https://${GetParentResourceName()}/winSlot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: payout })
      });
    }

    const winningPositions = getWinningPositions(wins);
    renderReels(result, winningPositions);
    displayResult(wins, payout);
    if (payout >= 3 * bet) {
      triggerBurst(18, '💵');
      addSpriteOnBigWin();
    } else if (payout >= 2 * bet) {
      triggerBurst(12, '🪙');
      addSpriteOnBigWin();
    }
    featureSpinsLeft--;
    updateFeatureCounter();
    if (featureSpinsLeft > 0) {
      document.getElementById('spin').disabled = false;
    } else {
      featureActive = false;
      featureBet = 0;
      hideFeatureCounter();
      setBetControlsEnabled(true); // <-- Unlock bet controls here
      document.getElementById('spin').disabled = false;
    }
  });
}

function setBetControlsEnabled(enabled) {
  document.getElementById('bet-increase').disabled = !enabled;
  document.getElementById('bet-decrease').disabled = !enabled;
}

function highlightFeatureSymbols(result) {
  for (let reel = 0; reel < result.length; reel++) {
    for (let row = 0; row < result[reel].length; row++) {
      if (result[reel][row] === FEATURE_SYMBOL) {
        const reelDiv = document.getElementById(`reel${reel + 1}`);
        if (reelDiv && reelDiv.children[row]) {
          reelDiv.children[row].classList.add('feature-win-symbol');
        }
      }
    }
  }
}

function clearFeatureHighlights() {
  document.querySelectorAll('.feature-win-symbol').forEach(el => {
    el.classList.remove('feature-win-symbol');
  });
}

function updateFeatureCounter() {
  const counter = document.getElementById('feature-counter');
  counter.style.display = 'block';
  counter.textContent = `Free Games: ${featureSpinsLeft} / 7`;
}

function hideFeatureCounter() {
  const counter = document.getElementById('feature-counter');
  counter.style.display = 'none';
}

// functions to show/hide the slot machine
function showSlotMachine() {
  document.getElementById('slot-machine').style.display = 'block';
}

function hideSlotMachine() {
  document.getElementById('slot-machine').style.display = 'none';
}

// Listen for messages from Lua to show/hide the slot machine
// SendNUIMessage({ action = "showSlot" })
// SendNUIMessage({ action = "hideSlot" })
window.addEventListener('message', function(event) {
  const data = event.data;
  if (data.action === 'showSlot') {
    document.getElementById('slot-machine').style.display = 'block';
    document.getElementById('result').textContent = '';
  }
  if (data.action === 'hideSlot') {
    document.getElementById('slot-machine').style.display = 'none';
  }
  if (data.action === 'updateCash') {
    updateCashDisplay(data.cash);
  }
});

// Handle closing the slot machine with Escape key
document.addEventListener('keydown', function(e) {
  if (document.getElementById('slot-machine').style.display === 'block' && e.key === "Escape") {
    fetch(`https://${GetParentResourceName()}/closeSlot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    e.preventDefault();
  }
});

// main spin button handler
document.getElementById('spin').addEventListener('click', function() {
  // If feature modal is up, start feature
  if (document.getElementById('feature-modal').style.display === 'flex') {
    document.getElementById('feature-modal').style.display = 'none';
    featureActive = true;
    featureSpinsLeft = 7;
    updateFeatureCounter();
    runFeatureSpin();
    return;
  }

  // If feature is active, run feature spin
  if (featureActive) {
    runFeatureSpin();
    return;
  }

  const bet = BET_OPTIONS[betIndex];
  
  // Ask Lua to check and remove cash
  fetch(`https://${GetParentResourceName()}/spinSlot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bet: bet })
  })
  .then(res => res.json())
  .then(response => {
    if (response.success) {
      // 1. Generate the final spin result
      const finalResult = spinReels();

      // 2. Animate the spin, then process the result
      animateSpin(finalResult, function() {
        // Check for feature trigger
        if (checkFeatureTrigger(finalResult)) {
          featureBet = BET_OPTIONS[betIndex]; // Lock in the bet at trigger time
          setBetControlsEnabled(false);        // Disable bet controls

          // Highlight feature symbols
          highlightFeatureSymbols(finalResult);

          // Show "Feature Won" in result
          document.getElementById('result').innerHTML =
            `<span style="color:#ffd700;font-weight:bold;">Feature Won!</span>`;

          // Pause, then show feature modal
          setTimeout(() => {
            clearFeatureHighlights();
            document.getElementById('feature-modal').style.display = 'flex';
            document.getElementById('spin').disabled = false;
          }, 1200); // 1.2s pause for effect
          return;
        }

        // 3. Check for wins
        const wins = checkPaylineWins(finalResult, paylines, payoutTable);
        const payout = calculatePayout(bet, wins);

        // 4. Highlight winning positions
        const winningPositions = getWinningPositions(wins);
        renderReels(finalResult, winningPositions);

        // 5. Display result message
        displayResult(wins, payout);

        // 6. Trigger coin burst animation
        if (payout >= 2 * bet) {
          triggerBurst(12, '🪙'); // Coin burst for double win
          addSpriteOnBigWin(); // Add a sprite on big win
        } else if (payout >= 3 * bet) {
          triggerBurst(18, '💵'); // Cash burst for triple win
          addSpriteOnBigWin(); // Add a sprite on big win
        } else if (payout >= 5 * bet) {
          triggerBurst(26, '🎉'); // Celabrate burst for five times win or more
          addSpriteOnBigWin(); // Add a sprite on big win
        }

        // 7. If win, notify Lua to add cash
        if (payout > 0) {
          fetch(`https://${GetParentResourceName()}/winSlot`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: payout })
          });
        }
      });
    } else {
      document.getElementById('result').textContent = response.error || "Not enough cash!";
    }
  });
});

document.addEventListener('keydown', function(e) {
  if (document.getElementById('slot-machine').style.display === 'block' && e.key === "Escape") {
    fetch(`https://${GetParentResourceName()}/closeSlot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    e.preventDefault();
  }
});     

document.getElementById('feature-spin-btn').addEventListener('click', () => {
  const modal = document.getElementById('feature-modal');
  const content = modal.querySelector('.feature-modal-content');
  content.classList.add('zoomOut');
  setTimeout(() => {
    modal.style.display = 'none';
    content.classList.remove('zoomOut');
    featureActive = true;
    featureSpinsLeft = 7;
    updateFeatureCounter();
    runFeatureSpin();
  }, 400); // Match the animation duration
});