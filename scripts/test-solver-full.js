/**
 * Test script to verify the Countryle solver logic works correctly
 * Simulates actual game scenarios and tests filtering
 */

// Import the logic functions - copy them here for testing
const fs = require('fs');
const path = require('path');

// Load countries data
const countriesPath = path.join(__dirname, '../public/countries.json');
const countriesData = JSON.parse(fs.readFileSync(countriesPath, 'utf8'));
const countries = countriesData.countries;

console.log(`Loaded ${countries.length} countries\n`);

// ===== COMPARISON FUNCTIONS (copied from clientApi.ts) =====

function getTemperatureDiff(guessedTemp, targetTemp) {
  const diff = guessedTemp - targetTemp;
  if (diff > 3) return 'LESS';
  if (diff > 1) return 'LITTLE_LESS';
  if (-diff > 3) return 'MORE';
  if (-diff > 1) return 'LITTLE_MORE';
  return 'EQUAL';
}

function getPopulationDiff(guessedPop, targetPop) {
  const closeThreshold = 5;
  const farThreshold = 15;
  
  const lowerClose = targetPop * (1 - closeThreshold / 100);
  const upperClose = targetPop * (1 + closeThreshold / 100);
  const lowerFar = targetPop * (1 - farThreshold / 100);
  const upperFar = targetPop * (1 + farThreshold / 100);
  
  if (guessedPop > upperFar) return 'LESS';
  if (guessedPop > upperClose) return 'LITTLE_LESS';
  if (guessedPop < lowerFar) return 'MORE';
  if (guessedPop < lowerClose) return 'LITTLE_MORE';
  return 'EQUAL';
}

function getRhumbLineBearing(lat1, lon1, lat2, lon2) {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  
  const dPhi = Math.log(Math.tan(Math.PI / 4 + lat2Rad / 2) / Math.tan(Math.PI / 4 + lat1Rad / 2));
  
  let bearing = Math.atan2(dLon, dPhi) * 180 / Math.PI;
  bearing = (bearing + 360) % 360;
  
  return bearing;
}

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

function calculateDirection(coord1, coord2) {
  const [lat1, lon1] = coord1.split(',').map(Number);
  const [lat2, lon2] = coord2.split(',').map(Number);
  
  if (lat1 === lat2 && lon1 === lon2) return 'EQUAL';
  
  const bearing = getRhumbLineBearing(lat1, lon1, lat2, lon2);
  return getDirectionFromBearing(bearing);
}

function getHemisphereDiff(guessed, target) {
  return guessed === target ? 'EQUAL' : 'DIFFERENT';
}

function getContinentHit(guessed, target) {
  return guessed === target;
}

// ===== FILTERING FUNCTION =====

function filterCountriesByHints(allCountries, hints) {
  if (hints.length === 0) {
    return allCountries.map(c => ({ country: c, score: 0 }));
  }

  const results = [];

  for (const candidate of allCountries) {
    let totalScore = 0;
    let matchesAll = true;

    for (const hint of hints) {
      let hintScore = 0;

      // Check hemisphere
      const expectedHemDiff = getHemisphereDiff(hint.country.hemisphere, candidate.hemisphere);
      if (expectedHemDiff !== hint.hemisphereDiff) {
        matchesAll = false;
        break;
      }
      hintScore += 20;

      // Check continent
      const expectedContHit = getContinentHit(hint.country.continent, candidate.continent);
      if (expectedContHit !== hint.continentHit) {
        matchesAll = false;
        break;
      }
      hintScore += 20;

      // Check temperature
      const expectedTempDiff = getTemperatureDiff(hint.country.avgTemperature, candidate.avgTemperature);
      if (expectedTempDiff !== hint.avgTemperatureDiff) {
        matchesAll = false;
        break;
      }
      hintScore += 20;

      // Check population
      const expectedPopDiff = getPopulationDiff(hint.country.population, candidate.population);
      if (expectedPopDiff !== hint.populationDiff) {
        matchesAll = false;
        break;
      }
      hintScore += 20;

      // Check direction
      const expectedDir = calculateDirection(hint.country.coordinates, candidate.coordinates);
      const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
      const hintIdx = directions.indexOf(hint.coordinatesDiff);
      const actualIdx = directions.indexOf(expectedDir);
      const dirDiff = Math.min(Math.abs(hintIdx - actualIdx), 8 - Math.abs(hintIdx - actualIdx));
      
      if (dirDiff > 1) {
        matchesAll = false;
        break;
      }
      hintScore += dirDiff === 0 ? 20 : 10;

      totalScore += hintScore;
    }

    if (matchesAll) {
      results.push({ country: candidate, score: totalScore / hints.length });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

// ===== TEST SCENARIO =====

// Test with Denmark as target (today's answer)
const target = countries.find(c => c.country === 'Denmark');

console.log('===== TEST SCENARIO =====');
console.log(`Target: ${target.country}`);
console.log(`  Hemisphere: ${target.hemisphere}`);
console.log(`  Continent: ${target.continent}`);
console.log(`  Temperature: ${target.avgTemperature}°C`);
console.log(`  Population: ${target.population.toLocaleString()}`);
console.log(`  Coordinates: ${target.coordinates}\n`);

// Simulate guesses: India, UK, Argentina
const guessNames = ['India', 'United Kingdom', 'Argentina'];
const hints = [];

console.log('===== GENERATING HINTS FROM GUESSES =====\n');

for (const guessName of guessNames) {
  const guess = countries.find(c => c.country === guessName);
  if (!guess) {
    console.log(`Country "${guessName}" not found!`);
    continue;
  }
  
  const hemDiff = getHemisphereDiff(guess.hemisphere, target.hemisphere);
  const contHit = getContinentHit(guess.continent, target.continent);
  const tempDiff = getTemperatureDiff(guess.avgTemperature, target.avgTemperature);
  const popDiff = getPopulationDiff(guess.population, target.population);
  const coordDir = calculateDirection(guess.coordinates, target.coordinates);
  
  console.log(`${guessName}:`);
  console.log(`  Hemisphere: ${hemDiff} ${hemDiff === 'EQUAL' ? '🟢' : '🔴'}`);
  console.log(`  Continent: ${contHit ? 'MATCH 🟢' : 'DIFFERENT 🔴'}`);
  console.log(`  Temperature: ${tempDiff} ${tempDiff === 'EQUAL' ? '🟢' : tempDiff.includes('MORE') ? '⬆️' : '⬇️'}`);
  console.log(`  Population: ${popDiff} ${popDiff === 'EQUAL' ? '🟢' : popDiff.includes('MORE') ? '⬆️' : '⬇️'}`);
  console.log(`  Direction: ${coordDir} 🔵`);
  console.log('');
  
  hints.push({
    id: Date.now() + Math.random(),
    country: guess,
    hemisphereDiff: hemDiff,
    continentHit: contHit,
    avgTemperatureDiff: tempDiff,
    populationDiff: popDiff,
    coordinatesDiff: coordDir,
  });
}

// Now filter countries
console.log('===== FILTERING COUNTRIES =====\n');

const results = filterCountriesByHints(countries, hints);

console.log(`Found ${results.length} matching countries:\n`);

// Show top 10 results
results.slice(0, 10).forEach((r, i) => {
  console.log(`${i + 1}. ${r.country.country} (${r.country.continent}) - Score: ${r.score.toFixed(0)}`);
});

// Check if Denmark is in the results
const denmarkInResults = results.find(r => r.country.country === 'Denmark');
console.log(`\n✅ Denmark found in results: ${denmarkInResults ? 'YES (position ' + (results.findIndex(r => r.country.country === 'Denmark') + 1) + ')' : 'NO'}`);

// Now test with the hints from the screenshot
console.log('\n\n===== TEST WITH SCREENSHOT HINTS =====\n');
console.log('According to the screenshot:');
console.log('- India: Hemisphere EQUAL, Continent DIFFERENT, Temp shows down arrow, Pop shows down arrow, Direction shows W');
console.log('- UK: Hemisphere EQUAL, Continent MATCH (green), Direction shows E (not SE)');
console.log('- Argentina: Hemisphere DIFFERENT, Continent DIFFERENT, Direction shows NE');

// The screenshot hints suggest:
// - Target is in Northern Hemisphere
// - Target is in EUROPE
// - Target has lower temperature than India but similar to UK
// - Target has lower population than India and UK
// - Target is West of India
// - Target is East of UK
// - Target is Northeast of Argentina

const screenshotHints = [
  {
    id: '1',
    country: countries.find(c => c.country === 'India'),
    hemisphereDiff: 'EQUAL',
    continentHit: false,
    avgTemperatureDiff: 'LESS', // India is hotter, target is colder
    populationDiff: 'LESS',      // India has more pop, target has less
    coordinatesDiff: 'W',        // Target is West of India
  },
  {
    id: '2', 
    country: countries.find(c => c.country === 'United Kingdom'),
    hemisphereDiff: 'EQUAL',
    continentHit: true,          // Same continent (EUROPE)
    avgTemperatureDiff: 'EQUAL', // Similar temperature
    populationDiff: 'LESS',      // UK has more pop
    coordinatesDiff: 'E',        // Target is East of UK
  },
  {
    id: '3',
    country: countries.find(c => c.country === 'Argentina'),
    hemisphereDiff: 'DIFFERENT',
    continentHit: false,
    avgTemperatureDiff: 'LESS',  // Argentina is warmer
    populationDiff: 'LESS',      // Argentina has more pop than target
    coordinatesDiff: 'NE',       // Target is NE of Argentina
  }
];

const screenshotResults = filterCountriesByHints(countries, screenshotHints);
console.log(`\nFound ${screenshotResults.length} matching countries from screenshot hints:\n`);

screenshotResults.slice(0, 10).forEach((r, i) => {
  console.log(`${i + 1}. ${r.country.country} (${r.country.continent}) - Score: ${r.score.toFixed(0)}`);
});

const denmarkInScreenshot = screenshotResults.find(r => r.country.country === 'Denmark');
console.log(`\n✅ Denmark in screenshot results: ${denmarkInScreenshot ? 'YES (position ' + (screenshotResults.findIndex(r => r.country.country === 'Denmark') + 1) + ')' : 'NO'}`);
