#!/usr/bin/env bash
set -euo pipefail
log_file="$(mktemp "${RUNNER_TEMP:-/tmp}/registromedia-android-build.XXXXXX")"
if gradle --project-dir android --no-daemon --console=plain assembleDebug lintDebug 2>&1 | tee "$log_file"; then
  exit 0
fi
# SDK/build diagnostics contain no user data or credentials. Expose the reason
# as an Actions annotation, so failures are diagnosable on public job pages.
python3 - "$log_file" <<'PY'
import pathlib,sys
text=pathlib.Path(sys.argv[1]).read_text(errors='replace')
start=text.find('FAILURE:')
message=(text[start:] if start>=0 else text[-6000:])[-6000:]
message=message.replace('%','%25').replace('\r','%0D').replace('\n','%0A')
print('::error title=Android build failed::'+message)
PY
exit 1
