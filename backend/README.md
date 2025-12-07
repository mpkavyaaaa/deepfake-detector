# Deepfake Detector Backend (FastAPI)

## Local setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt

# IMPORTANT: set your Hugging Face token (read token)
export HF_TOKEN="YOUR_HF_READ_TOKEN"

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at `http://localhost:8000`.

Health check:
- `GET http://localhost:8000/api/health`

Deepfake detection:
- `POST http://localhost:8000/api/detect-image` with form-data field `file` (image).
