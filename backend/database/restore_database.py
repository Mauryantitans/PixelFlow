#!/usr/bin/env python3
"""
Database Restore Script for PixelFlow

This script restores a PostgreSQL or SQLite database from a backup file.
USE WITH CAUTION: This will overwrite your current database!
"""

import os
import sys
import subprocess
from pathlib import Path
from dotenv import load_dotenv
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

# Settings
BACKUP_DIR = Path(__file__).parent / "backups"
DATABASE_URL = os.environ.get("DATABASE_URL")
USE_SQLITE = os.environ.get("USE_SQLITE", "False").lower() == "true"


def list_available_backups():
    """List all available backup files"""
    if not BACKUP_DIR.exists():
        logger.error("❌ Backup directory not found!")
        return []
    
    sqlite_backups = sorted(
        BACKUP_DIR.glob("pixelflow_sqlite_backup_*.db"),
        key=lambda x: x.stat().st_mtime,
        reverse=True
    )
    
    postgres_backups = sorted(
        BACKUP_DIR.glob("pixelflow_backup_*.sql"),
        key=lambda x: x.stat().st_mtime,
        reverse=True
    )
    
    return sqlite_backups, postgres_backups


def restore_sqlite(backup_file: Path):
    """Restore SQLite database from backup"""
    sqlite_path = Path(__file__).parent / "pixelflow.db"
    
    logger.info(f"🔄 Restoring SQLite database...")
    logger.info(f"📁 Source: {backup_file}")
    logger.info(f"📁 Destination: {sqlite_path}")
    
    # Backup current database first
    if sqlite_path.exists():
        backup_current = sqlite_path.with_suffix('.db.backup')
        logger.info(f"⚠️  Creating safety backup of current database...")
        try:
            import shutil
            shutil.copy2(sqlite_path, backup_current)
            logger.info(f"   Safety backup: {backup_current}")
        except Exception as e:
            logger.error(f"❌ Failed to create safety backup: {e}")
            return False
    
    try:
        import shutil
        shutil.copy2(backup_file, sqlite_path)
        
        logger.info(f"✅ SQLite database restored successfully!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Restore failed: {e}")
        # Try to restore from safety backup
        if backup_current.exists():
            logger.info("🔄 Attempting to restore from safety backup...")
            try:
                shutil.copy2(backup_current, sqlite_path)
                logger.info("✅ Original database restored from safety backup")
            except:
                pass
        return False


def restore_postgresql(backup_file: Path):
    """Restore PostgreSQL database from backup"""
    if not DATABASE_URL or DATABASE_URL.startswith("sqlite"):
        logger.error("❌ Invalid PostgreSQL DATABASE_URL!")
        return False
    
    # Parse DATABASE_URL
    try:
        url = DATABASE_URL.replace("postgresql://", "")
        user_pass, host_db = url.split("@")
        user, password = user_pass.split(":")
        host_port_db = host_db.split("/")
        host_port = host_port_db[0].split(":")
        
        db_user = user
        db_pass = password
        db_host = host_port[0]
        db_port = host_port[1] if len(host_port) > 1 else "5432"
        db_name = host_port_db[1]
        
    except Exception as e:
        logger.error(f"❌ Failed to parse DATABASE_URL: {e}")
        return False
    
    logger.info(f"🔄 Restoring PostgreSQL database: {db_name}")
    logger.info(f"📁 Backup file: {backup_file}")
    logger.info(f"⚠️  WARNING: This will DROP all existing tables!")
    
    # Set password environment variable
    env = os.environ.copy()
    env["PGPASSWORD"] = db_pass
    
    try:
        # Run psql to restore
        result = subprocess.run(
            [
                "psql",
                "-h", db_host,
                "-p", db_port,
                "-U", db_user,
                "-d", db_name,
                "-f", str(backup_file),
            ],
            env=env,
            capture_output=True,
            text=True,
            check=True
        )
        
        logger.info(f"✅ PostgreSQL database restored successfully!")
        return True
        
    except subprocess.CalledProcessError as e:
        logger.error(f"❌ Restore failed: {e.stderr}")
        return False
    except FileNotFoundError:
        logger.error("❌ psql not found!")
        logger.error("Make sure PostgreSQL client tools are installed and in PATH.")
        return False


def main():
    """Main restore function"""
    logger.info("\n" + "="*70)
    logger.info("PixelFlow Database Restore")
    logger.info("="*70)
    
    # List available backups
    sqlite_backups, postgres_backups = list_available_backups()
    
    if USE_SQLITE:
        logger.info("\n📍 Current Database Type: SQLite")
        if not sqlite_backups:
            logger.error("\n❌ No SQLite backup files found!")
            logger.info(f"Backup directory: {BACKUP_DIR}")
            sys.exit(1)
        
        logger.info(f"\n📦 Available SQLite backups ({len(sqlite_backups)}):")
        for i, backup in enumerate(sqlite_backups, 1):
            size = backup.stat().st_size / 1024
            logger.info(f"  {i}. {backup.name} ({size:.2f} KB)")
        
        logger.info("\n⚠️  WARNING: This will overwrite your current database!")
        choice = input("\nEnter backup number to restore (or 'q' to quit): ").strip()
        
        if choice.lower() == 'q':
            logger.info("❌ Restore cancelled")
            return
        
        try:
            idx = int(choice) - 1
            if 0 <= idx < len(sqlite_backups):
                backup_file = sqlite_backups[idx]
                
                confirm = input(f"\n⚠️  Restore from '{backup_file.name}'? (yes/no): ").strip().lower()
                if confirm == 'yes':
                    success = restore_sqlite(backup_file)
                    if success:
                        logger.info("\n" + "="*70)
                        logger.info("🎉 RESTORE COMPLETED SUCCESSFULLY")
                        logger.info("="*70)
                        logger.info("\n🔄 Restart your application to use the restored database")
                else:
                    logger.info("❌ Restore cancelled")
            else:
                logger.error("❌ Invalid backup number")
        except ValueError:
            logger.error("❌ Invalid input")
    
    else:
        logger.info("\n📍 Current Database Type: PostgreSQL")
        if not postgres_backups:
            logger.error("\n❌ No PostgreSQL backup files found!")
            logger.info(f"Backup directory: {BACKUP_DIR}")
            sys.exit(1)
        
        logger.info(f"\n📦 Available PostgreSQL backups ({len(postgres_backups)}):")
        for i, backup in enumerate(postgres_backups, 1):
            size = backup.stat().st_size / 1024
            logger.info(f"  {i}. {backup.name} ({size:.2f} KB)")
        
        logger.info("\n⚠️  WARNING: This will DROP all existing tables and data!")
        choice = input("\nEnter backup number to restore (or 'q' to quit): ").strip()
        
        if choice.lower() == 'q':
            logger.info("❌ Restore cancelled")
            return
        
        try:
            idx = int(choice) - 1
            if 0 <= idx < len(postgres_backups):
                backup_file = postgres_backups[idx]
                
                confirm = input(f"\n⚠️  Restore from '{backup_file.name}'? Type 'yes' to confirm: ").strip().lower()
                if confirm == 'yes':
                    success = restore_postgresql(backup_file)
                    if success:
                        logger.info("\n" + "="*70)
                        logger.info("🎉 RESTORE COMPLETED SUCCESSFULLY")
                        logger.info("="*70)
                        logger.info("\n🔄 Restart your application to use the restored database")
                else:
                    logger.info("❌ Restore cancelled")
            else:
                logger.error("❌ Invalid backup number")
        except ValueError:
            logger.error("❌ Invalid input")


if __name__ == "__main__":
    main()
