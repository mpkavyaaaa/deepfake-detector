import os
import requests
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

HF_API_URL = "https://api-inference.huggingface.co/models/prithivMLmods/deepfake-detector-model-v1"
HF_TOKEN = os.getenv("HF_TOKEN")

if not HF_TOKEN:
    # This will show up in your server logs if you forgot to set the token
    print("WARNING: HF_TOKEN environment variable is not set. Hugging Face calls will fail.")

headers = {"Authorization": f"Bearer {HF_TOKEN}"} if HF_TOKEN else {}

app = FastAPI(
    title="Deepfake Detector Backend",
    description="Simple FastAPI backend that calls a Hugging Face deepfake detection model.",
    version="1.0.0",
)

# Allow all origins so the static frontend can call this from anywhere
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, you can restrict this to your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok", "message": "Deepfake backend running"}


@app.post("/api/detect-image")
async def detect_image(file: UploadFile = File(...)):
    """
    Accepts an image file, sends it to the Hugging Face inference API,
    and returns simplified prediction data.
    """
    if not HF_TOKEN:
        raise HTTPException(
            status_code=500,
            detail="HF_TOKEN environment variable is not set on the server.",
        )

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload a valid image file.")

    image_bytes = await file.read()

    try:
        response = requests.post(
            HF_API_URL,
            headers=headers,
            data=image_bytes,
            timeout=60,
        )
    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=502,
            detail=f"Error connecting to Hugging Face API: {e}",
        )

    if response.status_code != 200:
        # Log part of the error body so you can debug if needed
        print("Hugging Face API error:", response.status_code, response.text[:600])
        raise HTTPException(
            status_code=500,
            detail=f"Hugging Face API error: {response.status_code}",
        )

    try:
        result = response.json()
    except ValueError:
        raise HTTPException(
            status_code=500,
            detail="Invalid JSON response from Hugging Face API",
        )

    # Many HF classification models return a list of {label, score} dicts
    label = None
    score = None

    if isinstance(result, list) and result and isinstance(result[0], dict):
        # pick the highest score
        best = max(result, key=lambda x: x.get("score", 0.0))
        label = best.get("label")
        score = best.get("score")

    # Fallbacks if the structure is different
    if label is None or score is None:
        return {"label": None, "score": None, "raw": result}

    return {
        "label": label,
        "score": score,
        "raw": result,
    }
