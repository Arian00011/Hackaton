from flask import Flask, request, jsonify
import csv
from datetime import datetime
import os

app = Flask(__name__)
CSV_FILE = "reservas.csv"

# Crear archivo con encabezado si no existe
if not os.path.isfile(CSV_FILE):
    with open(CSV_FILE, mode='w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(["Nombre", "Fecha", "Hora", "Mesas", "Personas", "Decoración", "Cover", "Total", "Timestamp"])

@app.route('/reservar', methods=['POST'])
def reservar():
    data = request.json
    with open(CSV_FILE, mode='a', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow([
            data.get("nombre"),
            data.get("fecha"),
            data.get("hora"),
            ", ".join(map(str, data.get("mesas", []))),
            data.get("personas"),
            "Sí" if data.get("decoracion") else "No",
            "Sí" if data.get("cover") > 0 else "No",
            data.get("total"),
            datetime.now().isoformat()
        ])
    return jsonify({"success": True, "message": "Reserva guardada correctamente"}), 200

if __name__ == '__main__':
    app.run(debug=True)