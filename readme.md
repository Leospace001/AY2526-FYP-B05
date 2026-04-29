### Clone the project from github
```
git clone https://github.com/Leospace001/AY2526-FYP-B05.git
```

### Run the project in docker container
```
docker compose up -d
```

### Adminer (Access to Postgresql Database)
```
http://localhost:7070/
server:     db
username:   postgres
password:   postgres
```

### Website frontend (Adminer account)
```
http://localhost:5173/
username:   leospace
password:   P@ssw0rd

# Additional test account
username:   andy
password:   123456
```

### Flower AI recommendation setup
1) Add Gemini API key to `.env` (do not commit this file):
```
GEMINI_API_KEY=your_gemini_api_key
```

2) Rebuild backend service:
```
docker compose up -d --build app
```

3) Flower recommendation API endpoint:
```
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
  "care_instructions": "..."
}
```

### Flower recommendation UI page
```
http://localhost:5173/ai/flower-rec
```