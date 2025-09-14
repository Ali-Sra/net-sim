from flask import Flask, request, jsonify, send_from_directory, send_file
from storage import Storage
from pathlib import Path
import threading, webbrowser, sys

# ریشه پروژه = پوشه‌ی backend/..
ROOT = Path(__file__).resolve().parent.parent
FRONTEND_DIR = ROOT / "frontend"
INDEX_FILE = FRONTEND_DIR / "index.html"
DATA_FILE = ROOT / "data" / "topologies.json"

# چاپ مسیرها برای اطمینان در لاگ
print("ROOT         :", ROOT)
print("FRONTEND_DIR :", FRONTEND_DIR, "exists:", FRONTEND_DIR.exists())
print("INDEX_FILE   :", INDEX_FILE, "exists:", INDEX_FILE.exists())
print("DATA_FILE    :", DATA_FILE)

app = Flask(__name__, static_folder=str(FRONTEND_DIR), static_url_path="")

store = Storage(filepath=str(DATA_FILE))

# ---------- Frontend ----------
@app.get("/")
def index():
    # مستقیماً فایل index.html را بفرست (بدون تکیه به static_url_path)
    if INDEX_FILE.exists():
        return send_file(str(INDEX_FILE))
    return ("index.html not found at: " + str(INDEX_FILE), 404)

# سرو کردن فایل‌های استاتیک فرانت‌اند (css/js/img/...)
@app.get("/<path:path>")
def static_proxy(path):
    file_path = FRONTEND_DIR / path
    if file_path.exists():
        # اگر فایل/پوشه وجود دارد از frontend بده
        return send_from_directory(str(FRONTEND_DIR), path)
    # در صورت مسیرهای SPA یا نبود فایل، برگرد به index.html
    if INDEX_FILE.exists():
        return send_file(str(INDEX_FILE))
    return ("not found: " + str(file_path), 404)

# ---------- API ----------
@app.get("/api/health")
def health():
    return jsonify({"ok": True})

@app.post("/api/topology/save")
def save_topology():
    data = request.get_json(force=True, silent=False)
    if not data or "nodes" not in data:
        return jsonify({"ok": False, "error": "invalid payload"}), 400
    store.save(data)
    return jsonify({"ok": True})

@app.get("/api/topology/latest")
def latest_topology():
    topo = store.latest()
    if topo is None:
        return jsonify({"ok": False, "error": "not found"}), 404
    return jsonify(topo)

if __name__ == "__main__":
    url = "http://127.0.0.1:5000/"
    threading.Timer(0.8, lambda: webbrowser.open(url)).start()
    # از هر جایی می‌تونی اجرا کنی؛ مسیرها مطلق هستند
    app.run(host="127.0.0.1", port=5000, debug=True)
