import os
from dotenv import load_dotenv

load_dotenv()

# API Configuration
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", 8000))
DEBUG = os.getenv("DEBUG", "False").lower() == "true"

# CORS Settings
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

# ML Model Settings
DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "RandomForest")
MAX_PREDICTION_DAYS = int(os.getenv("MAX_PREDICTION_DAYS", 365))