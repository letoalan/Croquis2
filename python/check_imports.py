import os, re

broken = []
for root, dirs, files in os.walk('.'):
    if any(p in root for p in ['.git', '.idea', 'wiki']): continue
    for f in files:
        if f.endswith('.js'):
            p = os.path.join(root, f)
            with open(p, 'r', encoding='utf-8', errors='replace') as fp:
                content = fp.read()
            for m in re.finditer(r'from\s+[\'"]([^\'"]+)[\'"]', content):
                imp = m.group(1)
                if not imp.startswith('.'): continue
                resolved = os.path.normpath(os.path.join(os.path.dirname(p), imp))
                if not os.path.exists(resolved):
                    broken.append((p, imp, resolved))

print(f"Total broken imports found: {len(broken)}")
for b in broken:
    print(f"File: {b[0]}\n  Import: {b[1]}\n  Target: {b[2]}\n")
