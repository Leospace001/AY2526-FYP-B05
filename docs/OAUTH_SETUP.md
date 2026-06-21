# OAuth Setup Guide (Google & GitHub)

This project uses **Spring Boot OAuth2 Client** on the backend. After a successful provider login, the server issues the **same JWT** used by username/password login, then redirects the browser to:

`https://leospace.cc/oauth/callback#token=...`

The React app stores that token and continues as normal.

---

## 1. Google Cloud Console setup

### Step A — Create a project

1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project (e.g. `leospace-fyp`)

### Step B — Configure the OAuth consent screen

1. Go to **APIs & Services → OAuth consent screen**
2. Choose **External** (unless you use Google Workspace internal only)
3. Fill in:
   - **App name**: `Leospace`
   - **User support email**: your email
   - **Developer contact email**: your email
4. Add scopes:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`
5. Add test users while the app is in **Testing** mode (any Google account you want to log in with)

### Step C — Create OAuth credentials (Web application)

1. Go to **APIs & Services → Credentials**
2. Click **Create Credentials → OAuth client ID**
3. Application type: **Web application**
4. Name: `Leospace Web`

#### Authorized JavaScript origins

Add the exact origins users open in the browser:

| Environment | Origin |
|-------------|--------|
| Production | `https://leospace.cc` |
| Local (nginx) | `http://localhost` |

> If you also serve `https://www.leospace.cc`, add that origin too.

#### Authorized redirect URIs (callback URI)

This is the field you asked about. Spring Security expects:

```text
{your-public-origin}/login/oauth2/code/google
```

Add **all** environments you use:

| Environment | Redirect URI |
|-------------|--------------|
| Production | `https://leospace.cc/login/oauth2/code/google` |
| Local nginx | `http://localhost/login/oauth2/code/google` |

> Optional: if you hit Spring Boot directly on port 8080 during dev:
> `http://localhost:8080/login/oauth2/code/google`

5. Click **Create**
6. Copy the **Client ID** and **Client secret** — you do **not** download a JSON credentials file for this flow. Plain text ID/secret in `.env` is enough.

### Step D — Put credentials in your server environment

In project root `.env`:

```env
GOOGLE_CLIENT_ID=123456789-xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxx
```

Restart Docker:

```bash
docker compose down
docker compose up -d --build
```

OAuth buttons appear on the login page only when credentials are configured.

---

## 2. GitHub OAuth setup (optional)

1. GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**
2. Fill in:

| Field | Production value |
|-------|------------------|
| Application name | Leospace |
| Homepage URL | `https://leospace.cc` |
| Authorization callback URL | `https://leospace.cc/login/oauth2/code/github` |

For local dev add a second OAuth app (or second callback if GitHub allows multiple):

`http://localhost/login/oauth2/code/github`

3. Copy **Client ID** and generate a **Client secret**
4. Add to `.env`:

```env
GITHUB_CLIENT_ID=Iv1.xxxxxxxx
GITHUB_CLIENT_SECRET=xxxxxxxx
```

---

## 3. How the callback flow works on leospace.cc

```text
User clicks "Continue with Google"
  → https://leospace.cc/oauth2/authorization/google
  → Google login page
  → https://leospace.cc/login/oauth2/code/google   ← must match Google Console
  → Spring Boot creates/links user, issues JWT
  → https://leospace.cc/oauth/callback#token=...
  → React stores JWT → dashboard
```

Nginx proxies these paths to Spring Boot (see `nginx/default.conf`):

- `/oauth2/`
- `/login/oauth2/`
- `/api/`

---

## 4. Account linking behavior

| Scenario | What happens |
|----------|--------------|
| First Google login | New user created, `user_identities` row added |
| Same Google account again | Logs into same user |
| Google email matches existing local account | Provider linked to existing user |
| Username/password login | Still works unchanged |

You do **not** need to replace username with email for login. Email is used internally to link providers; username remains the JWT subject for local accounts.

OAuth-only users get an auto-generated username and no password until they set one via forgot-password.

---

## 5. Troubleshooting

### `redirect_uri_mismatch`

The URI Google received does not exactly match Google Console. Check:

- `https` vs `http`
- no trailing slash
- correct path: `/login/oauth2/code/google`
- `DOMAIN` env var in Docker is `https://leospace.cc` (no trailing slash)

### OAuth buttons not showing

`GET /api/auth/oauth/providers` returned `[]`. Client ID/secret are missing or empty in the `app` container environment.

### `missing_signature_verifier` / JwkSet URI

Google login uses OpenID Connect (`openid` scope). Spring must verify the ID token using Google's JWK keys.
The app uses `CommonOAuth2Provider.GOOGLE`, which configures `jwk-set-uri` automatically.
If you see this error, rebuild the backend after pulling the latest code:

```bash
docker compose up -d --build app
```


Add the `http://localhost/...` redirect URI in Google Console and use `DOMAIN=http://localhost` in `docker-compose.dev.yml`.

### 502 on `/oauth2/...`

Rebuild nginx after config change and confirm `app` container is running.

---

## 6. Security notes

- Never put OAuth client secrets in the React frontend
- JWT is passed in the URL **fragment** (`#token=`) so it is not sent to server logs
- Publish Google consent screen to **Production** before opening to the public
