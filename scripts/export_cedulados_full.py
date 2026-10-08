#!/usr/bin/env python3
import psycopg2
import sqlite3
import time
import os
import sys

def main():
    dest_path = "/home/angel/compilarc-desktop/PAQUETE_USB_COMPILARC/cedulados_full.db"
    temp_path = dest_path + ".tmp"
    
    print("=================================================================")
    print("   EXPORTADOR DE ARCHIVO CEDULAR NACIONAL COMPLETO (36.6M)       ")
    print("   PostgreSQL (core.i001t_ac) -> SQLite (cedulados_full.db)       ")
    print("=================================================================")
    
    if os.path.exists(temp_path):
        os.remove(temp_path)
    
    t_start = time.time()
    
    print("\n[1/4] Conectando a PostgreSQL (registro_civil_bd)...")
    pg_conn = psycopg2.connect(
        host='localhost',
        port=5432,
        user='postgres',
        password='root',
        dbname='registro_civil_bd'
    )
    # Server-side cursor para no sobrecargar RAM
    pg_cur = pg_conn.cursor(name='ac_full_stream')
    pg_cur.itersize = 100000
    
    print("[2/4] Inicializando base de datos SQLite de alto rendimiento...")
    sq_conn = sqlite3.connect(temp_path)
    sq_cur = sq_conn.cursor()
    
    sq_cur.execute("PRAGMA synchronous = OFF;")
    sq_cur.execute("PRAGMA journal_mode = OFF;")
    sq_cur.execute("PRAGMA cache_size = -1000000;")  # 1GB cache RAM
    sq_cur.execute("PRAGMA page_size = 4096;")
    sq_cur.execute("PRAGMA temp_store = MEMORY;")
    sq_cur.execute("PRAGMA locking_mode = EXCLUSIVE;")
    
    sq_cur.execute("""
    CREATE TABLE ac_local (
        nacionalidad TEXT NOT NULL,
        cedula INTEGER NOT NULL,
        primer_nombre TEXT NOT NULL,
        segundo_nombre TEXT DEFAULT '',
        primer_apellido TEXT NOT NULL,
        segundo_apellido TEXT DEFAULT '',
        fecha_nacimiento TEXT DEFAULT '',
        sexo TEXT DEFAULT '',
        PRIMARY KEY (nacionalidad, cedula)
    ) WITHOUT ROWID;
    """)
    sq_conn.commit()
    
    print("[3/4] Transfiriendo 36.604.025 registros en lotes de 100.000...")
    pg_query = """
    SELECT 
        co_nacionalidad, 
        nu_cedula, 
        COALESCE(primer_nombre, ''), 
        COALESCE(segundo_nombre, ''), 
        COALESCE(primer_apellido, ''), 
        COALESCE(segundo_apellido, ''), 
        COALESCE(fe_nacimiento::text, ''), 
        COALESCE(co_sexo, '') 
    FROM core.i001t_ac;
    """
    pg_cur.execute(pg_query)
    
    total_filas = 0
    t_batch_start = time.time()
    
    insert_sql = "INSERT OR IGNORE INTO ac_local VALUES (?, ?, ?, ?, ?, ?, ?, ?);"
    
    while True:
        rows = pg_cur.fetchmany(100000)
        if not rows:
            break
        
        sq_cur.executemany(insert_sql, rows)
        sq_conn.commit()
        total_filas += len(rows)
        
        if total_filas % 2000000 == 0 or total_filas >= 36600000:
            elapsed = time.time() - t_start
            rate = total_filas / elapsed
            pct = (total_filas / 36604025.0) * 100.0
            print(f"  -> Progreso: {total_filas:,} / 36,604,025 ({pct:.1f}%) | Velocidad: {rate:,.0f} reg/s | Tiempo: {elapsed:.1f}s")
    
    print(f"\n[OK] Transferencia de datos completada: {total_filas:,} registros insertados.")
    
    print("\n[4/4] Construyendo índices secundarios y vistas de compatibilidad...")
    t_idx = time.time()
    sq_cur.execute("CREATE INDEX IF NOT EXISTS idx_ac_cedula ON ac_local (cedula);")
    
    sq_cur.execute("""
    CREATE VIEW IF NOT EXISTS cedulados AS
    SELECT 
        nacionalidad AS co_nacionalidad,
        cedula AS nu_cedula,
        primer_nombre,
        segundo_nombre,
        primer_apellido,
        segundo_apellido,
        fecha_nacimiento AS fe_nacimiento,
        sexo AS co_sexo
    FROM ac_local;
    """)
    
    sq_cur.execute("""
    CREATE TABLE IF NOT EXISTS ac_metadata (
        clave TEXT PRIMARY KEY,
        valor TEXT NOT NULL,
        actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    """)
    
    sq_cur.execute(f"""
    INSERT INTO ac_metadata (clave, valor) VALUES 
        ('version_corte', '146'),
        ('fecha_corte', '2026-10-01'),
        ('total_registros', '{total_filas}');
    """)
    
    sq_conn.commit()
    sq_conn.close()
    pg_cur.close()
    pg_conn.close()
    
    print(f"[OK] Índices creados en {time.time() - t_idx:.2f}s.")
    
    # Renombrar archivo final
    if os.path.exists(dest_path):
        os.remove(dest_path)
    os.rename(temp_path, dest_path)
    
    size_mb = os.path.getsize(dest_path) / (1024 * 1024)
    total_time = time.time() - t_start
    
    print("=================================================================")
    print("   ¡ARCHIVO CEDULAR GENERADO CON ÉXITO!                          ")
    print(f"   Archivo Final:  {dest_path}")
    print(f"   Tamaño:         {size_mb:.2f} MB ({size_mb/1024:.2f} GB)")
    print(f"   Total Registros:{total_filas:,}")
    print(f"   Tiempo Total:   {total_time:.2f} segundos ({total_time/60:.2f} minutos)")
    print("=================================================================")

if __name__ == "__main__":
    main()
