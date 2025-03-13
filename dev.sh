#!/bin/bash
# Start the Flask server
python server.py &
FLASK_PID=$!

# Start the Next.js dev server
npm run dev

# When Next.js is terminated, also kill the Flask server
kill $FLASK_PID
