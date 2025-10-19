import fs from 'fs';
import path from 'path';

async function redistributePuzzles() {
  const publicDir = './public';

  // Load levels configuration
  console.log('Loading levels.json...');
  const levels = JSON.parse(fs.readFileSync(path.join(publicDir, 'levels.json'), 'utf8'));
  console.log(`Found ${Object.keys(levels).length} levels\n`);

  // Get all existing puzzle JSON files
  const files = fs.readdirSync(publicDir);
  const whiteFiles = files.filter(f => f.startsWith('lichess_db_puzzle-w-one-move-') && f.endsWith('.json'));
  const blackFiles = files.filter(f => f.startsWith('lichess_db_puzzle-b-one-move-') && f.endsWith('.json'));

  // Process white puzzles
  console.log('Processing white puzzles...');
  await redistributeForColor(publicDir, whiteFiles, levels, 'w');

  // Process black puzzles
  console.log('\nProcessing black puzzles...');
  await redistributeForColor(publicDir, blackFiles, levels, 'b');

  console.log('\nRedistribution complete!');
}

async function redistributeForColor(publicDir, files, levels, color) {
  const colorName = color === 'w' ? 'White' : 'Black';

  // Collect all puzzles from existing files
  console.log(`  Loading all ${colorName.toLowerCase()} puzzle files...`);
  const allPuzzles = [];

  for (const file of files) {
    const filePath = path.join(publicDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    // Use concat instead of spread to avoid stack overflow with large arrays
    for (const puzzle of data.puzzles) {
      allPuzzles.push(puzzle);
    }
    console.log(`    Loaded ${data.puzzles.length} puzzles from ${file}`);
  }

  console.log(`  Total ${colorName.toLowerCase()} puzzles collected: ${allPuzzles.length}`);

  // Group puzzles by level
  const puzzlesByLevel = {};
  for (const [levelName, bounds] of Object.entries(levels)) {
    puzzlesByLevel[levelName] = [];
  }

  // Distribute puzzles into levels based on rating
  for (const puzzle of allPuzzles) {
    const rating = puzzle.rating;
    let assigned = false;

    for (const [levelName, bounds] of Object.entries(levels)) {
      if (rating >= bounds.lowerBound && rating <= bounds.upperBound) {
        puzzlesByLevel[levelName].push(puzzle);
        assigned = true;
        break;
      }
    }

    if (!assigned) {
      console.warn(`    Warning: Puzzle ${puzzle.id} with rating ${rating} doesn't fit any level`);
    }
  }

  // Write new files for each level
  console.log(`  Writing new ${colorName.toLowerCase()} puzzle files...`);
  for (const [levelName, puzzles] of Object.entries(puzzlesByLevel)) {
    if (puzzles.length === 0) {
      console.log(`    Skipping ${levelName} (0 puzzles)`);
      continue;
    }

    const output = {
      _source: "Lichess Puzzle Database",
      _license: "CC0 Public Domain",
      _url: "https://database.lichess.org/#puzzles",
      _generated: new Date().toISOString(),
      _count: puzzles.length,
      _note: `${colorName} to move puzzles only`,
      _level: levelName,
      _ratingRange: `${levels[levelName].lowerBound}-${levels[levelName].upperBound}`,
      puzzles: puzzles.sort((a, b) => a.rating - b.rating) // Sort by rating
    };

    const filename = `lichess_db_puzzle-${color}-one-move-${levelName}.json`;
    const filepath = path.join(publicDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(output, null, 2));
    console.log(`    Created ${filename} with ${puzzles.length} puzzles (${levels[levelName].lowerBound}-${levels[levelName].upperBound})`);
  }
}

redistributePuzzles().catch(console.error);
