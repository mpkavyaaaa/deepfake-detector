// IMPORTANT: Change this to your deployed backend URL (Render, Railway, etc.)
const API_BASE_URL = "http://localhost:8000";

const fileInput = document.getElementById("file-input");
const dropzone = document.getElementById("dropzone");
const preview = document.getElementById("preview");
const previewImg = document.getElementById("preview-img");
const scanForm = document.getElementById("scan-form");
const scanBtn = document.getElementById("scan-btn");

const resultCard = document.getElementById("result-card");
const statusChip = document.getElementById("status-chip");
const scoreText = document.getElementById("score-text");
const scoreFill = document.getElementById("score-fill");
const explanationText = document.getElementById("explanation-text");
const rawOutput = document.getElementById("raw-output");

let currentFile = null;

// Handle clicking on dropzone
dropzone.addEventListener("click", () => {
  fileInput.click();
});

// Handle drag & drop
["dragenter", "dragover"].forEach((eventName) => {
  dropzone.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.add("dragover");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  dropzone.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.remove("dragover");
  });
});

dropzone.addEventListener("drop", (e) => {
  const file = e.dataTransfer.files[0];
  if (file) {
    handleFileSelection(file);
  }
});

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    handleFileSelection(file);
  }
});

function handleFileSelection(file) {
  if (!file.type.startsWith("image/")) {
    alert("Please select an image file.");
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    alert("File is too large. Please select an image under 10MB.");
    return;
  }

  currentFile = file;
  const reader = new FileReader();
  reader.onload = (event) => {
    previewImg.src = event.target.result;
    preview.hidden = false;
  };
  reader.readAsDataURL(file);

  // Reset result when a new file is chosen
  resultCard.hidden = true;
}

scanForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!currentFile) {
    alert("Please choose an image first.");
    return;
  }

  scanBtn.disabled = true;
  const originalText = scanBtn.textContent;
  scanBtn.textContent = "Scanning...";

  try {
    const formData = new FormData();
    formData.append("file", currentFile);

    const response = await fetch(`${API_BASE_URL}/api/detect-image`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const detail = errorData?.detail || "Something went wrong with the scan.";
      throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
    }

    const data = await response.json();
    renderResult(data);
  } catch (err) {
    console.error(err);
    alert(`Scan failed: ${err.message}`);
  } finally {
    scanBtn.disabled = false;
    scanBtn.textContent = originalText;
  }
});

function renderResult(data) {
  const label = (data.label || "").toString().toLowerCase();
  const score = typeof data.score === "number" ? data.score : null;

  let status = "Not enough info";
  let explanation = "The model did not return a clear prediction. Try another image.";
  let mode = "neutral";

  if (label) {
    if (label.includes("fake") || label.includes("deepfake")) {
      status = "Likely Deepfake";
      explanation =
        "The model thinks this image has patterns consistent with a possible deepfake. Treat it as untrusted and cross-check from official sources.";
      mode = "danger";
    } else if (label.includes("real") || label.includes("authentic")) {
      status = "Likely Real";
      explanation =
        "The model did not find strong indicators of a deepfake. Still, do not rely on AI alone for critical decisions.";
      mode = "success";
    } else {
      status = `Detected: ${data.label}`;
      explanation =
        "The model returned a custom label. Interpret this result carefully and cross-check from multiple sources.";
      mode = "neutral";
    }
  }

  // Update chip
  statusChip.textContent = status;
  statusChip.classList.remove("danger", "success");
  if (mode === "danger") statusChip.classList.add("danger");
  if (mode === "success") statusChip.classList.add("success");

  // Score
  if (score !== null) {
    const percent = Math.round(score * 100);
    scoreText.textContent = `${percent}%`;
    scoreFill.style.width = `${Math.min(Math.max(percent, 0), 100)}%`;
  } else {
    scoreText.textContent = "–";
    scoreFill.style.width = "0%";
  }

  explanationText.textContent = explanation;

  // Raw output
  rawOutput.textContent = JSON.stringify(data.raw ?? data, null, 2);

  resultCard.hidden = false;
}
