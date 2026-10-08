#!/usr/bin/env python3
import psycopg2
import sqlite3
import time
import os
import sys

def main():
    start_time = time.time()
    dest_db = "/home/angel/compilarc-desktop/PAQUETE_USB_COMPILARC/cedulados_full.db"
    
    print("=" * 70)
    print("🚀 EXPORTADOR OFICIAL DE ARCHIVO CEDULAR Y TABLAS A SQLITE")
    print(f"Destino: {dest_db}")
    print("=" * 70)

    if os.path.exists(dest_db):
        print(f"Eliminando versión anterior: {dest_db}")
        os.remove(dest_db)

    print("Conectando a PostgreSQL (registro_civil_bd)...")
    pg_conn = psycopg2.connect(
        host="localhost",
        port=5432,
        dbname="registro_civil_bd",
        user="postgres",
        password="root"
    )

    print("Inicializando base de datos SQLite con parámetros de alto rendimiento...")
    sq_conn = sqlite3.connect(dest_db)
    sq_cur = sq_conn.cursor()

    sq_cur.execute("PRAGMA synchronous = OFF;")
    sq_cur.execute("PRAGMA journal_mode = OFF;")
    sq_cur.execute("PRAGMA cache_size = -2000000;")  # 2 GB RAM cache
    sq_cur.execute("PRAGMA temp_store = MEMORY;")

    # 1. Crear tablas
    print("Creando estructura de tablas en SQLite...")
    sq_cur.execute("""
    CREATE TABLE ac_local (
        nacionalidad TEXT NOT NULL,
        cedula INTEGER NOT NULL,
        primer_nombre TEXT NOT NULL,
        segundo_nombre TEXT DEFAULT '',
        primer_apellido TEXT NOT NULL,
        segundo_apellido TEXT DEFAULT '',
        fecha_nacimiento TEXT DEFAULT '',
        sexo TEXT DEFAULT ''
    );
    """)

    sq_cur.execute("""
    CREATE TABLE IF NOT EXISTS ac_metadata (
        clave TEXT PRIMARY KEY,
        valor TEXT NOT NULL,
        actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    """)

    sq_cur.execute("""
    CREATE TABLE IF NOT EXISTS c001t_geografico (
        nu_geografico INTEGER PRIMARY KEY,
        co_geografico TEXT NOT NULL,
        nb_geografico TEXT NOT NULL,
        nu_categoria INTEGER NOT NULL,
        nu_geografico_padre INTEGER
    );
    """)

    sq_cur.execute("""
    CREATE TABLE IF NOT EXISTS i001t_ourc (
        nu_ourc INTEGER PRIMARY KEY,
        co_ourc TEXT NOT NULL,
        nb_ourc TEXT NOT NULL,
        di_ourc TEXT,
        nu_geografico INTEGER NOT NULL
    );
    """)

    sq_cur.execute("""
    CREATE TABLE IF NOT EXISTS c004t_tipo_acta (
        co_tipo_acta TEXT PRIMARY KEY,
        tx_descripcion TEXT NOT NULL
    );
    """)

    sq_cur.execute("""
    CREATE TABLE IF NOT EXISTS c002t_estado_proceso (
        co_estado TEXT PRIMARY KEY,
        nb_estado TEXT NOT NULL,
        tx_descripcion TEXT NOT NULL
    );
    """)

    # 2. Exportar tablas maestras pequeñas
    print("Exportando catálogos geográficos, OURCs y tipos de acta...")
    with pg_conn.cursor() as cur:
        # Geográfico
        cur.execute("SELECT nu_geografico, co_geografico, nb_geografico, nu_categoria, nu_geografico_padre FROM geo.c001t_geografico;")
        rows = cur.fetchall()
        sq_cur.executemany("INSERT INTO c001t_geografico VALUES (?, ?, ?, ?, ?)", rows)
        print(f"  ✓ {len(rows)} registros geográficos exportados.")

        # OURC
        cur.execute("SELECT nu_ourc, co_ourc, nb_ourc, di_ourc, nu_geografico FROM orc.i001t_ourc;")
        rows = cur.fetchall()
        sq_cur.executemany("INSERT INTO i001t_ourc VALUES (?, ?, ?, ?, ?)", rows)
        print(f"  ✓ {len(rows)} oficinas OURC exportadas.")

        # Tipos de Acta
        cur.execute("SELECT co_tipo_acta, tx_descripcion FROM core.c004t_tipo_acta;")
        rows = cur.fetchall()
        sq_cur.executemany("INSERT INTO c004t_tipo_acta VALUES (?, ?)", rows)
        print(f"  ✓ {len(rows)} tipos de acta exportados.")

        # Estados de Proceso
        cur.execute("SELECT co_estado, nb_estado, tx_descripcion FROM core.c002t_estado_proceso;")
        rows = cur.fetchall()
        sq_cur.executemany("INSERT INTO c002t_estado_proceso VALUES (?, ?, ?)", rows)
        print(f"  ✓ {len(rows)} estados de proceso exportados.")

    # 3. Exportar Archivo Cedular (36.6 millones de registros)
    print("\nIniciando extracción y streaming masivo de 36.6M de registros de core.i001t_ac...")
    pg_cur = pg_conn.cursor(name='stream_ac_cursor')
    pg_cur.itersize = 100000
    pg_cur.execute("""
    SELECT 
        co_nacionalidad, 
        nu_cedula, 
        primer_nombre, 
        COALESCE(segundo_nombre, ''), 
        primer_apellido, 
        COALESCE(segundo_apellido, ''), 
        COALESCE(to_char(fe_nacimiento, 'YYYY-MM-DD'), ''), 
        co_sexo 
    FROM core.i001t_ac;
    """)

    insert_sql = "INSERT INTO ac_local VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    total_insertados = 0
    batch_size = 100000
    t0 = time.time()

    while True:
        rows = pg_cur.fetchmany(batch_size)
        if not rows:
            break
        sq_cur.executemany(insert_sql, rows)
        total_insertados += len(rows)
        
        if total_insertados % 2000000 == 0 or total_insertados >= 36600000:
            elapsed = time.time() - t0
            rate = total_insertados / elapsed if elapsed > 0 else 0
            pct = (total_insertados / 36604025) * 100
            print(f"  -> {total_insertados:,} / 36,604,025 ({pct:.1f}%) | Velocidad: {rate:,.0f} reg/seg | Transcurrido: {elapsed:.1f}s")

    pg_cur.close()
    pg_conn.close()
    print(f"✓ Total transferido a SQLite: {total_insertados:,} registros en {time.time() - t0:.1f}s")

    # 4. Crear Índices y Vistas de Compatibilidad
    print("\nConstruyendo índices b-tree optimizados para búsquedas sub-milisegundo...")
    t_idx = time.time()
    sq_cur.execute("CREATE UNIQUE INDEX idx_ac_local_pk ON ac_local (nacionalidad, cedula);")
    print(f"  ✓ Índice (nacionalidad, cedula) creado en {time.time() - t_idx:.1f}s")

    t_idx2 = time.time()
    sq_cur.execute("CREATE INDEX idx_ac_cedula ON ac_local (cedula);")
    print(f"  ✓ Índice (cedula) creado en {time.time() - t_idx2:.1f}s")

    print("Creando vista de compatibilidad 'cedulados'...")
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

    # Guardar metadatos
    sq_cur.execute("INSERT INTO ac_metadata (clave, valor) VALUES ('version_corte', '145');")
    sq_cur.execute("INSERT INTO ac_metadata (clave, valor) VALUES ('fecha_corte', '2026-09-01T00:00:00Z');")
    sq_cur.execute("INSERT INTO ac_metadata (clave, valor) VALUES ('total_registros', ?);", (str(total_insertados),))

    sq_conn.commit()
    sq_conn.close()

    # Reabrir con pragmas de producción (WAL) y hacer checkpoint
    print("Estableciendo modo WAL para producción...")
    sq_prod = sqlite3.connect(dest_db)
    sq_prod.execute("PRAGMA journal_mode = WAL;")
    sq_prod.execute("PRAGMA synchronous = NORMAL;")
    sq_prod.execute("PRAGMA wal_checkpoint(TRUNCATE);")
    sq_prod.close()

    total_time = time.time() - start_time
    file_size_bytes = os.path.getsize(dest_db)
    file_size_mb = file_size_bytes / (1024 * 1024)
    file_size_gb = file_size_mb / 1024

    print("=" * 70)
    print(f"🎉 EXPORTACIÓN COMPLETADA EXITOSAMENTE EN {total_time:.1f} SEGUNDOS")
    print(f"Archivo generado: {dest_db}")
    print(f"Tamaño final: {file_size_mb:,.1f} MB ({file_size_gb:.2f} GB)")
    print(f"Total registros: {total_insertados:,}")
    print("=" * 70)

if __name__ == '__main__':
    main()
