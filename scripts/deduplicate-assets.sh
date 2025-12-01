#!/bin/bash

# Create a directory for common assets
ASSETS_DIR="dist/assets"
COMMON_DIR="$ASSETS_DIR/common"
mkdir -p "$COMMON_DIR"

echo "Searching for duplicate files across asset folders..."

# Create temporary directory for file information
TEMP_DIR=$(mktemp -d)
FILE_LIST="$TEMP_DIR/files.txt"
DUPES_LIST="$TEMP_DIR/duplicates.txt"
DIR_LIST="$TEMP_DIR/dirs.txt"

# Find all asset directories (excluding the common directory)
ASSET_DIRS=$(find "$ASSETS_DIR" -maxdepth 1 -type d -not -path "$COMMON_DIR" -not -path "$ASSETS_DIR")
echo "$ASSET_DIRS" > "$DIR_LIST"
TOTAL_DIRS=$(cat "$DIR_LIST" | wc -l)

echo "Found $TOTAL_DIRS asset directories"
echo "Asset directories: $ASSET_DIRS"

# Create a file with filename, directory, and path for all files
find $ASSET_DIRS -type f | while read file; do
  # Get file size
  size=$(stat -c%s "$file")
  
  # Skip very small files (likely not worth deduplicating)
  if [ $size -lt 4096 ]; then
    continue
  fi
  
  # Extract directory containing the file
  dir=$(dirname "$file")
  base_dir=$(echo "$dir" | sed -n "s|$ASSETS_DIR/\([^/]*\).*|\1|p")
  
  # Get filename and relative path
  filename=$(basename "$file")
  rel_path=$(echo "$file" | sed "s|$ASSETS_DIR/$base_dir/||")
  
  echo "$filename|$base_dir|$file|$rel_path|$size" >> "$FILE_LIST"
done

# Debug info - show some sample entries
echo "Sample file entries:"
head -n 5 "$FILE_LIST"

# Find files with the same relative path across all directories
echo "Finding duplicate files with identical paths..."

# First, get all the unique relative paths
cat "$FILE_LIST" | cut -d'|' -f4 | sort | uniq > "$TEMP_DIR/paths.txt"

# For each relative path, check if it exists in all directories
cat "$TEMP_DIR/paths.txt" | while read rel_path; do
  # Skip empty paths
  if [ -z "$rel_path" ]; then
    continue
  fi
  
  # Get count of directories for this path
  dirs_with_path=$(grep "|$rel_path|" "$FILE_LIST" | cut -d'|' -f2 | sort | uniq | wc -l)
  
  # If this path exists in all directories, it's a duplicate
  if [ $dirs_with_path -eq $TOTAL_DIRS ]; then
    # Get filename for this path
    filename=$(basename "$rel_path")
    echo "$filename|$rel_path" >> "$DUPES_LIST"
  fi
done

# If no universal duplicates found, exit
if [ ! -s "$DUPES_LIST" ]; then
  echo "No files found that exist in all asset directories."
  echo "Let's try a less strict approach - files with identical names across directories."
  
  # Alternative approach: find filenames that appear in all directories
  echo "Looking for files with identical names across directories..."
  cat "$FILE_LIST" | cut -d'|' -f1,2 | sort | uniq > "$TEMP_DIR/name_dirs.txt"
  
  # For each filename, count how many different directories it appears in
  cat "$TEMP_DIR/name_dirs.txt" | cut -d'|' -f1 | sort | uniq -c | while read line; do
    count=$(echo "$line" | awk '{print $1}')
    filename=$(echo "$line" | awk '{$1=""; print $0}' | sed 's/^ //')
    
    # If this filename appears in all directories, add it to duplicates list
    if [ $count -eq $TOTAL_DIRS ]; then
      # Get the first file with this name to determine relative path
      first_file=$(grep "^$filename|" "$FILE_LIST" | head -1)
      rel_path=$(echo "$first_file" | cut -d'|' -f4)
      echo "$filename|$rel_path" >> "$DUPES_LIST"
      echo "Found duplicate file: $filename"
    fi
  done
fi

# If still no duplicates, exit
if [ ! -s "$DUPES_LIST" ]; then
  echo "No duplicate files found across all directories."
  rm -rf "$TEMP_DIR"
  exit 0
fi

echo "Found $(cat "$DUPES_LIST" | wc -l) sets of duplicate files"

# Calculate statistics before deduplication
before_size=$(du -sb "$ASSETS_DIR" | cut -f1)

# Process each universal duplicate
cat "$DUPES_LIST" | while read line; do
  filename=$(echo "$line" | cut -d'|' -f1)
  rel_path=$(echo "$line" | cut -d'|' -f2)
  
  # Get all files with this name
  files=$(grep "^$filename|" "$FILE_LIST" | cut -d'|' -f3)
  file_count=$(echo "$files" | wc -l)
  
  # Get first file as source
  source_file=$(echo "$files" | head -1)
  size=$(grep "^$filename.*$source_file" "$FILE_LIST" | cut -d'|' -f5)
  size_kb=$(echo "scale=2; $size/1024" | bc)
  
  echo "Found duplicate in all directories: $filename ($size_kb KB)"
  
  # Create destination path in common directory
  common_path="$COMMON_DIR/$rel_path"
  
  # Create directory structure
  mkdir -p "$(dirname "$common_path")"
  
  # Copy file to common
  cp "$source_file" "$common_path"
  
  # Verify the file was copied successfully
  if [ -f "$common_path" ]; then
    # Remove ALL original files since we now have it in common
    echo "$files" | while read original_file; do
      if [ -f "$original_file" ]; then
        rm -f "$original_file"
        echo "  Removed: $original_file"
      fi
    done
    
    # Total space saved for this file
    saved=$(( ($file_count - 1) * $size ))
    echo "  Saved $(echo "scale=2; $saved/1024" | bc) KB by deduplicating $file_count copies"
  else
    echo "  ERROR: Failed to copy $source_file to common directory. Skipping deletion."
  fi
done

# Calculate statistics after deduplication
after_size=$(du -sb "$ASSETS_DIR" | cut -f1)
total_saved=$(($before_size - $after_size))
total_saved_mb=$(echo "scale=2; $total_saved/1048576" | bc)
common_files=$(find "$COMMON_DIR" -type f | wc -l)

echo "Deduplication complete!"
echo "Total files moved to common directory: $common_files"
echo "Total space saved: $total_saved_mb MB"
echo "Original assets size: $(echo "scale=2; $before_size/1048576" | bc) MB"
echo "New assets size: $(echo "scale=2; $after_size/1048576" | bc) MB"

# Cleanup
rm -rf "$TEMP_DIR"