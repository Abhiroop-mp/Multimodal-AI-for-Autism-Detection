# Spectra Care Backend API

## Overview
Backend API server for game recommendations, patient progress tracking, and session management.

## Features
- **Game Recommendations**: Personalized game suggestions based on patient assessment
- **Progress Tracking**: Store and retrieve patient game progress
- **Session Management**: Create and manage therapy sessions
- **Patient Data**: Manage patient profiles and assessment data

## API Endpoints

### Game Recommendations
- `GET /api/game-recommendations/:patientId` - Get personalized games for patient
- `POST /api/game-progress` - Save game progress

### Patient Progress
- `GET /api/patient-progress/:patientId` - Get patient progress summary
- `GET /api/patients` - Get all patients with progress

### Session Management
- `POST /api/patient-session` - Create new patient session
- `POST /api/patient-session/:sessionId/end` - End patient session

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm start
   ```
   
   Server runs on: `http://localhost:5001`

3. **Start with Auto-reload**:
   ```bash
   npm run dev
   ```

## Data Storage
Uses JSON files for data persistence (replace with proper database in production):
- `data/patients.json` - Patient profiles and assessment data
- `data/game-progress.json` - Game progress tracking
- `data/sessions.json` - Session management

## Integration with Dashboard
The dashboard (`dashboard.html`) automatically integrates with this backend API to provide:
- Real-time game recommendations
- Patient progress tracking
- Session management
- Interactive game cards with progress indicators

## Game Catalog
All 32 games are cataloged with age-appropriate categorization:
- **Toddlers (0-4 years)**: 8 games
- **Children (5-12 years)**: 8 games  
- **Adolescents (13-18 years)**: 8 games
- **Adults (18+ years)**: 8 games

## Security Notes
- Add proper authentication middleware in production
- Use HTTPS in production
- Implement rate limiting
- Add input validation and sanitization
- Use environment variables for sensitive data
