import os
from typing import Optional

from fastapi import FastAPI
from pydantic import BaseModel

DEFAULT_RISK_KEYWORDS = [
    "自杀",
    "轻生",
    "想死",
    "不想活了",
    "割腕",
    "上吊",
    "跳楼",
    "绝望",
    "自残",
    "抑郁",
    "伤害自己",
    "kill myself",
    "suicide",
]

MODEL_NAME = os.getenv("MODEL_NAME")
MODEL_DEVICE = os.getenv("MODEL_DEVICE", "cpu")

classifier = None
try:
    if MODEL_NAME:
        from transformers import pipeline

        classifier = pipeline(
            "text-classification",
            model=MODEL_NAME,
            device=0 if MODEL_DEVICE == "cuda" else -1,
        )
except Exception:
    # 允许在无模型或离线情况下继续启动
    classifier = None


class TextIn(BaseModel):
    text: str
    threshold: Optional[float] = 0.5


app = FastAPI(title="Safety Model (tiny)", version="1.0.0")


@app.get("/health")
def health():
    return {"status": "ok", "model": bool(classifier)}


@app.post("/classify")
def classify(payload: TextIn):
    text = payload.text or ""
    lower = text.lower()
    risk_hit = any(kw.lower() in lower for kw in DEFAULT_RISK_KEYWORDS)

    score = 1.0 if risk_hit else 0.0
    label = "safe"

    if classifier:
        try:
            res = classifier(text, truncation=True)
            if res and isinstance(res, list):
                top = res[0]
                label = top.get("label", label)
                score = float(top.get("score", score))
        except Exception:
            # fallback to keyword result
            pass

    is_risky = score >= (payload.threshold or 0.5) or risk_hit
    return {
        "risky": bool(is_risky),
        "score": float(score),
        "label": label,
        "keyword_hit": risk_hit,
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8088"))
    uvicorn.run(app, host="0.0.0.0", port=port)
