#!/bin/bash

# Start Ollama in the background
ollama serve &

# Wait for the server to be ready
sleep 5

# Pull the desired model
echo "Pulling model..."
ollama pull llama3

# Keep the container running
wait $!
