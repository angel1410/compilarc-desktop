#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "   CompilaRC Desktop - Pipeline de Compilación Windows    "
echo "=========================================================="

export PATH=$PATH:/home/angel/go/bin:/home/angel/.local/bin

WORKDIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$WORKDIR"

echo "[1/5] Compilando ejecutable principal (compilarc-desktop.exe)..."
wails build -platform windows/amd64

echo "[2/5] Copiando binarios y bases de datos a directorios de empaquetado..."
mkdir -p installer-modern/payload/data build/bin/data
cp build/bin/compilarc-desktop.exe installer-modern/payload/compilarc-desktop.exe
cp build/bin/compilarc-desktop.exe compilarc-desktop.exe

cp data/ac_local.db installer-modern/payload/data/ac_local.db
cp data/solicitudes_offline.db installer-modern/payload/data/solicitudes_offline.db
cp data/ac_local.db build/bin/data/ac_local.db
cp data/solicitudes_offline.db build/bin/data/solicitudes_offline.db

echo "[3/5] Compilando herramienta forense / rescate (compilarc-rescue.exe)..."
mkdir -p bin
GOOS=windows GOARCH=amd64 go build -ldflags="-s -w" -o bin/compilarc-rescue.exe ./cmd/rescue
GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o bin/compilarc-rescue ./cmd/rescue

echo "[4/5] Compilando Instalador Moderno (CompilaRC-Instalador-Moderno.exe)..."
(
  cd installer-modern
  wails build -platform windows/amd64
  cp build/bin/CompilaRC-Instalador-Moderno.exe ../CompilaRC-Instalador-Moderno.exe
)

echo "[5/5] Compilando Instalador Formal NSIS (CompilaRC-Desktop-Setup-v1.0.exe)..."
docker run --rm -v "$WORKDIR":/work -w /work/build/windows/installer ubuntu:24.04 bash -c \
  "apt-get update -qq && apt-get install -y -qq nsis >/dev/null && makensis -DARG_WAILS_AMD64_BINARY=../../bin/compilarc-desktop.exe project.nsi"
cp build/bin/CompilaRC-Desktop-Setup-v1.0.exe CompilaRC-Desktop-Setup-v1.0.exe

echo "=========================================================="
echo " ¡Proceso Completado Exitosamente!"
echo " Binarios y paquetes generados en la raíz:"
ls -lh compilarc-desktop.exe CompilaRC-Instalador-Moderno.exe CompilaRC-Desktop-Setup-v1.0.exe bin/
echo "=========================================================="
