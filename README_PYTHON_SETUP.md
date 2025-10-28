# Python AI Service Setup Guide

## Prerequisites

- Python 3.8 or higher
- `python3-venv` package (install with: `sudo apt install python3-venv python3-full`)

## Quick Setup

Run the automated setup script:

```bash
chmod +x setup_python_env.sh
./setup_python_env.sh
```

This will:
1. Create a virtual environment in `ai_service/venv`
2. Install all required Python packages
3. Activate the environment

## Manual Setup

If you prefer to set up manually:

```bash
# 1. Create virtual environment
cd ai_service
python3 -m venv venv

# 2. Activate virtual environment
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt
```

## Running the AI Service

```bash
# Activate virtual environment (if not already activated)
source ai_service/venv/bin/activate

# Run the AI service
cd ai_service
python app.py
```

## Deactivating the Environment

```bash
deactivate
```

## Troubleshooting

### Error: externally-managed-environment

This error occurs when trying to install packages globally on newer Linux distributions. Always use a virtual environment as described above.

### Permission Denied on setup script

```bash
chmod +x setup_python_env.sh
```

### Missing python3-venv

```bash
sudo apt update
sudo apt install python3-venv python3-full
```
