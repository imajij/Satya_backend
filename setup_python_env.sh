#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting up Python virtual environment for Satya AI Service...${NC}"

# Check if python3 is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${YELLOW}Python3 is not installed. Please install it first.${NC}"
    exit 1
fi

# Create virtual environment
VENV_DIR="ai_service/venv"
if [ -d "$VENV_DIR" ]; then
    echo -e "${YELLOW}Virtual environment already exists. Removing...${NC}"
    rm -rf "$VENV_DIR"
fi

echo "Creating virtual environment in $VENV_DIR..."
python3 -m venv "$VENV_DIR"

# Activate virtual environment
echo "Activating virtual environment..."
source "$VENV_DIR/bin/activate"

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install requirements
if [ -f "ai_service/requirements.txt" ]; then
    echo "Installing Python dependencies..."
    pip install -r ai_service/requirements.txt
    echo -e "${GREEN}Dependencies installed successfully!${NC}"
else
    echo -e "${YELLOW}requirements.txt not found. Creating it...${NC}"
    cat > ai_service/requirements.txt << EOF
flask==3.0.0
flask-cors==4.0.0
python-dotenv==1.0.0
requests==2.31.0
anthropic==0.8.1
langchain==0.1.0
langchain-anthropic==0.1.0
langchain-community==0.0.10
EOF
    pip install -r ai_service/requirements.txt
    echo -e "${GREEN}Dependencies installed successfully!${NC}"
fi

echo ""
echo -e "${GREEN}Setup complete!${NC}"
echo ""
echo "To activate the virtual environment in the future, run:"
echo "  source ai_service/venv/bin/activate"
echo ""
echo "To deactivate, run:"
echo "  deactivate"
