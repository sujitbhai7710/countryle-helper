/**
 * Test script to verify Countryle solver logic
 * Compares our calculations against Countryle's exact formulas
 */

// ===== COUNTRY DATA =====
const countries = [
  { id: 80, country: "India", continent: "ASIA", population: 1393409033, avgTemperature: 24.68, coordinates: "20.593684, 78.96288", hemisphere: "North Hemisphere" },
  { id: 145, country: "United Kingdom", continent: "EUROPE", population: 67326569, avgTemperature: 9.07, coordinates: "54.0, -2.0", hemisphere: "North Hemisphere" },
  { id: 9, country: "Argentina", continent: "AMERICA", population: 45808747, avgTemperature: 14.55, coordinates: "-34.0, -64.0", hemisphere: "South Hemisphere" },
  { id: 58, country: "Denmark", continent: "EUROPE", population: 5857300, avgTemperature: 8.93, coordinates: "56.0, 10.0", hemisphere: "North Hemisphere" },
];

// ===== RHUMB LINE BEARING (from Countryle source) =====
function getRhumbLineBearing(lat1, lon1, lat2, lon2) {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  
  const dPhi = Math.log(Math.tan(Math.PI / 4 + lat2Rad / 2) / Math.tan(Math.PI / 4 + lat1Rad / 2));
  
  let bearing = Math.atan2(dLon, dPhi) * 180 / Math.PI;
  bearing = (bearing + 360) % 360; // Normalize to 0-360
  
  return bearing;
}

// ===== DIRECTION FROM BEARING (from Countryle source) =====
function getDirectionFromBearing(bearing, sameCoords = false) {
  if (sameCoords) return 'EQUAL';
  
  if (bearing >= 337.5 || bearing < 22.5) return 'N';
  if (bearing >= 22.5 && bearing < 67.5) return 'NE';
  if (bearing >= 67.5 && bearing < 112.5) return 'E';
  if (bearing >= 112.5 && bearing < 157.5) return 'SE';
  if (bearing >= 157.5 && bearing < 202.5) return 'S';
  if (bearing >= 202.5 && bearing < 247.5) return 'SW';
  if (bearing >= 247.5 && bearing < 292.5) return 'W';
  if (bearing >= 292.5 && bearing < 337.5) return 'NW';
  return 'EQUAL';
}

// ===== TEMPERATURE DIFF (from Countryle source) =====
// getTemperatureDiff(e,i){
//   return Number(e)-Number(i)>3?L1.LESS:
//         Number(e)-Number(i)>1?L1.LITTLE_LESS:
//         Number(i)-Number(e)>3?L1.MORE:
//         Number(i)-Number(e)>1?L1.LITTLE_MORE:
//         L1.EQUAL
// }
function getTemperatureDiff(guessedTemp, targetTemp) {
  const diff = guessedTemp - targetTemp;
  if (diff > 3) return 'LESS';       // Guessed hotter -> target is colder (shows down arrow)
  if (diff > 1) return 'LITTLE_LESS';
  if (-diff > 3) return 'MORE';      // Guessed colder -> target is hotter (shows up arrow)
  if (-diff > 1) return 'LITTLE_MORE';
  return 'EQUAL';
}

// ===== POPULATION DIFF (from Countryle source) =====
// getPercentageDiff(e,i,r,a){
//   const s=Number(i*(1-r/100)),c=Number(i*(1+r/100)),
//         u=Number(i*(1-a/100)),f=Number(i*(1+a/100));
//   return Number(e)>f?L1.LESS:
//         Number(e)>c?L1.LITTLE_LESS:
//         Number(e)<u?L1.MORE:
//         Number(e)<s?L1.LITTLE_MORE:
//         L1.EQUAL
// }
// Parameters: r=5 (closeThreshold), a=15 (farThreshold)
function getPopulationDiff(guessedPop, targetPop) {
  const closeThreshold = 5;
  const farThreshold = 15;
  
  const lowerClose = targetPop * (1 - closeThreshold / 100);
  const upperClose = targetPop * (1 + closeThreshold / 100);
  const lowerFar = targetPop * (1 - farThreshold / 100);
  const upperFar = targetPop * (1 + farThreshold / 100);
  
  if (guessedPop > upperFar) return 'LESS';       // Guessed more pop -> target has less
  if (guessedPop > upperClose) return 'LITTLE_LESS';
  if (guessedPop < lowerFar) return 'MORE';       // Guessed less pop -> target has more
  if (guessedPop < lowerClose) return 'LITTLE_MORE';
  return 'EQUAL';
}

// ===== HEMISPHERE DIFF =====
function getHemisphereDiff(guessed, target) {
  return guessed === target ? 'EQUAL' : 'DIFFERENT';
}

// ===== CONTINENT HIT =====
function getContinentHit(guessed, target) {
  return guessed === target;
}

// ===== TESTS =====
console.log('===== TESTING COUNTRYLE SOLVER LOGIC =====\n');

// Test: If target is Denmark, what hints would we get for each guess?
const target = countries.find(c => c.country === 'Denmark');
console.log(`Target country: ${target.country}`);
console.log(`  Population: ${target.population.toLocaleString()}`);
console.log(`  Temperature: ${target.avgTemperature}°C`);
console.log(`  Coordinates: ${target.coordinates}`);
console.log(`  Hemisphere: ${target.hemisphere}`);
console.log(`  Continent: ${target.continent}\n`);

// Test each guess against Denmark
const guesses = ['India', 'United Kingdom', 'Argentina'];

for (const guessName of guesses) {
  const guess = countries.find(c => c.country === guessName);
  
  // Parse coordinates
  const [gLat, gLon] = guess.coordinates.split(',').map(Number);
  const [tLat, tLon] = target.coordinates.split(',').map(Number);
  
  // Calculate bearing
  const bearing = getRhumbLineBearing(gLat, gLon, tLat, tLon);
  const direction = getDirectionFromBearing(bearing, guess.coordinates === target.coordinates);
  
  // Calculate diffs
  const tempDiff = getTemperatureDiff(guess.avgTemperature, target.avgTemperature);
  const popDiff = getPopulationDiff(guess.population, target.population);
  const hemDiff = getHemisphereDiff(guess.hemisphere, target.hemisphere);
  const contHit = getContinentHit(guess.continent, target.continent);
  
  console.log(`\n===== GUESS: ${guess.country} =====`);
  console.log(`Guessed coords: ${guess.coordinates}`);
  console.log(`Target coords: ${target.coordinates}`);
  console.log(`Bearing: ${bearing.toFixed(2)}°`);
  console.log(`\nHINTS:`);
  console.log(`  Hemisphere: ${hemDiff} ${hemDiff === 'EQUAL' ? '🟢' : '🔴'}`);
  console.log(`  Continent: ${contHit ? 'MATCH 🟢' : 'DIFFERENT 🔴'} (guessed ${guess.continent}, target ${target.continent})`);
  console.log(`  Avg Temperature: ${tempDiff} ${tempDiff === 'EQUAL' ? '🟢' : tempDiff.includes('MORE') ? '⬆️🟠' : '⬇️🟠'}`);
  console.log(`    (guessed ${guess.avgTemperature}°C, target ${target.avgTemperature}°C)`);
  console.log(`  Population: ${popDiff} ${popDiff === 'EQUAL' ? '🟢' : popDiff.includes('MORE') ? '⬆️🟠' : '⬇️🟠'}`);
  console.log(`    (guessed ${guess.population.toLocaleString()}, target ${target.population.toLocaleString()})`);
  console.log(`  Coordinates: ${direction} ${direction === 'EQUAL' ? '🟢' : '🔵'}`);
  console.log(`    (target is ${direction} of guess)`);
}

// Test the solver filtering logic
console.log('\n\n===== TESTING SOLVER FILTERING =====\n');

// If we have hints from India, UK, Argentina guesses, what countries match?
const hints = [
  { country: 'India', hemisphere: 'EQUAL', continent: false, tempDiff: 'MORE', popDiff: 'LESS', direction: 'W' },
  { country: 'United Kingdom', hemisphere: 'EQUAL', continent: true, tempDiff: 'MORE', popDiff: 'LESS', direction: 'SE' },
  { country: 'Argentina', hemisphere: 'DIFFERENT', continent: false, tempDiff: 'LITTLE_MORE', popDiff: 'MORE', direction: 'NE' }
];

console.log('Hints from guesses:');
hints.forEach(h => {
  console.log(`  ${h.country}:`);
  console.log(`    Hemisphere: ${h.hemisphere}`);
  console.log(`    Continent: ${h.continent}`);
  console.log(`    Temperature: ${h.tempDiff}`);
  console.log(`    Population: ${h.popDiff}`);
  console.log(`    Direction: ${h.direction}`);
});

// Test if Denmark matches all hints
console.log('\nDoes Denmark match all hints?');
const denmark = target;
let matches = true;
hints.forEach(h => {
  const guess = countries.find(c => c.country === h.country);
  const [gLat, gLon] = guess.coordinates.split(',').map(Number);
  const [tLat, tLon] = denmark.coordinates.split(',').map(Number);
  const bearing = getRhumbLineBearing(gLat, gLon, tLat, tLon);
  const dir = getDirectionFromBearing(bearing);
  
  const hemMatch = getHemisphereDiff(guess.hemisphere, denmark.hemisphere) === h.hemisphere;
  const contMatch = getContinentHit(guess.continent, denmark.continent) === h.continent;
  const tempMatch = getTemperatureDiff(guess.avgTemperature, denmark.avgTemperature) === h.tempDiff;
  const popMatch = getPopulationDiff(guess.population, denmark.population) === h.popDiff;
  
  // Direction matching - allow adjacent directions
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const hintIdx = directions.indexOf(h.direction);
  const actualIdx = directions.indexOf(dir);
  const dirDiff = Math.min(Math.abs(hintIdx - actualIdx), 8 - Math.abs(hintIdx - actualIdx));
  const dirMatch = dirDiff <= 1;
  
  console.log(`  ${h.country}: hem=${hemMatch}, cont=${contMatch}, temp=${tempMatch}, pop=${popMatch}, dir=${dirMatch} (expected ${h.direction}, got ${dir})`);
  
  if (!hemMatch || !contMatch || !tempMatch || !popMatch || !dirMatch) {
    matches = false;
  }
});

console.log(`\nDenmark matches all hints: ${matches ? '✅ YES' : '❌ NO'}`);
