#!/bin/bash
PORT=8000

# Controlla se la porta è libera
while lsof -i :$PORT > /dev/null 2>&1; do
    echo "⚠️  Porta $PORT occupata, provo la $((PORT+1))..."
    PORT=$((PORT+1))
done

echo "🚀 Avvio Life Planner sulla porta $PORT..."
echo "📱 Apri: http://localhost:$PORT"
echo "⏹️  Premi Ctrl+C per fermare"
python3 -m http.server $PORT