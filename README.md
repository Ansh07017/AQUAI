# 🌊 AQUAI: AI-Powered Water Quality Monitoring & Disease Risk Prediction System

AQUAI is a world-class environmental intelligence platform designed to monitor water health and predict public health risks using a hybrid of localized Machine Learning (Random Forest) and advanced Large Language Models (Google Gemini 3).

## 🚀 Key Features

### 1. Dual Data Ingestion & Pipeline Control
- **Simulated Mode:** Real-time generation of synthetic sensor data based on historical Indian river patterns (Yamuna, Ganga, Musi).
- **Manual Entry:** A digital laboratory interface for field researchers to input parameters with built-in safety range hints (e.g., pH 6.5-8.5).
- **IoT Integration:** Ready-to-bridge architecture for physical sensors (ESP32/Arduino) via future hardware hooks.

### 2. Intelligent Geolocation
- **Automatic Detection:** High-precision browser geolocation with reverse geocoding to identify specific watersheds and local regions.
- **Manual Registry:** A curated database of critical monitoring stations across major river systems.

### 3. Biological Risk Engine
- **Local ML Processing:** Uses a simulated Random Forest Regressor to calculate a 0-100 Severity Index and a Classifier for safety categorization (SAFE, WARNING, CRITICAL).
- **Gemini AI Diagnostics:** Acts as a "Senior Public Health Official" to analyze the relationship between B.O.D, Coliform counts, and local geography to produce human-readable biological summaries.
- **Probabilistic Disease Modeling:** Calculates real-time risk percentages for water-borne pathogens like Cholera, Typhoid, and Hepatitis.

### 4. Advanced Visualization
- **Safety Gauge:** A high-performance D3.js powered gauge for immediate severity assessment.
- **Telemetry Trends:** Responsive Area Charts (Recharts) for tracking temporal shifts in water chemistry.
- **Dynamic Fidelity:** Real-time calculation of "Model Fidelity" based on data variance and sensor reliability.

## 🛠 Tech Stack

- **Frontend:** React 19, TypeScript
- **Styling:** Tailwind CSS (Modern, Dark-first UI)
- **AI/ML:** Google Gemini 3 (via `@google/genai`), Custom ML Heuristics
- **Data Visualization:** D3.js, Recharts
- **Icons:** Lucide React
- **Reverse Geocoding:** OpenStreetMap Nominatim API

## 📋 Water Quality Indicators

The system monitors critical CPCB (Central Pollution Control Board) and WHO benchmarks:
- **pH Value:** Chemical balance (Target: 6.5 - 8.5)
- **B.O.D:** Organic pollution levels (Target: < 3 mg/l)
- **D.O.:** Dissolved Oxygen for aquatic life (Target: > 4 mg/l)
- **Coliform:** Biological contamination proxy (Target: < 2500 MPN)
- **Conductivity:** Mineral and industrial discharge indicator

## ⚙️ Setup & Installation

1.  **API Key:** Ensure you have a valid Gemini API Key from Google AI Studio.
2.  **Environment:** The app expects `process.env.API_KEY` to be available in the execution context.
3.  **Permissions:** The app will request `geolocation` permissions for the Automatic Calibration feature.

---

**Powered by Leaders**
*Focused on bridging the gap between raw environmental data and actionable public health intelligence.*