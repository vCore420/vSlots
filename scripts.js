const NUM_REELS = 5;
const NUM_ROWS = 5;
const SPIN_DURATION = 1200; // ms total spin time per reel
const SPIN_DELAY = 250;     // ms delay between each reel's stop

// Slot symbols and weights
const symbols = ['🍒', '🍋', '7️⃣', '🔔', '🍀', '⭐'];
const payouts = { '🍒': 2, '🍋': 3, '7️⃣': 10, '🔔': 5, '🍀': 8, '⭐': 20 };

const payoutTable = {
  '🍒': { 3: 2, 4: 5, 5: 10 },
  '🍋': { 3: 3, 4: 8, 5: 16 },
  '7️⃣': { 3: 10, 4: 30, 5: 100 },
  '🔔': { 3: 5, 4: 12, 5: 25 },
  '🍀': { 3: 8, 4: 20, 5: 40 },
  '⭐': { 3: 12, 4: 36, 5: 75 }
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
  [3,2,1,2,3]
  // ... (add more creative lines as desired)
];

function getWeightedReel() {
  // Weighted for more cherries/lemons, fewer 7s/stars
  return [
    '🍒','🍒','🍒','🍒','🍒',
    '🍋','🍋','🍋',
    '7️⃣',
    '🔔','🔔',
    '🍀',
    '⭐'
  ];
}

function spinReels() {
  let result = [];
  for (let i = 0; i < NUM_REELS; i++) {
    const reel = getWeightedReel();
    const stop = Math.floor(Math.random() * reel.length);
    // Wrap-around for a 5-row window
    let window = [];
    for (let j = -2; j <= 2; j++) {
      window.push(reel[(stop + j + reel.length) % reel.length]);
    }
    result.push(window);
  }
  return result;
}

function checkPaylineWins(result, paylines, payoutTable) {
  let wins = [];
  for (const line of paylines) {
    // Build the symbol sequence along this line
    let symbolsLine = line.map((row, reel) => result[reel][row]);
    let firstSymbol = symbolsLine[0];
    let consecutive = 1;
    // Count consecutive matches from the left
    for (let i = 1; i < symbolsLine.length; i++) {
      if (symbolsLine[i] === firstSymbol) {
        consecutive++;
      } else {
        break;
      }
    }
    // Pay for 3, 4, or 5 matches
    if (consecutive >= 3 && payoutTable[firstSymbol] && payoutTable[firstSymbol][consecutive]) {
      wins.push({
        line,
        symbol: firstSymbol,
        count: consecutive,
        payout: payoutTable[firstSymbol][consecutive]
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
    let lines = wins.map(w =>
      `${w.symbol} <span style="color:#ffd700">x${w.payout}</span>`
    ).join('<br>');
    document.getElementById('result').innerHTML =
      `<span style="color:#ffd700;font-weight:bold;">WIN!</span><br>${lines}<br><br>Payout: <span style="color:#2ecc40;font-weight:bold;">$${payout}</span>`;
  } else {
    document.getElementById('result').innerHTML =
      '<span style="color:#e74c3c">No win. Try again!</span>';
  }
}

let playerCash = 1000; // You will update this from Lua in your FiveM NUI callback

function updateCashBox() {
  document.getElementById('cash-box').textContent = `$${playerCash}`;
}

// Initial render
renderReels([
  ['🍒', '🍋', '7️⃣', '🔔', '🍀'],
  ['🍀', '⭐', '🍒', '🍋', '7️⃣'],
  ['🍒', '🍋', '7️⃣', '🔔', '🍀'],
  ['⭐', '🍀', '7️⃣', '🍋', '🍒'],
  ['🍋', '🍒', '🍀', '⭐', '7️⃣']
]);


// Use this in your spin button click handler:

document.getElementById('spin').addEventListener('click', () => {
  const bet = Math.max(1, parseInt(document.getElementById('bet').value, 10) || 1);

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
    const wins = checkPaylineWins(result, paylines, payoutTable);
    const payout = calculatePayout(bet, wins);

    playerCash += payout;
    updateCashBox();

    const winningPositions = getWinningPositions(wins);
    renderReels(result, winningPositions); // <-- with pulse highlights!
    displayResult(wins, payout);
    document.getElementById('spin').disabled = false;
  });
});