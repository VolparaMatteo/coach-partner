# Coach Partner

## Project Overview
Coach Partner is a digital assistant for sports coaches (football, basketball, volleyball).
Individual coach registration (not club-based). Free registration with guided onboarding.

## Architecture
- **Backend**: Flask + SQLAlchemy + JWT (Python) — `/backend`
- **Frontend**: React + TypeScript + Vite + Tailwind CSS — `/frontend`
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **AI**: OpenAI API for report generation (gpt-4o-mini)

## Development Setup
```bash
# Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
flask db init && flask db migrate -m "init" && flask db upgrade
python run.py

# Frontend
cd frontend
npm install
npm run dev
```

## Key Conventions
- API routes prefixed with `/api/`
- JWT auth on all protected routes
- Sport-specific config in `backend/app/utils/sport_config.py`
- All AI outputs are editable by the coach (AI assists, never decides)
- Italian UI language

## Data Model
User → Team → Athletes, TrainingSessions, Matches
Evaluations, WellnessEntries, Injuries linked to Athletes
Notes (polymorphic: linked to athlete/training/match)
AIReports linked to coach

## Onboarding Flow
1. Register (email/password)
2. Select sport (football/basketball/volleyball)
3. Create team profile (category, level, schedule)
4. Set coaching philosophy (focus areas)
5. Import roster (optional)
6. Complete → redirect to Home
