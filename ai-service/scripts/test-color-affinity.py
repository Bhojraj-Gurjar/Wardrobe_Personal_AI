"""Unit tests for color_affinity.analyze_color_affinity."""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from color_affinity import analyze_color_affinity


def main() -> None:
    result = analyze_color_affinity(
        preferences={"favorite_colors": ["Navy", "White"]},
        history={
            "orders": [{"color": "Navy"}],
            "wishlist": [{"color": "Beige"}, {"color": "navy"}],
            "product_views": [{"color": "White"}, {"color": "Red"}],
        },
    )

    assert len(result["topColors"]) <= 10
    assert result["topColors"][0] == "navy"
    assert "navy" not in result["topColors"][1:]
    assert result["topColors"].count("navy") == 1
    assert result["colorAffinityScore"] > 0
    assert result["colorAffinity"]["navy"] > result["colorAffinity"]["white"]
    print("PASS color_affinity.analyze_color_affinity")
    print(result)


if __name__ == "__main__":
    main()
