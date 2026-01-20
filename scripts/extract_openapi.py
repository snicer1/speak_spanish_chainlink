"""
Extract OpenAPI schema from FastAPI app and save to JSON file.
"""
import json
import sys
from pathlib import Path

# Add parent directory to path to import main module
sys.path.insert(0, str(Path(__file__).parent.parent))

from main import app


def extract_openapi_schema(output_path: str = "docs/swagger.json"):
    """
    Extract OpenAPI schema from FastAPI app and save to JSON file.

    Args:
        output_path: Path where to save the OpenAPI schema JSON
    """
    # Get OpenAPI schema from FastAPI app
    openapi_schema = app.openapi()

    # Ensure output directory exists
    output_file = Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)

    # Save schema to JSON file with pretty formatting
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(openapi_schema, f, indent=2, ensure_ascii=False)

    print(f"✓ OpenAPI schema extracted successfully to: {output_file}")
    print(f"  Total endpoints: {len(openapi_schema.get('paths', {}))}")
    print(f"  API Title: {openapi_schema.get('info', {}).get('title')}")
    print(f"  API Version: {openapi_schema.get('info', {}).get('version')}")


if __name__ == "__main__":
    extract_openapi_schema()
