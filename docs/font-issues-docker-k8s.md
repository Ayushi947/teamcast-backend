# Font Issues in Docker/K8s Deployments

## Problem Overview

The video highlights generation feature in Teamcast backend relies on fonts for text overlays. In Docker and Kubernetes deployments, several font-related issues can occur:

1. **Font Download Failures**: Runtime font downloads can fail due to network restrictions
2. **Font Path Resolution**: Font paths may not resolve correctly in containerized environments
3. **Permission Issues**: Fonts may not be accessible to the `node` user
4. **Missing System Fonts**: Container images may not include necessary system fonts

## Root Causes

### 1. Runtime Font Downloads

- The original code attempted to download fonts at runtime if bundled fonts weren't found
- This can fail in K8s environments with restricted network access
- Network timeouts or DNS issues can cause font download failures

### 2. Font Path Detection

- Font path detection logic didn't prioritize Docker container paths
- Multiple path resolution attempts could fail in containerized environments
- Relative path resolution may not work correctly in different container contexts

### 3. Permission Issues

- Font files copied to containers may not have correct permissions for the `node` user
- File ownership issues can prevent font access
- SELinux or AppArmor restrictions in some K8s environments

### 4. Missing System Fonts

- Alpine Linux base images don't include common fonts by default
- FFmpeg requires specific font formats and paths
- Different Linux distributions have different font locations

## Solutions Implemented

### 1. Improved Font Detection

#### Docker Environment Detection

```typescript
const isDocker =
  process.env.NODE_ENV === 'production' || fs.existsSync('/.dockerenv');
```

#### Prioritized Font Paths for Docker

```typescript
const possiblePaths = isDocker
  ? [
      '/app/assets/fonts/OpenSans-Regular.ttf', // Docker container path (primary)
      path.join(process.cwd(), 'assets', 'fonts', 'OpenSans-Regular.ttf'),
      // ... other paths
    ]
  : [
      // Development paths first
      path.join(process.cwd(), 'assets', 'fonts', 'OpenSans-Regular.ttf'),
      // ... other paths
    ];
```

### 2. System Font Fallbacks

#### Comprehensive System Font Mapping

```typescript
const SYSTEM_FONTS = {
  darwin: {
    regular: '/System/Library/Fonts/Arial.ttf',
    bold: '/System/Library/Fonts/Arial Bold.ttf',
  },
  win32: {
    regular: 'C\\:/Windows/Fonts/arial.ttf',
    bold: 'C\\:/Windows/Fonts/arialbd.ttf',
  },
  linux: {
    regular: '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    bold: '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
  },
};
```

#### Linux Container Fallbacks

```typescript
const linuxFallbacks = [
  '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
  '/usr/share/fonts/TTF/arial.ttf',
  '/usr/share/fonts/truetype/ubuntu/Ubuntu-R.ttf',
];
```

### 3. No-Text Mode

#### Font-Free Operation

- Added `noTextMode` parameter to completely bypass font requirements
- Generates highlights videos without text overlays
- Useful when fonts are completely unavailable

```typescript
export async function generateHighlightsVideo(
  // ... other parameters
  noTextMode: boolean = false
): Promise<string>;
```

#### Fallback Chain

1. Try advanced mode with text overlays
2. Fall back to simple mode without text overlays
3. Fall back to no-text mode (completely font-free)
4. Try different transition types as final fallback

### 4. Dockerfile Improvements

#### System Font Installation

```dockerfile
RUN apk add --no-cache \
    # ... other packages
    fontconfig \
    ttf-dejavu \
    ttf-liberation \
    && fc-cache -fv
```

#### Proper Permissions

```dockerfile
RUN mkdir -p /app/uploads /app/tmp && \
    chown -R node:node /app/uploads /app/tmp /app/assets
```

### 5. Enhanced Font Validation

#### Docker-Specific Validation

```typescript
if (isDocker) {
  logger.info('Docker environment detected, validating font accessibility');

  try {
    if (regularFontExists) {
      await fs.promises.access(regularFontPath, fs.constants.R_OK);
      logger.info('Regular font is readable', { regularFontPath });
    }
    // ... similar for bold font
  } catch (accessError) {
    logger.error('Font access validation failed', {
      error: accessError.message,
    });
  }
}
```

## Testing and Validation

### Font Test Script

Created `scripts/test-fonts-docker.sh` to validate font availability:

```bash
# Test bundled fonts
ls -la /app/assets/fonts/

# Test system fonts
fc-list | head -10

# Test font accessibility
[ -r "/app/assets/fonts/OpenSans-Regular.ttf" ] && echo "✓ Readable" || echo "✗ Not readable"

# Test FFmpeg font detection
ffmpeg -f lavfi -i testsrc=duration=1:size=320x240:rate=1 \
  -vf "drawtext=text='Test':fontfile=/app/assets/fonts/OpenSans-Regular.ttf:fontsize=24:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2" \
  -t 1 -f null -
```

### Usage Examples

#### Testing Font-Free Mode

```typescript
// Test highlights generation without fonts
const result = await testHighlightsVideoGeneration(
  undefined, // storageProvider
  undefined, // sourceVideoPath
  undefined, // sampleHighlightsInstructions
  false, // useSimpleMode
  'crossfade', // transitionType
  true // noTextMode
);
```

#### Production Deployment

```typescript
// In production, use no-text mode as fallback
try {
  return await generateHighlightsVideo(
    storageProvider,
    sourcePath,
    instructions
  );
} catch (error) {
  logger.warn('Font-based highlights failed, trying no-text mode');
  return await generateHighlightsVideo(
    storageProvider,
    sourcePath,
    instructions,
    'highlights.webm',
    false, // useSimpleMode
    'crossfade', // transitionType
    true // noTextMode
  );
}
```

## Monitoring and Debugging

### Logging Improvements

- Enhanced logging for Docker environment detection
- Font path resolution logging
- Font accessibility validation logging
- Fallback chain logging

### Error Handling

- Graceful degradation from advanced → simple → no-text modes
- Detailed error messages for font-related failures
- Automatic fallback to system fonts

### Health Checks

- Font availability checks in container health checks
- FFmpeg font compatibility testing
- Permission validation for font files

## Best Practices

### 1. Container Design

- Always include system fonts in container images
- Set proper file permissions for font directories
- Use multi-stage builds to minimize font-related issues

### 2. Deployment Strategy

- Test font availability in staging environments
- Use no-text mode as production fallback
- Monitor font-related errors in production logs

### 3. Error Handling

- Implement graceful degradation for font failures
- Provide clear error messages for debugging
- Use fallback modes to ensure service availability

### 4. Testing

- Test font availability in target deployment environments
- Validate FFmpeg font compatibility
- Test fallback mechanisms thoroughly

## Troubleshooting

### Common Issues

1. **Font Not Found Errors**

   - Check if bundled fonts are copied to container
   - Verify font file permissions
   - Test system font availability

2. **FFmpeg Font Errors**

   - Validate font file format compatibility
   - Check font path resolution
   - Test with system fonts as fallback

3. **Permission Denied Errors**
   - Verify file ownership in container
   - Check SELinux/AppArmor restrictions
   - Ensure `node` user has read access

### Debug Commands

```bash
# Check font availability in container
docker exec <container> ./scripts/test-fonts-docker.sh

# Test font accessibility
docker exec <container> ls -la /app/assets/fonts/

# Check system fonts
docker exec <container> fc-list

# Test FFmpeg font compatibility
docker exec <container> ffmpeg -f lavfi -i testsrc=duration=1:size=320x240:rate=1 -vf "drawtext=text='Test':fontfile=/app/assets/fonts/OpenSans-Regular.ttf:fontsize=24:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2" -t 1 -f null -
```

## Future Improvements

1. **Font Preloading**: Pre-load and cache fonts at container startup
2. **Font Validation Service**: Dedicated service for font availability testing
3. **Dynamic Font Loading**: Load fonts on-demand with better error handling
4. **Font Format Support**: Support for additional font formats (WOFF, WOFF2)
5. **Font Optimization**: Optimize font files for container environments
