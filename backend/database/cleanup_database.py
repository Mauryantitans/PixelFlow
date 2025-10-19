#!/usr/bin/env python3
"""
Manual Database Cleanup Script for PixelFlow

Run this script to clean up:
- Expired sessions
- Old uploaded images
- Old processed images
- Orphaned data

Configure cleanup rules in: app/core/business_rules.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.utils.cleanup_service import manual_cleanup

if __name__ == "__main__":
    print("\n🧹 Starting manual database cleanup...")
    print("📋 Cleanup rules from: app/core/business_rules.py\n")
    
    manual_cleanup()
