# Sehat AI

**Intelligent Medical Triage and Hospital Finder**

![Sehat AI Banner](image.png)

---

## The Problem

When medical symptoms arise, people often face two critical challenges: understanding the severity of their condition and finding the right healthcare facility quickly. Delays in seeking appropriate care can lead to worsening outcomes, while visiting the wrong type of facility wastes valuable time.

## The Solution

Sehat AI bridges this gap by combining artificial intelligence with real-time location services. Users describe their symptoms in plain language, and the AI analyzes them to determine the appropriate specialist, urgency level, and type of facility needed. The application then displays nearby hospitals and clinics on an interactive map, complete with directions and contact information.

**Important**: Sehat AI is a routing tool. It does not diagnose medical conditions, prescribe treatments, or provide medical advice. Always consult qualified healthcare professionals for medical concerns.

---

## Key Features

### AI-Powered Symptom Analysis
Describe your symptoms naturally. The AI determines the appropriate specialist type (Cardiologist, Neurologist, etc.), hospital department, urgency level, and facility type.

### Intelligent Hospital Finder
View nearby medical facilities on an interactive map. Each result includes ratings, distance, operating hours, and contact details. Sort by distance or rating to find the best option.

### Real-Time Navigation
Get turn-by-turn directions to your selected facility. Choose between driving, cycling, or walking modes. Track your live location during navigation.

### Personalized Experience
Sign in with Google to save your search history. Revisit previous symptom searches and triage results at any time.

### Responsive Design
Full functionality on both desktop and mobile devices. The interface adapts seamlessly with a side panel on desktop and a swipeable bottom sheet on mobile.

---

## Technology Stack

| Category | Technologies |
|----------|-------------|
| Frontend | React, React Router, Vite |
| Styling | Tailwind CSS, Framer Motion |
| Backend Services | Firebase Authentication, Firestore |
| APIs | OpenRouter AI, Google Maps, Google Places, Google Directions |

---

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- API keys for OpenRouter, Google Maps, and Firebase

### Installation

1. Clone the repository and navigate to the project directory.

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   
   Add your API keys to the `.env` file:
   - `VITE_OPENROUTER_API_KEY` - Obtain from [OpenRouter](https://openrouter.ai/)
   - `VITE_GOOGLE_MAPS_KEY` - Obtain from [Google Cloud Console](https://console.cloud.google.com/) (enable Maps JavaScript API and Places API)
   - Firebase configuration keys (see `.env.example` for full list)

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

---

## How It Works

1. **Describe Symptoms** - Navigate to the interaction page and describe your symptoms in plain language.

2. **Receive Triage Result** - The AI analyzes your input and returns the recommended specialist, department, urgency level, and optimized search keywords.

3. **Find Facilities** - Click "Find Nearby Facilities" to see hospitals and clinics matching your needs on an interactive map.

4. **Get Directions** - Select a facility to view the route, estimated travel time, and start navigation.

---

## Project Structure

```
sehat-ai/
├── src/
│   ├── components/       # UI components (HomePage, Maps, Triage)
│   ├── context/          # Authentication context
│   ├── firebase/         # Firebase configuration
│   ├── services/         # Firestore operations
│   └── utils/            # API integrations
├── public/               # Static assets
└── index.html            # Entry point
```

---

## Contributing

Contributions are welcome. Please open an issue to discuss proposed changes before submitting a pull request.

---

## License

This project was built for the LackeCity Hackathon.

---

*Sehat AI - Connecting you to the right care, faster.*