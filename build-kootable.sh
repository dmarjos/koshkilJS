#!/bin/bash
# Build script for KooTable bundled file
# Concatenates all module files into a single kootable.js

KOOTABLE_DIR="/var/www/daniel/local.devel-sitioya.com.ar/webroot/js/plugins/koshkil/kootable"
OUTPUT_FILE="/var/www/daniel/local.devel-sitioya.com.ar/webroot/js/plugins/koshkil/kootable.js"

echo "Building KooTable bundled file..."

# Header comment with dependencies
cat > "$OUTPUT_FILE" << 'EOF'
//dependencies: main.js pagination.js breakpoints.js objects.js methods.js methods/data.js methods/filters.js methods/events.js sorting.js datastore.js virtualscroll.js tinysort/tinysort.js
EOF

# Concatenate source files in order
cat "$KOOTABLE_DIR/main.js" >> "$OUTPUT_FILE"
cat "$KOOTABLE_DIR/pagination.js" >> "$OUTPUT_FILE"
cat "$KOOTABLE_DIR/breakpoints.js" >> "$OUTPUT_FILE"
cat "$KOOTABLE_DIR/objects.js" >> "$OUTPUT_FILE"
cat "$KOOTABLE_DIR/methods.js" >> "$OUTPUT_FILE"
cat "$KOOTABLE_DIR/methods/data.js" >> "$OUTPUT_FILE"
cat "$KOOTABLE_DIR/methods/filters.js" >> "$OUTPUT_FILE"
cat "$KOOTABLE_DIR/methods/events.js" >> "$OUTPUT_FILE"
cat "$KOOTABLE_DIR/sorting.js" >> "$OUTPUT_FILE"
cat "$KOOTABLE_DIR/datastore.js" >> "$OUTPUT_FILE"
cat "$KOOTABLE_DIR/virtualscroll.js" >> "$OUTPUT_FILE"
cat "$KOOTABLE_DIR/tinysort/tinysort.js" >> "$OUTPUT_FILE"

echo "Build complete: $OUTPUT_FILE"
echo "Total lines: $(wc -l < "$OUTPUT_FILE")"
