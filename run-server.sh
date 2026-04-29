#!/bin/bash
cd /home/z/my-project
while true; do
    echo "Starting Next.js server..."
    bun run dev
    echo "Server stopped. Restarting in 5 seconds..."
    sleep 5
done
