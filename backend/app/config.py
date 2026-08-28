from pathlib import Path

from dotenv import load_dotenv


def load_environment() -> None:
    """Load the repository-level local configuration for backend processes."""
    load_dotenv(Path(__file__).resolve().parents[2] / ".env")
