# AY2526-FYP-B05

This repository contains three main parts:

- `app` — Spring Boot backend
- `ui` — React frontend
- `AI_Plant_Lifestyle` — Django plant identification service

---

## Clone the project from GitHub

```bash
git clone https://github.com/Leospace001/AY2526-FYP-B05.git
cd AY2526-FYP-B05
```

---

## Run the project in Docker

```bash
docker compose up -d --build
```

### Available services

- React frontend: `http://localhost:5173/`
- Spring Boot backend: `http://localhost:8080/`
- Django plant site: `http://localhost:8000/`
- Adminer: `http://localhost:7070/`
- RabbitMQ management UI: `http://localhost:15672/`

---

## Adminer access

Use this to inspect the PostgreSQL database:

```text
http://localhost:7070/
server:     db
username:   postgres
password:   postgres
```

---

## React frontend login accounts

```text
username:   leospace
password:   P@ssw0rd

username:   andy
password:   123456
```

---

## Django plant identification site

The Django app is located in `AI_Plant_Lifestyle/` and uses Plant.id to identify uploaded plant images.

### Main page

```text
http://localhost:8000/
```

### Django admin

Create a superuser first if needed:

```bash
docker compose exec django-api python manage.py createsuperuser
```

Then open:

```text
http://localhost:8000/admin/
```

### Seed plant data

If you want to import the sample plant records into PostgreSQL:

```bash
docker compose exec django-api python manage.py migrate
docker compose exec django-api python manage.py import_seed_plants
```

The seed data lives in:

```text
AI_Plant_Lifestyle/plants/seed_plants.json
```

---

## Flower AI recommendation setup

1. Add your Gemini API key to `.env`:

```env
GEMINI_API_KEY=your_gemini_api_key
```

2. Rebuild the backend service:

```bash
docker compose up -d --build app
```

3. Flower recommendation API endpoint:

```http
POST http://localhost:8080/api/recommend/flower
Content-Type: application/json
```

Sample request body:

```json
{
  "species": "rose",
  "color": "pink",
  "usage": "gift",
  "traits": ["fragrant", "romantic"]
}
```

Sample response body:

```json
{
  "flower_name": "Beverly Rose",
  "scientific_name": "Rosa 'Beverly'",
  "recommendation_reason": "...",
  "care_instructions": "...",
  "demo_mode": false
}
```

If Gemini is unavailable, the app will automatically fall back to demo mode.

---

## Flower recommendation UI page

```text
http://localhost:5173/ai/flower-rec
```

---

## Notes

- Django uploads are stored in the `AI_Plant_Lifestyle/media/` folder through Docker volume mapping.
- PostgreSQL data is persisted in the `pgdata` volume.
- The Django plant database can be managed through Django admin or imported from the seed JSON file.
