from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from storage import Storage
import os, threading, webbrowser

# فرانت‌اند را از پوشه frontend سرو کن
FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend"))

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path="")
CORS(app)  # ضرری ندارد؛ ولی با same-origin دیگر لازم هم نیست

store = Storage(filepath="../data/topologies.json")

# ---- صفحات فرانت‌اند ----
@app.route("/")
def index():
    return send_from_directory(FRONTEND_DIR, "index.html")

# (فایل‌های استاتیک مثل /assets/styles.css و /js/*.js را Flask خودش از static_folder می‌دهد)

# ---- API ----
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
    # مرورگر را خودکار باز کن
    threading.Timer(1.0, lambda: webbrowser.open("http://127.0.0.1:5000/")).start()
    app.run(host="127.0.0.1", port=5000, debug=True)
