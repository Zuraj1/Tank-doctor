// =====================================================================
// TANK DOCTOR - Script 2: Sentinel-1 SAR Water Area Measurement (Fixed)
// =====================================================================

// STEP 1: Load Anuradhapura District boundary & Tank polygons
var districts = ee.FeatureCollection('FAO/GAUL/2015/level2');
var area = districts
  .filter(ee.Filter.eq('ADM0_NAME', 'Sri Lanka'))
  .filter(ee.Filter.eq('ADM1_NAME', 'North Central'))
  .filter(ee.Filter.eq('ADM2_NAME', 'Anuradhapura'));

var gsw = ee.Image('JRC/GSW1_4/GlobalSurfaceWater');
var everWater = gsw.select('max_extent').gt(0).selfMask().clip(area);

var tanksRaw = everWater.reduceToVectors({
  geometry: area,
  crs: gsw.projection(),
  scale: 30,
  geometryType: 'polygon',
  eightConnected: true,
  maxPixels: 1e13
});

var tanks = tanksRaw.map(function (f) {
  var ha = f.geometry().area(10).divide(10000);
  var id = ee.String('T_ANCL_').cat(f.id());
  return f.set({'area_ha': ha, 'tank_id': id});
}).filter(ee.Filter.gte('area_ha', 1.0));

// STEP 2: Load Sentinel-1 Ground Range Detected (GRD) Collection
var s1 = ee.ImageCollection('COPERNICUS/S1_GRD')
  .filterBounds(area)
  .filterDate('2025-11-01', '2025-12-31') // Ditwah window target
  .filter(ee.Filter.eq('instrumentMode', 'IW'))
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
  .select('VV');

// STEP 3: Water Thresholding (-16 dB)
var detectWater = function(img) {
  var smoothed = img.focal_mean(50, 'circle', 'meters');
  var water = smoothed.lt(-16.0).rename('water');
  return water.copyProperties(img, ['system:time_start']);
};

var s1Water = s1.map(detectWater);

// STEP 4: Process Images via FeatureCollection Iteration (Prevents Graph Type Errors)
var imageList = s1Water.toList(s1Water.size());

var timeSeries = ee.FeatureCollection(
  imageList.map(function(imgObj) {
    var img = ee.Image(imgObj);
    var dateStr = img.date().format('YYYY-MM-dd');
    
    // Reduce regions for this specific single image
    var reduced = img.reduceRegions({
      collection: tanks,
      reducer: ee.Reducer.mean().setOutputs(['water_fraction']),
      scale: 30,
      crs: 'EPSG:4326'
    });
    
    return reduced.map(function(f) {
      var fraction = ee.Number(f.get('water_fraction'));
      var totalArea = ee.Number(f.get('area_ha'));
      var waterHa = ee.Algorithms.If(
        fraction,
        fraction.multiply(totalArea),
        0
      );
      return f.set({
        'date': dateStr,
        'water_ha': waterHa
      });
    });
  })
).flatten();

// STEP 5: Visualize & Print
Map.centerObject(area, 10);
Map.addLayer(tanks.style({color: '0000ff', fillColor: '0000ff33', width: 1}), {}, 'Tanks Baseline');
Map.addLayer(s1Water.mean(), {min: 0, max: 1}, 'Water Mask Mean');

print('Sentinel-1 Images in Window:', s1Water.size());
print('Sample Water Time Series:', timeSeries.limit(10));

// STEP 6: Export CSV
Export.table.toDrive({
  collection: timeSeries,
  description: 'anuradhapura_tanks_sentinel1_water_time_series',
  fileFormat: 'CSV',
  selectors: ['tank_id', 'date', 'area_ha', 'water_ha', 'water_fraction']
});
