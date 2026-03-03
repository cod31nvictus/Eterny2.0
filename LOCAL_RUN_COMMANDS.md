# Commands to run API, MCP, and Expo (local test)

Use **three separate terminals**. Ensure PostgreSQL is running and `services/api/.env` and `services/mcp/.env` have the correct `DATABASE_URL` and `OPENAI_API_KEY`.

---

## Terminal 1 — API

```powershell
cd "C:\Users\Sadaf Siddiqui\Projects\Eterny2.0\services\api"
npm run dev
```

- Wait for: `API listening on port 4000`

---

## Terminal 2 — MCP

```powershell
cd "C:\Users\Sadaf Siddiqui\Projects\Eterny2.0\services\mcp"
npm run dev
```

- Wait for: `MCP service listening on port 4100`

---

## Terminal 3 — Expo (web)

```powershell
cd "C:\Users\Sadaf Siddiqui\Projects\Eterny2.0\apps\mobile"
$env:EXPO_PUBLIC_API_BASE_URL="http://localhost:4000"
npx expo start --web --port 8083
```

- Opens Metro; web app usually opens in the browser, or go to: **http://localhost:8083**
- If port 8083 is in use, try `--port 8084` (or answer `yes` when Expo asks to use another port).

---

## Optional: free port 4000 before starting API

If something is already using port 4000:

```powershell
Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
```

Then run the API commands in Terminal 1.

---

## Summary

| Service | Port | URL |
|--------|------|-----|
| API     | 4000 | http://localhost:4000 |
| MCP     | 4100 | http://localhost:4100 |
| Expo web| 8083 | http://localhost:8083 |

Start **API** and **MCP** first, then **Expo**. The app talks to the API at `http://localhost:4000`.

---

## Optional — Run on Android emulator or Expo Go

### Emulator

1. Install Android Studio and create a virtual device.
2. With the emulator running:

```powershell
cd "C:\Users\Sadaf Siddiqui\Projects\Eterny2.0\apps\mobile"
$env:EXPO_PUBLIC_API_BASE_URL="http://10.0.2.2:4000"
npx expo start
```

- In the Expo terminal, press **a** to open the Android emulator.

### Expo Go on device

1. Ensure your phone and PC are on the same Wi‑Fi.
2. From the same command as above (`npx expo start`), scan the QR code with Expo Go.
3. Set `EXPO_PUBLIC_API_BASE_URL` to `http://<your-pc-ip>:4000` instead of `localhost`.
