# Bundled Fonts for Video Highlights

This directory contains bundled fonts used for text overlays in video highlights generation.

## Fonts Included

### OpenSans-Regular.ttf

- **Source**: Google Fonts (Apache License 2.0)
- **Usage**: Regular text overlays, segment type indicators
- **License**: Apache License 2.0

### OpenSans-Bold.ttf

- **Source**: Google Fonts (Apache License 2.0)
- **Usage**: Main text overlays for better visibility
- **License**: Apache License 2.0

## Usage in Code

The fonts are automatically used by the `generateHighlightsVideo` function in `src/utils/video.helper.ts`:

- **Bold font**: Used for main text overlays (descriptions, quotes, reasons)
- **Regular font**: Used for segment type indicators

## Fallback System

If the bundled fonts are not available, the system will fall back to:

1. System fonts (Arial on macOS/Windows, DejaVu Sans on Linux)
2. Error handling with detailed logging

## License

These fonts are licensed under the Apache License 2.0 and are freely available for commercial use.
