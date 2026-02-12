# Coach Partner

**Il tuo assistente digitale per l'allenamento.**

Coach Partner e la piattaforma pensata per il singolo allenatore di **calcio**, **basket** e **pallavolo**. Registrazione gratuita, onboarding guidato, e in meno di 5 minuti sei operativo.

## Funzionalita Principali

- **Gestione Atleti** — Profilo completo, valutazioni, readiness, storico, obiettivi
- **Gestione Allenamenti** — Builder modulare a blocchi, esecuzione campo, analisi post-sessione
- **Gestione Gare** — Piano gara, analisi avversario, post-gara, minuti giocati
- **AI Coach Copilot** — Report automatici, insight settimanali, suggerimenti (l'AI assiste, non decide)
- **Multi-sport** — Configurazione specifica per calcio, basket, pallavolo

## Tech Stack

| Layer | Tecnologia |
|-------|-----------|
| Backend | Flask, SQLAlchemy, JWT, Marshmallow |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Database | SQLite (dev) / PostgreSQL (prod) |
| AI | OpenAI API (gpt-4o-mini) |
| Deploy | Docker Compose |

## Quick Start

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Copia e configura le variabili d'ambiente
cp .env.example .env

# Inizializza il database
flask db init
flask db migrate -m "Initial migration"
flask db upgrade

# Avvia il server
python run.py
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

L'app sara disponibile su `http://localhost:3000` con il backend su `http://localhost:5000`.

### Docker

```bash
docker compose up --build
```

## Flusso Onboarding

1. **Registrazione** — Email + password (gratuita)
2. **Selezione sport** — Calcio / Basket / Pallavolo
3. **Profilo squadra** — Categoria, livello, calendario
4. **Filosofia** — Focus principali (tattica, tecnica, fisico, mentale, prevenzione)
5. **Rosa** — Importazione rapida atleti
6. **Pronto!** — Home operativa in 30 secondi

## Struttura Progetto

```
coach-partner/
├── backend/
│   ├── app/
│   │   ├── models/        # Data models (User, Team, Athlete, etc.)
│   │   ├── routes/        # API endpoints (auth, onboarding, CRUD)
│   │   ├── services/      # AI service
│   │   └── utils/         # Auth helpers, sport config
│   ├── venv/              # Python virtual environment
│   ├── config.py
│   ├── run.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/           # Axios client
│   │   ├── components/    # Layout, UI components
│   │   ├── pages/         # All app pages
│   │   ├── store/         # Zustand auth store
│   │   └── types/         # TypeScript types
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml
└── README.md
```

## API Endpoints

| Endpoint | Descrizione |
|----------|------------|
| `POST /api/auth/register` | Registrazione coach |
| `POST /api/auth/login` | Login |
| `GET /api/auth/me` | Profilo utente |
| `POST /api/onboarding/step/*` | Steps onboarding |
| `GET/POST /api/teams` | CRUD squadre |
| `GET/POST /api/athletes` | CRUD atleti |
| `GET/POST /api/trainings` | CRUD allenamenti + blocchi |
| `GET/POST /api/matches` | CRUD gare |
| `GET/POST /api/evaluations` | Valutazioni atleti |
| `GET/POST /api/wellness` | Wellness entries |
| `GET/POST /api/injuries` | Infortuni |
| `GET/POST /api/notes` | Note rapide |
| `POST /api/ai/generate/*` | Generazione report AI |
| `GET /api/ai/reports` | Lista report AI |

## Principi di Prodotto

- **Zero frizione** — Poche schermate, pochi click, offline-friendly
- **Tempo prima di tutto** — Ogni funzione fa risparmiare tempo o migliora le decisioni
- **Personalizzazione guidata** — L'app si adatta allo sport e al livello
- **Dati spiegabili** — Ogni metrica ha un "perche" e un "cosa fare ora"
- **AI come copilota** — Suggerisce e prepara, la decisione finale e del coach

## License

MIT
