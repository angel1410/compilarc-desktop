#!/usr/bin/env python3
import http.server
import os
import cgi

PORT = 9090
TARGET_DIR = "/media/angel/Elements1/CompilaRC_Instalacion/portable/data"
os.makedirs(TARGET_DIR, exist_ok=True)

class UploadHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Subir Base de Datos AC (36 Millones)</title>
            <style>
                body {{ font-family: sans-serif; background: #0f172a; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }}
                .card {{ background: #1e293b; padding: 2.5rem; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); max-width: 500px; width: 100%; text-align: center; }}
                h2 {{ color: #38bdf8; margin-top: 0; }}
                input[type=file] {{ margin: 20px 0; padding: 10px; background: #334155; border-radius: 6px; width: 100%; box-sizing: border-box; color: white; }}
                button {{ background: #2563eb; color: white; border: none; padding: 12px 24px; font-size: 16px; border-radius: 6px; cursor: pointer; font-weight: bold; width: 100%; }}
                button:hover {{ background: #1d4ed8; }}
            </style>
        </head>
        <body>
            <div class="card">
                <h2>Cargar AC Completo (36 Millones)</h2>
                <p>Seleccione el archivo SQLite de <code>Proyectos/consulta_cedula</code> en su Laptop Fedora para transferirlo directamente al disco <b>Elements</b>.</p>
                <form method="POST" enctype="multipart/form-data">
                    <input type="file" name="archivo_db" required>
                    <button type="submit">Transferir al Disco Externo</button>
                </form>
            </div>
        </body>
        </html>
        """
        self.wfile.write(html.encode('utf-8'))

    def do_POST(self):
        form = cgi.FieldStorage(
            fp=self.rfile,
            headers=self.headers,
            environ={'REQUEST_METHOD': 'POST', 'CONTENT_TYPE': self.headers['Content-Type']}
        )
        if "archivo_db" in form:
            fileitem = form["archivo_db"]
            if fileitem.filename:
                out_path = os.path.join(TARGET_DIR, "ac_local.db")
                with open(out_path, 'wb') as f:
                    while True:
                        chunk = fileitem.file.read(1024 * 1024)
                        if not chunk:
                            break
                        f.write(chunk)
                size_mb = os.path.getsize(out_path) / (1024 * 1024)
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.end_headers()
                self.wfile.write(f"""
                <body style="background:#0f172a;color:white;font-family:sans-serif;text-align:center;padding:50px;">
                    <h1 style="color:#22c55e;">¡Archivo recibido con éxito!</h1>
                    <p>Nombre: {fileitem.filename}</p>
                    <p>Tamaño: {size_mb:.2f} MB</p>
                    <p>Guardado en: <b>{out_path}</b></p>
                </body>
                """.encode('utf-8'))
                return

        self.send_response(400)
        self.end_headers()
        self.wfile.write(b"Error al procesar el archivo")

if __name__ == "__main__":
    server = http.server.HTTPServer(("0.0.0.0", PORT), UploadHandler)
    print(f"Servidor receptor activo en http://0.0.0.0:{PORT}")
    server.serve_forever()
