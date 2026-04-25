"""Shared pytest fixtures."""
import os
import sys
from pathlib import Path

# Add the backend directory to sys.path so tests can import the app package.
BACKEND_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(BACKEND_DIR))
