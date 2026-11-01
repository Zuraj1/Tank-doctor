# Tank Doctor 🛰️💧

Using free satellite data to find damaged village tanks after Cyclone Ditwah.

---

## 📌 Project Overview

Cyclone Ditwah caused heavy rainfall across Sri Lanka between 26 and 29 November 2025. This project uses open-access Earth Observation (EO) data to rapidly assess and identify small-scale agricultural reservoir ("tank") failures and bund breaches in the North Central Province.

By monitoring surface water dynamics over time using **Google Earth Engine (GEE)** and **Sentinel-1 SAR**, we cross-reference post-cyclone water capacity against historical baselines to flag suspect tanks for targeted physical verification.

---

## 📅 Project Roadmap

- [x] **Setup:** Repository creation and Google Earth Engine noncommercial registration.
- [ ] **Stage 1: Pilot Area Selection** — Define a 10 × 10 km bounding box in Anuradhapura.
- [ ] **Stage 2: Tank Inventory** — Extract long-term water bodies and assign unique Tank IDs.
- [ ] **Stage 3: Sentinel-1 Time Series Analysis** — Calculate monthly and event-based water surface areas from 2019 to present.
- [ ] **Stage 4: Rainfall Integration** — Overlay daily precipitation data (CHIRPS/GPM) around the Cyclone Ditwah event window.
- [ ] **Stage 5: Anomaly Detection Rules** — Define threshold rules (fill rate vs. post-event drainage rate) to identify "suspect" tanks.
- [ ] **Stage 6: Ground Truthing & Field Validation** — Perform physical inspections of bunds, sluices, and spillways; collect geotagged photos and local Agrarian Services Centre records.
- [ ] **Stage 7: Interactive Web Map** — Publish an interactive visualization via GitHub Pages.

--
