#!/usr/bin/env python3
"""muse-gui relay server (stdlib only).

Bridges the browser chat UI to the `muse` CLI:
  - serves index.html at /
  - POST /api/chat: `/...` inputs run the matching muse subcommand
    directly (or explain when it is terminal-only); anything else runs
    `muse exec --json <passthrough args>` and returns the assistant
    text plus the session id.
All muse flags passed to `muse-gui` (except --port/--host/--no-open)
are forwarded to every `muse exec` call.
"""
import json
import os
import re
import shlex
import shutil
import subprocess
import sys
import time
import urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

HOST = os.environ.get("MUSE_GUI_HOST", "127.0.0.1")
PORT = int(os.environ.get("MUSE_GUI_PORT", "8765"))
MUSE_ARGS = shlex.split(os.environ.get("MUSE_GUI_ARGS", ""))
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INDEX_FILE = os.path.join(BASE_DIR, "index.html")


def _gui_version():
    try:
        with open(os.path.join(BASE_DIR, "VERSION")) as f:
            return f.read().strip() or "dev"
    except OSError:
        return "dev"


GUI_VERSION = _gui_version()

UI_COMMANDS = [
    {"cmd": "/new", "desc": "새 대화 시작 (세션 초기화)"},
    {"cmd": "/clear", "desc": "화면 지우기 (로컬 표시만)"},
    {"cmd": "/copy", "desc": "마지막 답변 클립보드 복사"},
    {"cmd": "/help", "desc": "사용 가능한 슬래시 명령 보기"},
]

# GUI에서 의미를 살린 슬래시만 유지한다. 순수 TUI 전용 흐름
# (rename/rewind/subagents/goal/cron/feedback/questions/tasks/stop/
# theme/rules/voice/init/login/logout)은 목록에서 제거한다.
# (deny 항목은 입력 시에도 차단되므로 안전하다.)
TUI_SLASH = [
    ("resume", "Resume an earlier session"),
    ("deep-research", "Research across sources with citations"),
    ("model", "Choose model/settings"),
    ("effort", "Set reasoning effort"),
    ("export", "Save the conversation"),
    ("copy", "Copy a response or code block"),
    ("recap", "Recap recent activity"),
    ("skills", "Browse and use skills"),
    ("status", "Show session status"),
    ("usage", "Show session usage/cost"),
    ("plan", "Show subscription plan"),
    ("permissions", "Manage approvals"),
    ("memory", "Summarize conversation to free context"),
    ("clear", "Clear and start fresh"),
    ("quit", "Quit"),
    ("exit", "Quit when idle"),
    ("help", "Show help"),
]

# GUI에서 의미를 살린 대체 안내만 유지한다.
TUI_ONLY_HINT = {
    "resume": "터미널에서 `muse resume --last`로 이어받으세요.",
    "deep-research": "채팅으로 직접 질문하세요 (동일 엔진이 답변합니다).",
    "recap": "채팅으로 \"지금까지 대화 요약해줘\"라고 요청하세요.",
    "permissions": "실행 시 `muse-gui --approval-mode ...`로 지정하세요.",
    "memory": "채팅으로 \"대화 요약해줘\"라고 요청하세요.",
}

# 세션별 사용량 원장: sid -> {"turns": n, "models": {model: {...}}}
# 서버 재시작에도 유지되도록 디스크에 영속화한다.
USAGE = {}
USAGE_FILE = os.path.join(BASE_DIR, "usage.json")


def load_usage():
    try:
        with open(USAGE_FILE) as f:
            data = json.load(f)
        if isinstance(data, dict):
            USAGE.update(data)
    except (OSError, ValueError):
        pass


def save_usage():
    try:
        with open(USAGE_FILE, "w") as f:
            json.dump(USAGE, f)
    except OSError:
        pass


def record_usage(sid, payload):
    if not sid:
        return
    load_usage()
    entry = USAGE.setdefault(sid, {"turns": 0, "models": {}})
    entry["turns"] += 1
    for m in payload.get("models", []) or []:
        name = m.get("model") or "unknown"
        acc = entry["models"].setdefault(
            name, {"calls": 0, "input": 0, "output": 0, "reasoning": 0})
        acc["calls"] += m.get("calls", 0) or 0
        acc["input"] += m.get("input_tokens", 0) or 0
        acc["output"] += m.get("output_tokens", 0) or 0
        acc["reasoning"] += m.get("reasoning_tokens", 0) or 0
    save_usage()


load_usage()


def format_session_usage(sid):
    if not sid or sid not in USAGE or not USAGE[sid]["turns"]:
        return "```\n[사용량 없음] 이 세션의 모델 턴이 없습니다.\n```"
    entry = USAGE[sid]
    w = 44
    bar = "+" + "-" * (w - 1) + "+"

    def row(t):
        return "| " + t.ljust(w - 3) + "|"

    tot_in = sum(m["input"] for m in entry["models"].values())
    tot_out = sum(m["output"] for m in entry["models"].values())
    lines = [bar, row("세션 사용량 (%d 턴, 토큰 기준)" % entry["turns"]), bar]
    for name, a in entry["models"].items():
        lines.append(row(name[:w - 3]))
        lines.append(row("  calls %d | in %d | out %d | r %d"
                         % (a["calls"], a["input"], a["output"],
                            a["reasoning"])))
    lines += [bar,
              row("합계 in %d / out %d" % (tot_in, tot_out)),
              row("비용: 가격 소스 없음 (토큰만 표시)"),
              bar]
    return "```\n" + "\n".join(lines) + "\n```"


# GUI 부가가치가 있는 것만 직접 매핑(기본값·JSON 가공·안내문).
# config/schema 등은 발견 기반 제네릭 실행으로 처리하므로 여기 추가 불필요.
def _direct_argv(name, args):
    if name == "plan":
        return ["usage"] + args
    if name == "sessions":
        return ["sessions", "--json"]
    if name == "skills":
        return ["skills"] + (args or ["list"])
    if name == "model-profile":
        return ["model-profile"] + (args or ["show"])
    return None


def cli_command_names():
    return {n for n, _ in muse_subcommands()}


_HELP_CACHE = {"at": 0.0, "items": None}
_HELP_TTL = 300


def muse_subcommands():
    """`muse --help`의 Commands 섹션에서 (이름, 설명) 목록을 읽는다.

    매 채팅마다 실행하면 낭비라 5분 TTL로 캐시한다."""
    now = time.monotonic()
    if _HELP_CACHE["items"] is not None and now - _HELP_CACHE["at"] < _HELP_TTL:
        return _HELP_CACHE["items"]
    try:
        proc = subprocess.run(["muse", "--help"], capture_output=True,
                              text=True, timeout=30)
    except Exception:
        return _HELP_CACHE["items"] or []
    out, in_cmds = [], False
    for line in (proc.stdout or "").splitlines():
        s = line.strip()
        if s == "Commands:":
            in_cmds = True
            continue
        if in_cmds and (s.startswith("Options:") or s.startswith("Safety")):
            break
        if not in_cmds or not s:
            continue
        parts = s.split(None, 1)
        if len(parts) == 2 and parts[0].startswith(tuple("abcdefghijklmnopqrstuvwxyz")):
            out.append((parts[0], parts[1]))
    if out:
        _HELP_CACHE.update(at=now, items=out)
    return out or _HELP_CACHE["items"] or []


def slash_command_list():
    """자동완성용 전체 목록: UI + TUI 슬래시 + muse 하위 명령(중복 제외)."""
    items = list(UI_COMMANDS)
    seen = {c["cmd"] for c in items}
    for name, desc in TUI_SLASH:
        if ("/" + name) not in seen:
            items.append({"cmd": "/" + name, "desc": desc})
            seen.add("/" + name)
    for name, desc in muse_subcommands():
        if ("/" + name) not in seen:
            items.append({"cmd": "/" + name, "desc": desc + " (CLI)"})
            seen.add("/" + name)
    return items


ANSI_RE = re.compile(r"\x1b\[[0-9;?]*[A-Za-z]|\x1b[()][0-9A-Z]|\x1b[=>]")


def clean_ansi(s):
    return ANSI_RE.sub("", s)


# 발견 기반 실행에서 제외하는 명령. 사유: 인증 변경(login/logout/auth),
# 데몬·터미널 바인딩(serve/attach/acp/mxp), 작업공간 기록(init),
# 타 세션 부작용(session-message). 이 목록은 의미 범주 기준이라
# muse-code 업데이트에 손댈 필요 없이 유지된다.
DENY_SLASH = {
    "login": "터미널에서 `muse login`으로 실행하세요 (기기 승인 흐름이라 GUI에서 불가).",
    "logout": "자격 증명이 삭제되므로 GUI에서 실행하지 않습니다. 터미널에서 `muse logout`.",
    "auth": "자격 증명 변경이라 GUI에서 실행하지 않습니다. 터미널에서 `muse auth`.",
    "serve": "세션 호스트 데몬이라 GUI에서 실행하지 않습니다.",
    "attach": "터미널 바인딩이라 GUI에서 실행하지 않습니다.",
    "acp": "에디터용 프로토콜 서버라 GUI에서 실행하지 않습니다.",
    "mxp": "실행 프로토콜 서버라 GUI에서 실행하지 않습니다.",
    "init": "작업공간 파일을 쓰므로 GUI에서 실행하지 않습니다. 터미널에서 `muse init --dry-run`으로 미리보기.",
    "session-message": "다른 세션에 메시지를 보내므로 GUI에서 실행하지 않습니다.",
}


def mcp_allowed(args):
    # 읽기(list/get/도움말)만 통과, 추가·로그인 등 변경은 차단.
    if not args or (args and args[0] in ("list", "get", "-h", "--help")):
        return True
    return False


def run_muse_direct(argv):
    """TTY 없는 하위 명령을 실행하고 출력 텍스트를 돌려준다."""
    try:
        proc = subprocess.run(["muse"] + argv, capture_output=True,
                              text=True, timeout=120, cwd=os.getcwd(),
                              stdin=subprocess.DEVNULL)
    except FileNotFoundError:
        return "muse 실행 파일을 찾을 수 없습니다 (PATH 확인)."
    except subprocess.TimeoutExpired:
        return "시간 초과 (120s): muse %s" % " ".join(argv)
    out = clean_ansi(proc.stdout or "").strip()
    err = clean_ansi(proc.stderr or "").strip()
    if name_of(argv) == "sessions" and out.startswith("{"):
        return format_sessions(out) + (("\n" + err) if err and not out else "")
    text = out or err or "(출력 없음)"
    if proc.returncode != 0:
        text = "종료 코드 %d\n%s" % (proc.returncode, text)
    return text.strip()


def name_of(argv):
    return argv[0] if argv and not argv[0].startswith("-") else ""


def format_sessions(raw):
    try:
        data = json.loads(raw).get("sessions", [])
    except json.JSONDecodeError:
        return raw
    if not data:
        return "실행 중인 세션 없음"
    lines = []
    for s in data:
        lines.append("- %s (%s) · %s · %s" % (
            s.get("name", "?"), str(s.get("sessionId", "?"))[:8],
            s.get("workspaceLabel", "?"), s.get("openedBy", "?")))
    return "실행 중 세션 %d개:\n%s" % (len(lines), "\n".join(lines))


def read_auth_meta():
    cfg = os.environ.get("XDG_CONFIG_HOME") or os.path.join(
        os.path.expanduser("~"), ".config")
    try:
        with open(os.path.join(cfg, "muse", "auth.json")) as f:
            d = json.load(f)
        m = (d.get("providers") or {}).get("meta") or {}
        return m if isinstance(m, dict) else {}
    except (OSError, ValueError):
        return {}


def mask_token(t):
    if not isinstance(t, str) or len(t) <= 8:
        return "없음"
    return t[:4] + "…" + t[-4:]


def read_settings():
    cfg = os.environ.get("XDG_CONFIG_HOME") or os.path.join(
        os.path.expanduser("~"), ".config")
    try:
        with open(os.path.join(cfg, "muse", "settings.json")) as f:
            return json.load(f)
    except (OSError, ValueError):
        return {}


EFFORTS = ["none", "minimal", "low", "medium", "high", "xhigh", "max",
           "ultra"]
BUILTIN_MODELS = ["muse-spark-1.3", "muse-spark-1.3-contributor",
                  "muse-ember-1.0", "muse-spark-1.2",
                  "muse-spark-1.2-contributor"]
STATE_FILE = os.path.join(BASE_DIR, "state.json")


def flag_value(args, *names):
    for i, a in enumerate(args):
        for n in names:
            if a == n and i + 1 < len(args):
                return args[i + 1]
            if a.startswith(n + "="):
                return a.split("=", 1)[1]
    return None


def default_state():
    st = read_settings()
    model = (flag_value(MUSE_ARGS, "--model") or st.get("model")
             or "muse-spark-1.3")
    efforts = st.get("model_reasoning_efforts", {}) or {}
    effort = (flag_value(MUSE_ARGS, "--reasoning-effort", "--effort")
              or efforts.get(model) or "high")
    return {"model": model, "effort": effort}


STATE = default_state()
try:
    with open(STATE_FILE) as f:
        saved = json.load(f)
    if isinstance(saved, dict):
        if saved.get("model") and not flag_value(MUSE_ARGS, "--model"):
            STATE["model"] = saved["model"]
        if saved.get("effort") in EFFORTS and not flag_value(
                MUSE_ARGS, "--reasoning-effort", "--effort"):
            STATE["effort"] = saved["effort"]
except (OSError, ValueError):
    pass


def save_state():
    try:
        with open(STATE_FILE, "w") as f:
            json.dump(STATE, f)
    except OSError:
        pass


def list_models():
    prov = flag_value(MUSE_ARGS, "--provider")
    cmd = (["muse", "exec", "--list-models"]
           + (["--provider", prov] if prov else []))
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True,
                              timeout=30, stdin=subprocess.DEVNULL)
        models = [l.strip() for l in (proc.stdout or "").splitlines()
                  if l.strip() and " " not in l.strip()
                  and ":" not in l.strip()]
        if models:
            return {"models": models, "source": "muse-code"}
    except (OSError, subprocess.TimeoutExpired):
        pass
    return {"models": list(BUILTIN_MODELS), "source": "builtin"}


SID_RE = re.compile(r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$")


def sessions_root():
    base = os.environ.get("XDG_DATA_HOME") or os.path.join(
        os.path.expanduser("~"), ".local", "share")
    return os.path.join(base, "muse", "sessions")


def running_session_ids():
    try:
        proc = subprocess.run(["muse", "sessions", "--json"],
                              capture_output=True, text=True, timeout=30,
                              stdin=subprocess.DEVNULL)
    except (OSError, subprocess.TimeoutExpired):
        return set()
    try:
        data = json.loads(proc.stdout or "{}")
    except json.JSONDecodeError:
        return set()
    return {s.get("sessionId") for s in data.get("sessions", [])
            if isinstance(s, dict)}


def usage_report():
    """로컬 원장 집계 + 구독 allowance. 실패해도 원장은 돌려준다."""
    try:
        with open(USAGE_FILE) as f:
            data = json.load(f)
        if not isinstance(data, dict):
            data = {}
    except (OSError, ValueError):
        data = {}
    turns, models, sessions = 0, {}, []
    for sid, e in data.items():
        if not isinstance(e, dict):
            continue
        t = e.get("turns", 0) or 0
        turns += t
        for name, a in (e.get("models") or {}).items():
            if not isinstance(a, dict):
                continue
            acc = models.setdefault(
                name, {"calls": 0, "input": 0, "output": 0, "reasoning": 0})
            for k in ("calls", "input", "output", "reasoning"):
                acc[k] += a.get(k, 0) or 0
        sessions.append({"sid": sid, "turns": t,
                         "models": e.get("models") or {}})
    allowance = None
    try:
        proc = subprocess.run(["muse", "usage", "--json"],
                              capture_output=True, text=True, timeout=30,
                              stdin=subprocess.DEVNULL)
        allowance = json.loads(proc.stdout or "{}")
    except (OSError, subprocess.TimeoutExpired, ValueError):
        allowance = None
    return {"turns": turns, "models": models, "sessions": sessions,
            "allowance": allowance}


def delete_session(sid):
    """실제 세션 로그 디렉터리를 삭제한다. 실행 중 세션은 거부한다."""
    if not isinstance(sid, str) or not SID_RE.match(sid):
        return False, "세션 id 형식이 아닙니다."
    if sid in running_session_ids():
        return False, "실행 중인 세션이라 삭제하지 않습니다. 터미널에서 종료 후 다시 시도하세요."
    root = os.path.realpath(sessions_root())
    found = None
    for dirpath, dirnames, _ in os.walk(root):
        if sid in dirnames:
            found = os.path.join(dirpath, sid)
            break
        dirnames[:] = [d for d in dirnames
                       if d not in ("subagent", "tool-outputs")]
    if found is None:
        return False, "세션 기록을 찾지 못했습니다 (이미 삭제됨)."
    real = os.path.realpath(found)
    if not (real + os.sep).startswith(root + os.sep):
        return False, "안전 검사 실패: 세션 경로가 저장소 밖입니다."
    try:
        shutil.rmtree(real)
    except OSError as e:
        return False, "삭제 실패: %s" % e
    return True, "세션 기록 삭제됨: %s" % real


def dispatch_slash(message, session_id):
    """슬래시 입력 처리. (handled, session_id, text)를 돌려준다."""
    parts = message[1:].split()
    if not parts:
        return True, session_id, "슬래시 명령을 입력하세요. 예: /usage (/help 참고)"
    name, args = parts[0], parts[1:]
    if name == "new":
        return True, None, "__NEW__"
    if name in ("quit", "exit"):
        return True, session_id, "GUI에는 종료할 TUI가 없습니다. 브라우저 탭을 닫으세요."
    if name == "copy":
        return True, session_id, "__COPY__"
    if name == "help":
        lines = ["세션 기준: /usage(세션 사용량), /status, /export, "
                 "/model, /effort, /copy, /new, /clear"]
        lines.append("그 외 /명령은 muse-code에 직접 실행 후 결과 표시 "
                     "(차단: 로그인·로그아웃·인증·서버·터미널 바인딩·init·타세션).")
        lines.append("구독 플랜: /plan")
        lines.append("")
        for c in slash_command_list():
            lines.append("%s — %s" % (c["cmd"], c["desc"]))
        return True, session_id, "\n".join(lines)
    if name == "usage":
        # TUI /usage와 동일: 세션 사용량/비용. 구독 플랜은 /plan.
        return True, session_id, format_session_usage(session_id)
    if name == "status":
        s = (session_id or "없음 (아직 대화 없음)")
        u = USAGE.get(session_id, {"turns": 0, "models": {}}) if session_id else None
        turns = u["turns"] if u else 0
        tot_in = sum(m["input"] for m in u["models"].values()) if u else 0
        tot_out = sum(m["output"] for m in u["models"].values()) if u else 0
        text = ("세션: %s\n턴: %d\n토큰: in %d / out %d\n모델: %s / effort: %s\n작업 폴더: %s"
                % (s, turns, tot_in, tot_out, STATE.get("model"),
                   STATE.get("effort"), os.getcwd()))
        return True, session_id, "```\n" + text + "\n```"
    if name == "export":
        if not session_id:
            return True, session_id, (
                "내보낼 세션이 없습니다. 먼저 대화를 시작하세요.")
        import time
        out = "/tmp/muse-gui-export-%s-%d.json" % (
            session_id[:8], int(time.time()))
        text = run_muse_direct(["export", "--session", session_id,
                                "--out", out])
        try:
            size = os.path.getsize(out)
            text += "\n파일: %s (%d bytes)" % (out, size)
        except OSError:
            text += "\n파일 확인 실패: %s" % out
        return True, session_id, text
    if name == "model":
        if args:
            STATE["model"] = args[0]
            save_state()
            return True, session_id, "모델 전환: %s (다음 턴부터 적용)" % args[0]
        st = read_settings()
        return True, session_id, "모델: %s (provider: %s)" % (
            STATE.get("model", "?"), st.get("provider", "?"))
    if name == "effort":
        if args:
            if args[0] not in EFFORTS:
                return True, session_id, (
                    "알 수 없는 effort: %s\n가능: %s"
                    % (args[0], ", ".join(EFFORTS)))
            STATE["effort"] = args[0]
            save_state()
            return True, session_id, "effort 전환: %s (다음 턴부터 적용)" % args[0]
        return True, session_id, "effort(%s): %s" % (
            STATE.get("model", "?"), STATE.get("effort", "?"))
    if name == "plan":
        text = run_muse_direct(["usage"] + args)
        text += ("\n(구독 플랜 조회입니다. 현재 세션 사용량은 /usage 참고)")
        return True, session_id, text
    argv = _direct_argv(name, args)
    if argv is not None:
        text = run_muse_direct(argv)
        if name == "model-profile" and "required" in text and not args:
            text += "\n사용법: /model-profile show <모델ID>"
        return True, session_id, text
    if name in DENY_SLASH:
        return True, session_id, "/%s: %s" % (name, DENY_SLASH[name])
    if name == "mcp" and not mcp_allowed(args):
        return True, session_id, ("/mcp: 읽기(list/get)만 GUI에서 실행합니다. "
                                  "추가·로그인은 터미널에서 `muse mcp`.")
    if name == "resume":
        # 제네릭 실행 시 "Failed to initialize input reader"라서 안내로 대체.
        return True, session_id, ("/resume: %s" % TUI_ONLY_HINT["resume"])
    cli = cli_command_names()
    if name in cli:
        # 발견 기반 제네릭 실행: muse-code 업데이트에 새로 생기는 하위 명령도
        # 코드 변경 없이 그대로 동작한다. stdin 차단+타임아웃+ANSI 제거.
        if name == "mcp":
            return True, session_id, run_muse_direct(["mcp"] + args)
        return True, session_id, run_muse_direct([name] + args)
    if name in TUI_ONLY_HINT:
        return True, session_id, "/%s: %s" % (name, TUI_ONLY_HINT[name])
    tui_names = {n for n, _ in TUI_SLASH}
    if name in tui_names:
        return True, session_id, "/%s: TUI에서만 지원됩니다." % name
    return True, session_id, (
        "알 수 없는 명령: /%s\n사용 가능한 명령은 /help 로 확인하세요." % name)


def run_muse_exec(prompt, session_id=None):
    """Run `muse exec --json` and collect the assistant text."""
    cmd = ["muse", "exec", "--json"] + MUSE_ARGS
    # --model/--reasoning-effort는 meta·local에서만 유효하므로
    # echo 등 다른 프로바이더에서는 붙이지 않는다.
    prov = (flag_value(MUSE_ARGS, "--provider")
            or read_settings().get("provider") or "meta")
    if prov in ("meta", "local"):
        if not flag_value(MUSE_ARGS, "--model") and STATE.get("model"):
            cmd += ["--model", STATE["model"]]
        if (not flag_value(MUSE_ARGS, "--reasoning-effort", "--effort")
                and STATE.get("effort")):
            cmd += ["--reasoning-effort", STATE["effort"]]
    if session_id:
        cmd += ["--session-id", session_id]
    cmd.append(prompt)
    try:
        proc = subprocess.run(
            cmd, capture_output=True, text=True, timeout=600, cwd=os.getcwd()
        )
    except FileNotFoundError:
        return None, "muse 실행 파일을 찾을 수 없습니다 (PATH 확인)."
    except subprocess.TimeoutExpired:
        return session_id, "시간 초과 (600s): muse exec가 끝나지 않았습니다."

    texts, sid = [], session_id
    for line in (proc.stdout or "").splitlines():
        line = line.strip()
        if not line.startswith("{"):
            continue
        try:
            ev = json.loads(line)
        except json.JSONDecodeError:
            continue
        stream = ev.get("stream", {}) or {}
        if stream.get("kind") == "session" and stream.get("id"):
            sid = stream["id"]
        payload = ev.get("payload", {}) or {}
        if payload.get("kind") == "run_output_delta" and payload.get("text"):
            texts.append(payload["text"])
        if payload.get("kind") == "run_usage":
            record_usage(sid, payload)
    text = "".join(texts).strip()
    if proc.returncode != 0 and not text:
        err = (proc.stderr or "").strip()[-2000:]
        return sid, "muse exec 실패 (exit %d)%s" % (
            proc.returncode, ("\n" + err) if err else "")
    return sid, text or "(빈 응답)"


class Handler(BaseHTTPRequestHandler):
    server_version = "muse-gui/1.0"

    def log_message(self, fmt, *args):
        sys.stderr.write("muse-gui: " + fmt % args + "\n")

    def _send(self, code, body, ctype="application/json; charset=utf-8"):
        data = body.encode("utf-8") if isinstance(body, str) else body
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        path = urllib.parse.urlparse(self.path).path
        if path in ("/", "/index.html"):
            try:
                with open(INDEX_FILE, "rb") as f:
                    data = f.read()
            except OSError:
                self._send(500, "index.html 없음")
                return
            data = data.replace(b"__GUI_VERSION__",
                                GUI_VERSION.encode("ascii"))
            self._send(200, data, "text/html; charset=utf-8")
        elif path.startswith("/static/"):
            name = path[len("/static/"):]
            if "/" in name or name not in ("app.js", "style.css"):
                self._send(404, "not found")
            else:
                ctype = ("text/javascript; charset=utf-8"
                         if name.endswith(".js")
                         else "text/css; charset=utf-8")
                try:
                    with open(os.path.join(BASE_DIR, "static", name),
                              "rb") as f:
                        data = f.read()
                except OSError:
                    self._send(404, "not found")
                    return
                self._send(200, data, ctype)
        elif path == "/api/info":
            try:
                ver = subprocess.run(
                    ["muse", "--version"], capture_output=True,
                    text=True, timeout=30).stdout.strip()
            except Exception:
                ver = "unknown"
            self._send(200, json.dumps({
                "version": ver, "gui": GUI_VERSION, "port": PORT,
                "muse_args": MUSE_ARGS, "cwd": os.getcwd(),
                "model": STATE.get("model"), "effort": STATE.get("effort"),
            }, ensure_ascii=False))
        elif path == "/api/slash":
            self._send(200, json.dumps(slash_command_list(),
                                      ensure_ascii=False))
        elif path == "/api/usage":
            self._send(200, json.dumps(usage_report(),
                                      ensure_ascii=False))
        elif path == "/api/models":
            self._send(200, json.dumps(list_models(),
                                      ensure_ascii=False))
        elif path == "/api/account":
            m = read_auth_meta()
            if not m:
                self._send(200, json.dumps({"ok": False,
                                            "error": "no login"}))
            else:
                self._send(200, json.dumps({
                    "ok": True, "provider": "meta",
                    "email": m.get("user_email") or "?",
                    "name": m.get("user_full_name") or "?",
                    "mechanism": m.get("mechanism") or "?",
                    "subs_active": bool(m.get("subs_active")),
                    "token_masked": mask_token(m.get("api_key")),
                }, ensure_ascii=False))
        else:
            self._send(404, "not found")

    def do_POST(self):
        path = urllib.parse.urlparse(self.path).path
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            length = 0
        try:
            body = json.loads(self.rfile.read(length).decode("utf-8") or "{}")
        except (json.JSONDecodeError, UnicodeDecodeError):
            self._send(400, json.dumps({"ok": False, "error": "bad json"}))
            return
        if path == "/api/account/token":
            m = read_auth_meta()
            tok = m.get("api_key") if isinstance(m, dict) else None
            if not tok:
                self._send(200, json.dumps({"ok": False,
                                            "error": "no token"}))
            else:
                self._send(200, json.dumps({"ok": True, "token": tok}))
            return
        if path == "/api/prefs":
            model = body.get("model")
            effort = body.get("effort")
            if model is not None:
                if not isinstance(model, str) or not model.strip():
                    self._send(400, json.dumps({"ok": False,
                                                "error": "bad model"}))
                    return
                STATE["model"] = model.strip()
            if effort is not None:
                if effort not in EFFORTS:
                    self._send(400, json.dumps({"ok": False,
                                                "error": "bad effort",
                                                "allowed": EFFORTS}))
                    return
                STATE["effort"] = effort
            save_state()
            self._send(200, json.dumps({"ok": True, "model": STATE["model"],
                                        "effort": STATE["effort"]}))
            return
        if path == "/api/session/delete":
            ok, msg = delete_session(body.get("session_id") or "")
            self._send(200, json.dumps({"ok": ok, "text": msg},
                                      ensure_ascii=False))
            return
        if path != "/api/chat":
            self._send(404, "not found")
            return
        message = (body.get("message") or "").strip()
        session_id = body.get("session_id") or None
        if not message:
            self._send(400, json.dumps({"ok": False, "error": "empty"}))
            return
        if message.startswith("/"):
            _, sid, text = dispatch_slash(message, session_id)
            if text == "__NEW__":
                self._send(200, json.dumps({"ok": True, "new_session": True,
                                            "text": "새 대화를 시작합니다.",
                                            "session_id": None}))
            else:
                self._send(200, json.dumps({"ok": True, "text": text,
                                            "session_id": sid},
                                           ensure_ascii=False))
            return
        sid, text = run_muse_exec(message, session_id)
        self._send(200, json.dumps({"ok": True, "text": text,
                                    "session_id": sid}, ensure_ascii=False))


def main():
    addr = (HOST, PORT)
    try:
        httpd = ThreadingHTTPServer(addr, Handler)
    except OSError as e:
        sys.stderr.write("muse-gui: 포트 바인드 실패 %s:%d (%s)\n"
                         % (HOST, PORT, e))
        sys.exit(1)
    print("muse-gui: http://%s:%d/ (muse args: %s)"
          % (HOST, PORT, " ".join(MUSE_ARGS) or "(없음)"), flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()

