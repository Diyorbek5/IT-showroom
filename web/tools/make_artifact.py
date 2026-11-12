"""dist/index.html dan Artifact sahifasi yasaydi (doctype/html/head/body o'ramlarisiz).

Ishlatish:  npm run build && python3 tools/make_artifact.py
Natija:     dist/artifact.html (+ dist/ ichidagi assets/, hdri/, tex/ fayllari)
"""
import os
import re

root = os.path.join(os.path.dirname(__file__), '..', 'dist')
src = open(os.path.join(root, 'index.html'), encoding='utf-8').read()

head = re.search(r'<head>(.*?)</head>', src, re.S).group(1)
body = re.search(r'<body>(.*?)</body>', src, re.S).group(1)

# Skelet charset va viewport ni o'zi beradi
head = re.sub(r'\s*<meta charset[^>]*>', '', head)
head = re.sub(r'\s*<meta name="viewport"[^>]*>', '', head)
# Vite modul skriptlarini body oxiriga ko'chiramiz (DOM tayyor bo'lgach ishga tushadi)
scripts = re.findall(r'\s*<script type="module"[^>]*></script>', head)
for s in scripts:
    head = head.replace(s, '')
links = re.findall(r'\s*<link rel="modulepreload"[^>]*>', head)
for l in links:
    head = head.replace(l, '')

# <title> fayl boshida bo'lishi kerak
title = re.search(r'\s*<title>.*?</title>', head, re.S).group(0)
head = head.replace(title, '')
out = title.strip() + '\n' + head.strip() + '\n' + body.strip() + '\n' + '\n'.join(s.strip() for s in scripts) + '\n'
open(os.path.join(root, 'artifact.html'), 'w', encoding='utf-8').write(out)

files = []
for d in ('assets', 'hdri', 'tex'):
    for f in sorted(os.listdir(os.path.join(root, d))):
        files.append(f'{d}/{f}')
print('\n'.join(files))
