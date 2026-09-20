"""Helper to drive the Vercel REST API for deploying Rasa.

Reads tokens from the repo-root secrets.json (gitignored).
Usage: python scripts/vercel_api.py project get|create|env|inspect <args...>
"""
from __future__ import annotations

import json
import subprocess
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def secrets() -> dict:
    return json.loads((ROOT / "secrets.json").read_text())


def api(method: str, path: str, body: dict | None = None) -> dict:
    req = urllib.request.Request(
        f"https://api.vercel.com{path}",
        method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={
            "Authorization": f"Bearer {secrets()['VERCEL_TOKEN']}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req) as res:
            raw = res.read().decode()
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as err:
        return {"_http_error": err.code, "_body": err.read().decode()}


def main() -> None:
    cmd, *args = sys.argv[1:]

    if cmd == "project-create":
        payload = {
            "name": args[0],
            "framework": None,
            "rootDirectory": args[1] if len(args) > 1 else None,
        }
        print(json.dumps(api("POST", "/v9/projects", payload)))

    elif cmd == "project-get":
        print(json.dumps(api("GET", f"/v9/projects/{args[0]}")))

    elif cmd == "env-add":
        project, key, value, *targets = args
        payload = {
            "key": key,
            "value": value,
            "type": "encrypted",
            "target": targets or ["production", "preview", "development"],
        }
        print(json.dumps(api("POST", f"/v10/projects/{project}/env", payload)))

    elif cmd == "env-rm":
        project, key = args
        env = api("GET", f"/v9/projects/{project}/env")
        if "_http_error" in env:
            print(json.dumps(env))
            return
        for item in env.get("envs", []):
            if item.get("key") == key:
                print(json.dumps(api("DELETE", f"/v8/projects/{project}/env/{item['id']}")))
                return
        print(json.dumps({"error": "env key not found"}))

    elif cmd == "verify-domain":
        project, domain = args
        print(
            json.dumps(
                api(
                    "POST",
                    f"/v10/projects/{project}/domains",
                    {"name": domain.replace("https://", "").rstrip("/")},
                )
            )
        )

    elif cmd == "deploy-cli":
        directory, project = args
        cmdline = [
            "vercel",
            "deploy",
            "--prod",
            "--yes",
            "--project",
            project,
            "--token",
            secrets()["VERCEL_TOKEN"],
        ]
        proc = subprocess.run(cmdline, capture_output=True, text=True, cwd=str(ROOT / directory))
        sys.stdout.write(proc.stdout)
        sys.stderr.write(proc.stderr)
        print(f"EXIT={proc.returncode}")


main() if __name__ == "__main__" else None