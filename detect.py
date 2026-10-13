import json
from graphify.detect import detect
from pathlib import Path
result = detect(Path('supabase/src'))
with open('graphify-out/.graphify_detect.json', 'w') as f:
    json.dump(result, f, indent=2)
print('Done. Code files:', len(result.get('files', {}).get('code', [])))