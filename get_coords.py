import pandas as pd
import json

# 1. Load your suspect summary file
df = pd.read_csv('suspect_tanks_summary.csv')
suspects = df[df['status'] == 'SUSPECT'].copy()

# 2. Extract latitude & longitude from the GeoJSON features
with open('data/anuradhapura_all_tanks_v1.geojson') as f:
    geojson_data = json.load(f)

coords_map = {}
for feature in geojson_data['features']:
    tid = 'T_ANCL_' + str(feature['id'])
    geom = feature['geometry']
    if geom['type'] == 'Polygon':
        pts = geom['coordinates'][0]
        lons = [p[0] for p in pts]
        lats = [p[1] for p in pts]
        centroid_lon = sum(lons) / len(lons)
        centroid_lat = sum(lats) / len(lats)
        coords_map[tid] = (round(centroid_lat, 5), round(centroid_lon, 5))

# 3. Add lat, lon, and Google Maps links to the table
suspects['lat'] = suspects['tank_id'].map(lambda x: coords_map.get(x, (None, None))[0])
suspects['lon'] = suspects['tank_id'].map(lambda x: coords_map.get(x, (None, None))[1])
suspects['google_maps_link'] = suspects.apply(
    lambda r: f"https://www.google.com/maps?q={r['lat']},{r['lon']}" if pd.notnull(r['lat']) else "N/A", 
    axis=1
)

# 4. Display top 10 targets in terminal
print("\n================ TOP SUSPECT TANKS FOR FIELD VISITS ================")
for idx, row in suspects.head(10).iterrows():
    print(f"Tank ID: {row['tank_id']} | Size: {row['max_area_ha']} ha")
    print(f"Coordinates: {row['lat']}, {row['lon']}")
    print(f"Google Maps: {row['google_maps_link']}")
    print("-" * 65)

# 5. Save output file
suspects.to_csv('data/field_targets.csv', index=False)
print("\nSaved full target list to 'data/field_targets.csv'")

