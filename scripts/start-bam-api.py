#!/usr/bin/env python3
"""Start the BAM! FastAPI server as a true daemon (double-fork) so it survives
the parent bash session exiting.
"""
import os
import sys
import subprocess
from pathlib import Path

API_DIR = Path(__file__).resolve().parent.parent / "mini-services" / "bam-api"
LOG = API_DIR / "server.log"
PID_FILE = API_DIR / "server.pid"


def main():
    os.chdir(API_DIR)
    # Double-fork
    if os.fork() > 0:
        sys.exit(0)
    os.setsid()
    if os.fork() > 0:
        sys.exit(0)
    # Redirect stdio
    sys.stdin = open("/dev/null", "r")
    sys.stdout = open(LOG, "w")
    sys.stderr = sys.stdout
    # Exec uvicorn
    os.execvp("python3", ["python3", "-m", "uvicorn", "main:app",
                          "--host", "127.0.0.1", "--port", "8001"])


if __name__ == "__main__":
    pid = os.fork()
    if pid == 0:
        main()
    else:
        # Parent waits briefly then writes pid file
        import time
        time.sleep(0.5)
        # Find uvicorn process
        result = subprocess.run(["pgrep", "-f", "uvicorn main:app"],
                                capture_output=True, text=True)
        pids = result.stdout.strip().split("\n")
        if pids and pids[0]:
            with open(PID_FILE, "w") as f:
                f.write(pids[0])
            print(f"Started uvicorn (PID {pids[0]})")
        else:
            print("Could not find uvicorn PID — check server.log")
