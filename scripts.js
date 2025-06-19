const NUM_REELS = 5;
const NUM_ROWS = 5;
const SPIN_DURATION = 1200; // ms total spin time per reel
const SPIN_DELAY = 250;     // ms delay between each reel's stop
// Initial player cash
let playerCash = 1000; 
// Feature state
let featureActive = false;
let featureSpinsLeft = 0;
let featureBet = 0;
// Random bonus state
let randomBonusActive = false;
let randomBonusBet = 0;
// Animated Sprites
const SPRITE_EMOJIS = ['💰', '💵', '💎', '💵'];
let spriteCount = 1; // Start with one sprite
const MAX_SPRITES = 10;
let sprites = [];
// Bet options for the player
const BET_OPTIONS = [1, 10, 50, 100, 250, 500, 1000, 5000, 10000, 50000]; // Array of bet options
let betIndex = 1; // Default to 10
// Slot symbols and weights
const WILD_SYMBOL = '🃏';
const FEATURE_SYMBOL = '🎁';
const symbols = ['🍒', '🍋', '7️⃣', '🔔', '🍀', '⭐', WILD_SYMBOL, FEATURE_SYMBOL];

// Payout value table for each symbol
const payoutTable = {
  '🍒': { 3: 0.2, 4: 0.4, 5: 0.8 },
  '🍋': { 3: 0.3, 4: 0.6, 5: 1 },
  '🔔': { 3: 0.4, 4: 0.8, 5: 1.2 },
  '🍀': { 3: 0.6, 4: 1, 5: 1.5 },
  '⭐': { 3: 1, 4: 2, 5: 3 },
  '7️⃣': { 3: 2, 4: 4, 5: 10 },
  '💎': { 3: 3, 4: 6, 5: 15 },
};

// Define the paylines
const paylines = [
  // Horizontal paylines for all rows
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
  { '🍒': 4, '🍋': 4, '🔔': 4, '🍀': 3, '7️⃣': 4, '⭐': 3, '💎': 2, [WILD_SYMBOL]: 0, [FEATURE_SYMBOL]: 1  }, // Reel 1
  { '🍒': 5, '🍋': 3, '🔔': 3, '🍀': 4, '7️⃣': 2, '⭐': 3, '💎': 2, [WILD_SYMBOL]: 1, [FEATURE_SYMBOL]: 0  }, // Reel 2
  { '🍒': 4, '🍋': 4, '🔔': 4, '🍀': 3, '7️⃣': 3, '⭐': 1, '💎': 1, [WILD_SYMBOL]: 2, [FEATURE_SYMBOL]: 1  }, // Reel 3
  { '🍒': 3, '🍋': 4, '🔔': 3, '🍀': 4, '7️⃣': 4, '⭐': 3, '💎': 2, [WILD_SYMBOL]: 1, [FEATURE_SYMBOL]: 0  }, // Reel 4
  { '🍒': 4, '🍋': 3, '🔔': 4, '🍀': 3, '7️⃣': 2, '⭐': 2, '💎': 1, [WILD_SYMBOL]: 0, [FEATURE_SYMBOL]: 1  }  // Reel 5
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

// Try to trigger a random bonus with a 0.5% chance
function tryTriggerRandomBonus() {
  return Math.random() < 0.005;
}

// Count how many reels contain the feature symbol
function checkFeatureTrigger(result) {
  const reelsWithFeature = result.filter(reel => reel.includes(FEATURE_SYMBOL)).length;
  return reelsWithFeature >= 3;
}

// Check if a symbol matches the target symbol or is a wild
function isMatch(symbol, target) {
  return symbol === target || symbol === WILD_SYMBOL;
}

// Check for wins along all paylines
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

// Calculate total payout based on bet and wins
function calculatePayout(bet, wins) {
  let total = 0;
  for (const win of wins) {
    total += bet * win.payout;
  }
  return total;
}

// Render the reels in the UI
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

// Animate the spinning of reels
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

// Get winning positions for display
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

// Display the result in the UI
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

// Update the cash box display
function updateCashBox() {
  document.getElementById('cash-box').textContent = `$${playerCash}`;
}

// Initial render of reels
renderReels([
  ['🍒', '🍋', '7️⃣', '🔔', '🍀'],
  ['🍀', '⭐', '🍒', '🍋', '7️⃣'],
  ['🍒', '🍋', '7️⃣', '🔔', '🍀'],
  ['⭐', '🍀', '7️⃣', '🍋', '🍒'],
  ['🍋', '🍒', '🍀', '⭐', '7️⃣']
]);

// Update the bet display
function updateBetDisplay() {
  document.getElementById('bet-display').textContent = `$${BET_OPTIONS[betIndex]}`;
}

// Event listeners for bet controls
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

// Render the initial sprites
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

// Make the sprites wander randomly within the container
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

// Add a sprite when a big win occurs
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

  // Flicker stars
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

// Trigger a burst of coins or cash
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

// Run a random bonus spin
function runRandomBonusSpin() {
  const bet = randomBonusBet;
  document.getElementById('spin').disabled = true;
  document.getElementById('result').textContent = 'Spinning...';

  // Only high-value symbols and extra wilds
  const HIGH_SYMBOLS = ['⭐', '7️⃣', '💎', WILD_SYMBOL];
  const BONUS_SYMBOL_COUNTS = [
    { '⭐': 3, '7️⃣': 3, '💎': 2, [WILD_SYMBOL]: 5 },
    { '⭐': 3, '7️⃣': 3, '💎': 2, [WILD_SYMBOL]: 5 },
    { '⭐': 3, '7️⃣': 3, '💎': 2, [WILD_SYMBOL]: 5 },
    { '⭐': 3, '7️⃣': 3, '💎': 2, [WILD_SYMBOL]: 5 },
    { '⭐': 3, '7️⃣': 3, '💎': 2, [WILD_SYMBOL]: 5 },
  ];

  function bonusSpinReels() {
    let result = [];
    for (let i = 0; i < NUM_REELS; i++) {
      const reelStrip = createShuffledReel(BONUS_SYMBOL_COUNTS[i]);
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

  const result = bonusSpinReels();

  animateSpin(result, () => {
    const wins = checkPaylineWins(result, paylines, payoutTable);
    const payout = calculatePayout(bet, wins);
    playerCash += payout;
    updateCashBox();
    const winningPositions = getWinningPositions(wins);
    renderReels(result, winningPositions);
    displayResult(wins, payout);
    if (payout >= 2 * bet) {
      triggerBurst(12, '🪙');
      addSpriteOnBigWin(); 
    } else if (payout >= 3 * bet) {
      triggerBurst(18, '💵'); 
      addSpriteOnBigWin(); 
    } else if (payout >= 5 * bet) {
      triggerBurst(26, '🎉'); 
      addSpriteOnBigWin(); 
    }
    setBetControlsEnabled(true);
    randomBonusActive = false;
    document.getElementById('spin').disabled = false;
  });
}

// Run the feature free spins with more wilds
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
    playerCash += payout;
    updateCashBox();
    const winningPositions = getWinningPositions(wins);
    renderReels(result, winningPositions);
    displayResult(wins, payout);
    if (payout >= 2 * bet) {
      triggerBurst(12, '🪙');
      addSpriteOnBigWin(); 
    } else if (payout >= 3 * bet) {
      triggerBurst(18, '💵'); 
      addSpriteOnBigWin(); 
    } else if (payout >= 5 * bet) {
      triggerBurst(26, '🎉'); 
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
      setBetControlsEnabled(true); 
      document.getElementById('spin').disabled = false;
    }
  });
}

// Enable or disable bet controls based on feature state
function setBetControlsEnabled(enabled) {
  document.getElementById('bet-increase').disabled = !enabled;
  document.getElementById('bet-decrease').disabled = !enabled;
}

// Highlight feature symbols in the reels
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

// Clear feature highlights from the reels
function clearFeatureHighlights() {
  document.querySelectorAll('.feature-win-symbol').forEach(el => {
    el.classList.remove('feature-win-symbol');
  });
}

// Update the feature counter display
function updateFeatureCounter() {
  const counter = document.getElementById('feature-counter');
  counter.style.display = 'block';
  counter.textContent = `Free Games: ${featureSpinsLeft} / 7`;
}

function hideFeatureCounter() {
  const counter = document.getElementById('feature-counter');
  counter.style.display = 'none';
}

// spin button click handler:
document.getElementById('spin').addEventListener('click', () => {
  // If random bonus modal is up, start the bonus
  if (document.getElementById('random-bonus-modal').style.display === 'flex') {
    document.getElementById('random-bonus-modal').style.display = 'none';
    randomBonusActive = true;
    updateBetDisplay();
    runRandomBonusSpin();
    return;
  }

  // If random bonus is active, run the bonus spin
  if (randomBonusActive) {
    runRandomBonusSpin();
    return;
  }

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

  // Try to trigger random bonus
  if (tryTriggerRandomBonus()) {
    randomBonusBet = BET_OPTIONS[betIndex];
    setBetControlsEnabled(false);
    document.getElementById('random-bonus-modal').style.display = 'flex';
    return;
  }

  const bet = BET_OPTIONS[betIndex];

  if (playerCash < bet) {
    document.getElementById('result').innerHTML =
      '<span style="color:#e74c3c">Not enough cash to place bet!</span>';
    return;
  }

  playerCash -= bet;
  updateCashBox();

  const result = spinReels();
  document.getElementById('spin').disabled = true;
  document.getElementById('result').textContent = 'Spinning...';

  animateSpin(result, () => {
    // Check for feature trigger
    if (checkFeatureTrigger(result)) {
      featureBet = BET_OPTIONS[betIndex]; // Lock in the bet at trigger time
      setBetControlsEnabled(false);        // Disable bet controls

      // Highlight feature symbols
      highlightFeatureSymbols(result);

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

    const wins = checkPaylineWins(result, paylines, payoutTable);
    const payout = calculatePayout(bet, wins);

    playerCash += payout;
    updateCashBox();

    const winningPositions = getWinningPositions(wins);
    renderReels(result, winningPositions); // <-- with pulse highlights!
    displayResult(wins, payout);
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
    document.getElementById('spin').disabled = false;
  });
});

// Feature spin button click handler
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

// Random bonus spin button click handler
document.getElementById('random-bonus-spin-btn').addEventListener('click', () => {
  document.getElementById('random-bonus-modal').style.display = 'none';
  randomBonusActive = true;
  runRandomBonusSpin();
});