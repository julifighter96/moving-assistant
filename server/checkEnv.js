/**
 * Environment Variables Check for Tour Planning v2
 * Hilft beim Debugging der Umgebungsvariablen-Konfiguration
 */

const path = require('path');

// Load environment variables from multiple possible locations
require('dotenv').config({ path: path.join(__dirname, '../.env.development') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('🔍 Umgebungsvariablen-Check für Tour Planning v2');
console.log('=' .repeat(50));

// Pipedrive API (für Aufträge)
console.log('\n📊 Pipedrive API:');
console.log(`REACT_APP_PIPEDRIVE_API_TOKEN: ${process.env.REACT_APP_PIPEDRIVE_API_TOKEN ? '✅ Vorhanden' : '❌ Fehlt'}`);
console.log(`REACT_APP_PIPEDRIVE_API_URL: ${process.env.REACT_APP_PIPEDRIVE_API_URL || 'Standard wird verwendet'}`);

// HERE API (für Routenoptimierung)
console.log('\n🗺️ HERE Maps API:');
console.log(`HERE_API_KEY: ${process.env.HERE_API_KEY ? '✅ Vorhanden' : '❌ Fehlt'}`);
console.log(`REACT_APP_HERE_API_KEY: ${process.env.REACT_APP_HERE_API_KEY ? '✅ Vorhanden' : '❌ Fehlt'}`);

// Traccar API (für GPS-Tracking)
console.log('\n📡 Traccar API (Optional):');
console.log(`TRACCAR_BASE_URL: ${process.env.TRACCAR_BASE_URL || '❌ Nicht konfiguriert'}`);
console.log(`TRACCAR_API_KEY: ${process.env.TRACCAR_API_KEY ? '✅ Vorhanden' : '❌ Fehlt'}`);
console.log(`TRACCAR_USERNAME: ${process.env.TRACCAR_USERNAME ? '✅ Vorhanden' : '❌ Fehlt'}`);
console.log(`TRACCAR_PASSWORD: ${process.env.TRACCAR_PASSWORD ? '✅ Vorhanden' : '❌ Fehlt'}`);

// Sicherheit
console.log('\n🔐 Sicherheit:');
console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Vorhanden' : '❌ Fehlt'}`);

// Tour Planning Konfiguration
console.log('\n🚚 Tour Planning Konfiguration:');
console.log(`DEFAULT_DEPOT_LAT: ${process.env.REACT_APP_DEFAULT_DEPOT_LAT || 'Standard wird verwendet'}`);
console.log(`DEFAULT_DEPOT_LNG: ${process.env.REACT_APP_DEFAULT_DEPOT_LNG || 'Standard wird verwendet'}`);
console.log(`DEFAULT_DEPOT_ADDRESS: ${process.env.REACT_APP_DEFAULT_DEPOT_ADDRESS || 'Standard wird verwendet'}`);

// Funktionsverfügbarkeit
console.log('\n🎯 Verfügbare Funktionen:');
const hasHereKey = !!(process.env.HERE_API_KEY || process.env.REACT_APP_HERE_API_KEY);
const hasTraccar = !!(process.env.TRACCAR_BASE_URL && (process.env.TRACCAR_API_KEY || (process.env.TRACCAR_USERNAME && process.env.TRACCAR_PASSWORD)));
const hasPipedrive = !!process.env.REACT_APP_PIPEDRIVE_API_TOKEN;

console.log(`✅ Auftragsanzeige (Pipedrive): ${hasPipedrive ? 'Verfügbar' : 'Nicht verfügbar'}`);
console.log(`✅ Routenoptimierung (HERE): ${hasHereKey ? 'Verfügbar' : 'Nicht verfügbar'}`);
console.log(`✅ GPS-Tracking (Traccar): ${hasTraccar ? 'Verfügbar' : 'Nicht verfügbar'}`);

console.log('\n' + '='.repeat(50));
console.log('💡 Tipp: Stellen Sie sicher, dass alle erforderlichen API-Keys in .env.development konfiguriert sind.');

if (!hasPipedrive) {
    console.log('⚠️  WARNUNG: Ohne Pipedrive API können keine Aufträge geladen werden.');
}

if (!hasHereKey) {
    console.log('⚠️  WARNUNG: Ohne HERE API ist keine Routenoptimierung möglich.');
}

if (!hasTraccar) {
    console.log('ℹ️  INFO: Traccar ist optional für GPS-Tracking. Ohne Traccar werden keine Live-Fahrzeugdaten angezeigt.');
}
