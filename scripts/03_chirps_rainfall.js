// =====================================================================
// TANK DOCTOR - Script 3: CHIRPS Daily Rainfall Extraction
// How to use: Paste into https://code.earthengine.google.com and click Run.
// =====================================================================

// STEP A: Load Anuradhapura District boundary
var districts = ee.FeatureCollection('FAO/GAUL/2015/level2');
var area = districts
  .filter(ee.Filter.eq('ADM0_NAME', 'Sri Lanka'))
  .filter(ee.Filter.eq('ADM1_NAME', 'North Central'))
  .filter(ee.Filter.eq('ADM2_NAME', 'Anuradhapura'));

// STEP B: Load CHIRPS Daily Rainfall Dataset around Cyclone Ditwah
// Focus window: 1 November 2025 to 31 December 2025
var chirps = ee.ImageCollection('UCSB-CHG/CHIRPS/DAILY')
  .filterBounds(area)
  .filterDate('2025-11-01', '2025-12-31');

// STEP C: Extract mean daily rainfall (mm/day) across Anuradhapura District
var dailyRainfall = chirps.map(function(image) {
  var dateStr = image.date().format('YYYY-MM-dd');
  var stats = image.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: area,
    scale: 5566, // CHIRPS native spatial resolution (~5.5 km)
    maxPixels: 1e9
  });
  
  return ee.Feature(null, {
    'date': dateStr,
    'precipitation_mm': stats.get('precipitation')
  });
});

// STEP D: Inspect in Console
Map.centerObject(area, 10);
Map.addLayer(chirps.select('precipitation').sum().clip(area), {min: 0, max: 300, palette: ['white', 'blue', 'darkblue']}, 'Total Nov-Dec Rain (mm)');

print('Daily Rainfall Records (Cyclone Ditwah Window):', dailyRainfall);

// STEP E: Export CSV to Google Drive
Export.table.toDrive({
  collection: dailyRainfall,
  description: 'anuradhapura_daily_rainfall_ditwah',
  fileFormat: 'CSV',
  selectors: ['date', 'precipitation_mm']
});
