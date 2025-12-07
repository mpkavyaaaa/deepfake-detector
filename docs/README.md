# Deepfake Shield Frontend (Static)

This is a static frontend (HTML/CSS/JS) that talks to the FastAPI backend.

## Local preview

You can open `index.html` directly in your browser for a quick UI check.

For API calls to work, update `API_BASE_URL` in `script.js`:

```js
const API_BASE_URL = "http://localhost:8000"; // or your deployed backend URL
```

Then run the backend and use the page.
