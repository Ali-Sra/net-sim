import json
import os
from datetime import datetime

class Storage:
    def __init__(self, filepath="../data/topologies.json"):
        self.filepath = os.path.abspath(os.path.join(os.path.dirname(__file__), filepath))
        os.makedirs(os.path.dirname(self.filepath), exist_ok=True)
        if not os.path.exists(self.filepath):
            with open(self.filepath, "w", encoding="utf-8") as f:
                json.dump({"items": []}, f, ensure_ascii=False, indent=2)

    def _read_all(self):
        with open(self.filepath, "r", encoding="utf-8") as f:
            return json.load(f)

    def _write_all(self, data):
        with open(self.filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    def save(self, topo: dict):
        data = self._read_all()
        topo_copy = dict(topo)
        topo_copy["_saved_at"] = datetime.utcnow().isoformat() + "Z"
        data["items"].append(topo_copy)
        self._write_all(data)

    def latest(self):
        data = self._read_all()
        if not data["items"]:
            return None
        return data["items"][-1]
