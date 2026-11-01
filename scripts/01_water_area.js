// =====================================================================
// TANK DOCTOR - Script 1: Find ALL tanks in Anuradhapura District
// =====================================================================

// STEP A: Load official administrative boundary for Anuradhapura District
var districts = ee.FeatureCollection('FAO/GAUL/2015/level2');
var area = districts
  .filter(ee.Filter.eq('ADM0_NAME', 'Sri Lanka'))
  .filter(ee.Filter.eq('ADM1_NAME', 'North Central'))
  .filter(ee.Filter.eq('ADM2_NAME', 'Anuradhapura'));

// Center map view on Anuradhapura District
Map.centerObject(area, 10);
Map.addLayer(ee.Image().paint(area, 0, 2), {palette: 'red'}, 'Anuradhapura District Boundary');

// STEP B: Extract permanent & seasonal surface water (JRC Global Surface Water)
var gsw = ee.Image('JRC/GSW1_4/GlobalSurfaceWater');
var everWater = gsw.select('max_extent').gt(0).selfMask().clip(area);

// Minimum tank surface area to include (1.0 hectare = 10,000 sq m)
var MIN_HA = 1.0;

// STEP C: Vectorize water pixels into distinct polygons
var tanksRaw = everWater.reduceToVectors({
  geometry: area,
  crs: gsw.projection(),
  scale: 30,
  geometryType: 'polygon',
  eightConnected: true,
  maxPixels: 1e13
});

// STEP D: Calculate area in hectares and filter out tiny features
var tanksSized = tanksRaw.map(function (f) {
  var ha = f.geometry().area(10).divide(10000);
  return f.set('area_ha', ha);
}).filter(ee.Filter.gte('area_ha', MIN_HA));

// STEP E: Assign unique Tank IDs asynchronously (T_ANCL_[ID])
var tanks = tanksSized.map(function (f) {
  var id = ee.String('T_ANCL_').cat(f.id());
  return f.set('tank_id', id);
});

// STEP F: Render tank outlines on map and log counts
Map.addLayer(
  tanks.style({color: '0000ff', fillColor: '0000ff55', width: 1}),
  {},
  'All Anuradhapura Tanks'
);

print('Anuradhapura District Boundary:', area);
print('Total tanks identified:', tanks.size());
print('Sample tank features:', tanks.limit(5));

// STEP G: Export complete district tank collection to Google Drive
Export.table.toDrive({
  collection: tanks,
  description: 'anuradhapura_all_tanks_v1',
  fileFormat: 'GeoJSON'
});
