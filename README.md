# Lackecity - Medical Triage & Hospital Finder

AI-powered symptom checker that routes you to the nearest appropriate hospital or clinic.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Add your API keys to `.env`:
   - `VITE_OPENROUTER_API_KEY` - Get from [OpenRouter](https://openrouter.ai/)
   - `VITE_GOOGLE_MAPS_KEY` - Get from [Google Cloud Console](https://console.cloud.google.com/) (enable Maps JavaScript API & Places API)

3. **Run the app**
   ```bash
   npm run dev
   ```

4. **Open** `http://localhost:5173`

## Usage

1. Go to `/interaction`
2. Describe your symptoms
3. Get triage result (specialist, urgency, department)
4. Click "Find Nearby Facilities" to see hospitals on map with directions