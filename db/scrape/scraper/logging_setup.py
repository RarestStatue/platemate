import logging
import sys


def setup_logging(level: str = "info") -> logging.Logger:
    numeric = getattr(logging, level.upper(), logging.INFO)
    logger = logging.getLogger("scraper")
    logger.setLevel(numeric)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stderr)
        handler.setFormatter(
            logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s")
        )
        logger.addHandler(handler)
    return logger
