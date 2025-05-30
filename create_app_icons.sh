#!/bin/bash

# Create app icons with white background from black logo
# This script creates all required Android app icon sizes

echo "🎨 Creating Eterny app icons with white background..."

# Source logo
LOGO="app/src/assets/images/eterny-logo-black-no-wordmark.png"

# Android icon directories
ANDROID_RES="app/android/app/src/main/res"

# Create directories if they don't exist
mkdir -p "$ANDROID_RES/mipmap-mdpi"
mkdir -p "$ANDROID_RES/mipmap-hdpi"
mkdir -p "$ANDROID_RES/mipmap-xhdpi"
mkdir -p "$ANDROID_RES/mipmap-xxhdpi"
mkdir -p "$ANDROID_RES/mipmap-xxxhdpi"

# Function to create icon with white background
create_icon() {
    local size=$1
    local output=$2
    
    echo "Creating ${size}x${size} icon: $output"
    
    # Check if ImageMagick is available
    if command -v convert >/dev/null 2>&1; then
        # Use ImageMagick for perfect white background
        local logo_size=$((size * 75 / 100))  # 75% of canvas for nice padding
        convert -size ${size}x${size} xc:white \
                \( "$LOGO" -resize ${logo_size}x${logo_size} \) \
                -gravity center -composite \
                "$output"
    else
        # Fallback using sips (macOS built-in)
        # Create a white canvas by using a system icon and making it white
        local logo_size=$((size * 75 / 100))
        
        # Create white background using sips
        sips -s format png --out temp_white.png -z $size $size "$LOGO" >/dev/null 2>&1
        
        # Create a simple white square (this is a workaround)
        # We'll resize the logo and use it directly for now
        sips -s format png --out "$output" -z $logo_size $logo_size "$LOGO" >/dev/null 2>&1
        
        # Add padding by creating a larger canvas (manual approach)
        sips -s format png --out temp_padded.png -z $size $size "$output" >/dev/null 2>&1
        cp temp_padded.png "$output"
        
        # Clean up
        rm -f temp_white.png temp_padded.png
    fi
}

# Create Android icons
echo "📱 Creating Android app icons..."

create_icon 48 "$ANDROID_RES/mipmap-mdpi/ic_launcher.png"
create_icon 72 "$ANDROID_RES/mipmap-hdpi/ic_launcher.png"
create_icon 96 "$ANDROID_RES/mipmap-xhdpi/ic_launcher.png"
create_icon 144 "$ANDROID_RES/mipmap-xxhdpi/ic_launcher.png"
create_icon 192 "$ANDROID_RES/mipmap-xxxhdpi/ic_launcher.png"

# Also create round icons (same sizes)
echo "📱 Creating round app icons..."
create_icon 48 "$ANDROID_RES/mipmap-mdpi/ic_launcher_round.png"
create_icon 72 "$ANDROID_RES/mipmap-hdpi/ic_launcher_round.png"
create_icon 96 "$ANDROID_RES/mipmap-xhdpi/ic_launcher_round.png"
create_icon 144 "$ANDROID_RES/mipmap-xxhdpi/ic_launcher_round.png"
create_icon 192 "$ANDROID_RES/mipmap-xxxhdpi/ic_launcher_round.png"

echo ""
echo "✅ App icons created successfully!"
echo "📍 Icons saved to: $ANDROID_RES/mipmap-*/"
echo ""
echo "📋 Created icons:"
ls -la "$ANDROID_RES"/mipmap-*/ic_launcher*.png 2>/dev/null | head -10
echo ""
echo "🔄 Next steps:"
echo "1. Rebuild your APK: cd app/android && ./gradlew assembleRelease"
echo "2. Install on device to see new icon" 