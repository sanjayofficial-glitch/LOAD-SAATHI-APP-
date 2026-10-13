import json
from graphify.extract import collect_files, extract
from pathlib import Path

detect = json.loads(open('graphify-out/.graphify_detect.json').read())
code_files = []
for f in detect.get('files', {}).get('code', []):
    code_files.extend(collect_files(Path(f)) if Path(f).is_dir() else [Path(f)])

print(f'Code files to process: {len(code_files)}')

if code_files:
    result = extract(code_files)
    open('graphify-out/.graphify_ast.json', 'w').write(json.dumps(result, indent=2))
    print(f'AST: {len(result["nodes"])} nodes, {len(result["edges"])} edges, {result.get("input_tokens",0)} input tokens, {result.get("output_tokens",0)} output tokens')
else:
    open('graphify-out/.graphify_ast.json', 'w').write(json.dumps({'nodes':[],'edges':[],'input_tokens':0,'output_tokens':0}))
    print('No code files - skipping AST extraction')