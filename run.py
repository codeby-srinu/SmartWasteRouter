import subprocess
import os
import sys
import webbrowser
import time
from http.server import HTTPServer, SimpleHTTPRequestHandler
import threading


# ==========================================
# PROJECT DIRECTORIES
# ==========================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

BACKEND_DIR = os.path.join(BASE_DIR, "backend")
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")


# ==========================================
# 1. RUN PYTHON PREDICTION
# ==========================================

print("\n==========================================")
print(" STEP 1: RUNNING PYTHON PREDICTION")
print("==========================================\n")

subprocess.run(
    [sys.executable, "predict.py"],
    cwd=BACKEND_DIR,
    check=True
)


# ==========================================
# 2. COMPILE JAVA
# ==========================================

print("\n==========================================")
print(" STEP 2: COMPILING JAVA")
print("==========================================\n")

subprocess.run(
    ["javac", "WasteRouter.java"],
    cwd=BACKEND_DIR,
    check=True
)


# ==========================================
# 3. RUN JAVA
# ==========================================

print("\n==========================================")
print(" STEP 3: RUNNING JAVA ROUTER")
print("==========================================\n")

subprocess.run(
    ["java", "backend.WasteRouter"],
    cwd=BASE_DIR,
    check=True
)


# ==========================================
# 4. START FRONTEND SERVER
# ==========================================

print("\n==========================================")
print(" STEP 4: STARTING FRONTEND")
print("==========================================\n")


class FrontendHandler(SimpleHTTPRequestHandler):

    def __init__(self, *args, **kwargs):

        super().__init__(
            *args,
            directory=FRONTEND_DIR,
            **kwargs
        )


server = HTTPServer(
    ("localhost", 8000),
    FrontendHandler
)


# ==========================================
# 5. OPEN BROWSER
# ==========================================

def open_browser():

    time.sleep(1)

    webbrowser.open(
        "http://localhost:8000"
    )


threading.Thread(
    target=open_browser,
    daemon=True
).start()


print("==========================================")
print(" SMART WASTE ROUTER IS RUNNING")
print("==========================================")
print()
print("Dashboard:")
print("http://localhost:8000")
print()
print("Press CTRL+C to stop the server.")
print("==========================================\n")


# ==========================================
# 6. KEEP SERVER RUNNING
# ==========================================

try:

    server.serve_forever()

except KeyboardInterrupt:

    print("\nStopping server...")

    server.server_close()

    print("Server stopped.")