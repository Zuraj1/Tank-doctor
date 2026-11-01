import pandas as pd
import numpy as np

# Load datasets
water_df = pd.read_csv('anuradhapura_tanks_sentinel1_water_time_series.csv')
rain_df = pd.read_csv('anuradhapura_daily_rainfall_ditwah.csv')

# Ensure date parsing
water_df['date'] = pd.to_datetime(water_df['date'])
rain_df['date'] = pd.to_datetime(rain_df['date'])

# Define Ditwah event key dates
ditwah_start = pd.to_datetime('2025-11-26')
ditwah_peak = pd.to_datetime('2025-12-02')
post_storm_check = pd.to_datetime('2025-12-16')

results = []

for tank_id, group in water_df.groupby('tank_id'):
    group = group.sort_values('date')
    
    max_area = group['area_ha'].max()
    if max_area == 0 or np.isnan(max_area):
        continue
        
    peak_records = group[(group['date'] >= ditwah_start) & (group['date'] <= ditwah_peak)]
    post_records = group[(group['date'] > ditwah_peak) & (group['date'] <= post_storm_check)]
    
    if peak_records.empty or post_records.empty:
        continue
        
    peak_water = peak_records['water_ha'].max()
    post_water = post_records['water_ha'].min()
    
    peak_fill_ratio = peak_water / max_area
    drainage_ratio = (peak_water - post_water) / peak_water if peak_water > 0 else 0
    
    # Rule: >70% peak fill AND >40% rapid post-storm drop
    is_suspect = (peak_fill_ratio >= 0.70) and (drainage_ratio >= 0.40)
    
    results.append({
        'tank_id': tank_id,
        'max_area_ha': round(max_area, 2),
        'peak_water_ha': round(peak_water, 2),
        'post_water_ha': round(post_water, 2),
        'fill_ratio': round(peak_fill_ratio, 2),
        'drainage_ratio': round(drainage_ratio, 2),
        'status': 'SUSPECT' if is_suspect else 'NORMAL'
    })

summary_df = pd.DataFrame(results)
suspect_tanks = summary_df[summary_df['status'] == 'SUSPECT']

print(f"\n--- ANALYSIS COMPLETE ---")
print(f"Total tanks analyzed: {len(summary_df)}")
print(f"Suspect tanks flagged: {len(suspect_tanks)}\n")
print("Top Suspect Tanks:")
print(suspect_tanks.head(10))

summary_df.to_csv('suspect_tanks_summary.csv', index=False)
print("\nSaved output to 'suspect_tanks_summary.csv'")

