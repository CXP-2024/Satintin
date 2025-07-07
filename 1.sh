#!/bin/bash

# 查找所有.scala和.tsx文件，并检查它们的行数是否大于300
find frontend/src -type f \( -name "*.tsx" \) | while read file; do
    lines=$(wc -l < "$file")
    if [ "$lines" -gt 300 ]; then
        echo "$file has $lines lines"
    fi
done