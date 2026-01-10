"""
Error Logger - DOE Execution Script
Mencatat error ke learning database untuk self-annealing.
"""

import json
import os
from datetime import datetime
from pathlib import Path

# Path ke learning database
SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR / "data"
LEARNING_DB_PATH = DATA_DIR / "learning_database.json"


def load_learning_db():
    """Load learning database dari file."""
    if LEARNING_DB_PATH.exists():
        with open(LEARNING_DB_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {
        "version": "1.0.0",
        "error_patterns": [],
        "automated_fixes": [],
        "success_patterns": [],
        "statistics": {
            "total_errors_logged": 0,
            "total_auto_fixes_applied": 0,
            "fix_success_rate": 0
        }
    }


def save_learning_db(db):
    """Save learning database ke file."""
    db["last_updated"] = datetime.now().isoformat()
    with open(LEARNING_DB_PATH, "w", encoding="utf-8") as f:
        json.dump(db, f, indent=2, ensure_ascii=False)


def log_error(error_type: str, error_message: str, context: dict = None, fix_applied: str = None):
    """
    Log error ke learning database.
    
    Args:
        error_type: Kategori error (e.g., 'import_error', 'api_error', 'syntax_error')
        error_message: Pesan error lengkap
        context: Context tambahan (file, function, dll)
        fix_applied: Fix yang diterapkan (jika ada)
    """
    db = load_learning_db()
    
    error_entry = {
        "id": len(db["error_patterns"]) + 1,
        "timestamp": datetime.now().isoformat(),
        "type": error_type,
        "message": error_message,
        "context": context or {},
        "fix_applied": fix_applied,
        "resolved": fix_applied is not None
    }
    
    db["error_patterns"].append(error_entry)
    db["statistics"]["total_errors_logged"] += 1
    
    if fix_applied:
        db["statistics"]["total_auto_fixes_applied"] += 1
        
        # Update success rate
        total = db["statistics"]["total_errors_logged"]
        fixed = db["statistics"]["total_auto_fixes_applied"]
        db["statistics"]["fix_success_rate"] = round((fixed / total) * 100, 2)
    
    save_learning_db(db)
    print(f"✅ Error logged: {error_type}")
    return error_entry


def find_similar_error(error_message: str, threshold: float = 0.85):
    """
    Cari error serupa di database.
    
    Returns:
        List of similar errors dengan confidence score >= threshold
    """
    db = load_learning_db()
    similar = []
    
    for pattern in db["error_patterns"]:
        if pattern.get("resolved") and pattern.get("fix_applied"):
            # Simple similarity check (bisa ditingkatkan dengan NLP)
            if error_message.lower() in pattern["message"].lower() or \
               pattern["message"].lower() in error_message.lower():
                similar.append({
                    "pattern": pattern,
                    "confidence": 0.90,
                    "suggested_fix": pattern["fix_applied"]
                })
    
    return [s for s in similar if s["confidence"] >= threshold]


def get_statistics():
    """Get statistik dari learning database."""
    db = load_learning_db()
    return db["statistics"]


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="DOE Error Logger")
    parser.add_argument("--log", nargs=2, metavar=("TYPE", "MESSAGE"), 
                       help="Log new error")
    parser.add_argument("--find", metavar="MESSAGE",
                       help="Find similar errors")
    parser.add_argument("--stats", action="store_true",
                       help="Show statistics")
    
    args = parser.parse_args()
    
    if args.log:
        log_error(args.log[0], args.log[1])
    elif args.find:
        results = find_similar_error(args.find)
        if results:
            print(f"Found {len(results)} similar errors:")
            for r in results:
                print(f"  - {r['pattern']['type']}: {r['suggested_fix']}")
        else:
            print("No similar errors found.")
    elif args.stats:
        stats = get_statistics()
        print("📊 Learning Database Statistics:")
        for key, value in stats.items():
            print(f"  {key}: {value}")
    else:
        parser.print_help()
