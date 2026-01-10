"""
Project Health Check - DOE Execution Script
Memeriksa kesehatan proyek dan integritas struktur DOE.
"""

import json
import os
from datetime import datetime
from pathlib import Path

# Base directory
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent


def check_doe_structure():
    """Periksa struktur DOE framework."""
    required_dirs = [
        "directives",
        "execution",
        "execution/data",
        ".agent/workflows"
    ]
    
    required_files = [
        "GEMINI.md",
        "execution/data/learning_database.json"
    ]
    
    results = {
        "directories": {},
        "files": {},
        "score": 0
    }
    
    total_checks = len(required_dirs) + len(required_files)
    passed = 0
    
    # Check directories
    for dir_path in required_dirs:
        full_path = PROJECT_ROOT / dir_path
        exists = full_path.exists() and full_path.is_dir()
        results["directories"][dir_path] = "✅" if exists else "❌"
        if exists:
            passed += 1
    
    # Check files
    for file_path in required_files:
        full_path = PROJECT_ROOT / file_path
        exists = full_path.exists() and full_path.is_file()
        results["files"][file_path] = "✅" if exists else "❌"
        if exists:
            passed += 1
    
    results["score"] = round((passed / total_checks) * 100, 1)
    return results


def check_learning_db():
    """Periksa integritas learning database."""
    db_path = SCRIPT_DIR / "data" / "learning_database.json"
    
    if not db_path.exists():
        return {"status": "❌", "message": "Learning database not found"}
    
    try:
        with open(db_path, "r", encoding="utf-8") as f:
            db = json.load(f)
        
        required_keys = ["version", "error_patterns", "statistics"]
        missing = [k for k in required_keys if k not in db]
        
        if missing:
            return {"status": "⚠️", "message": f"Missing keys: {missing}"}
        
        return {
            "status": "✅",
            "version": db.get("version"),
            "last_updated": db.get("last_updated"),
            "total_patterns": len(db.get("error_patterns", []))
        }
    except json.JSONDecodeError:
        return {"status": "❌", "message": "Invalid JSON format"}


def check_directives():
    """List semua directives yang ada."""
    directives_path = PROJECT_ROOT / "directives"
    
    if not directives_path.exists():
        return {"status": "❌", "count": 0, "files": []}
    
    md_files = list(directives_path.glob("*.md"))
    return {
        "status": "✅" if md_files else "⚠️",
        "count": len(md_files),
        "files": [f.name for f in md_files]
    }


def check_workflows():
    """List semua workflows yang ada."""
    workflows_path = PROJECT_ROOT / ".agent" / "workflows"
    
    if not workflows_path.exists():
        return {"status": "❌", "count": 0, "files": []}
    
    md_files = list(workflows_path.glob("*.md"))
    return {
        "status": "✅" if md_files else "⚠️",
        "count": len(md_files),
        "files": [f.name for f in md_files]
    }


def run_health_check():
    """Jalankan full health check."""
    print("🏥 DOE Project Health Check")
    print("=" * 50)
    print(f"📅 Timestamp: {datetime.now().isoformat()}")
    print(f"📁 Project Root: {PROJECT_ROOT}")
    print()
    
    # DOE Structure
    print("📂 DOE Structure:")
    structure = check_doe_structure()
    for dir_name, status in structure["directories"].items():
        print(f"  {status} {dir_name}/")
    for file_name, status in structure["files"].items():
        print(f"  {status} {file_name}")
    print(f"  Score: {structure['score']}%")
    print()
    
    # Learning Database
    print("🧠 Learning Database:")
    db_status = check_learning_db()
    print(f"  Status: {db_status['status']}")
    for key, value in db_status.items():
        if key != "status":
            print(f"  {key}: {value}")
    print()
    
    # Directives
    print("📋 Directives:")
    directives = check_directives()
    print(f"  Status: {directives['status']}")
    print(f"  Count: {directives['count']}")
    if directives['files']:
        for f in directives['files']:
            print(f"    - {f}")
    print()
    
    # Workflows
    print("⚙️ Workflows:")
    workflows = check_workflows()
    print(f"  Status: {workflows['status']}")
    print(f"  Count: {workflows['count']}")
    if workflows['files']:
        for f in workflows['files']:
            print(f"    - {f}")
    
    print()
    print("=" * 50)
    overall = "✅ HEALTHY" if structure["score"] >= 80 else "⚠️ NEEDS ATTENTION"
    print(f"Overall Status: {overall}")
    
    return {
        "structure": structure,
        "learning_db": db_status,
        "directives": directives,
        "workflows": workflows
    }


if __name__ == "__main__":
    run_health_check()
