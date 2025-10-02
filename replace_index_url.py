#!/usr/bin/env python3
"""Replace GPT URL in public/index.ja.html and print result."""

import argparse
from pathlib import Path
import sys

DEFAULT_TARGET = "https://gpts.openai.com/gpt/YOUR-GPT-ID"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Replace occurrences of the default GPT URL in public/index.ja.html "
            "with the provided value and print the modified content."
        )
    )
    parser.add_argument(
        "replacement",
        help="URL string that should replace the default GPT URL",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    index_path = Path("public/index.ja.html")

    try:
        contents = index_path.read_text(encoding="utf-8")
    except FileNotFoundError:
        print(f"Error: {index_path} not found.", file=sys.stderr)
        return 1

    if DEFAULT_TARGET not in contents:
        print(
            "Warning: target string not found; original content will be printed without changes.",
            file=sys.stderr,
        )

    updated = contents.replace(DEFAULT_TARGET, args.replacement)
    sys.stdout.write(updated)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
