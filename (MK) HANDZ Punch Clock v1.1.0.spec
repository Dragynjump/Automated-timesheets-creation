# -*- mode: python ; coding: utf-8 -*-


a = Analysis(
    ['C:\\Users\\handz\\OneDrive\\デスクトップ\\Timesheets automation project\\Automated timesheets creation\\app.py'],
    pathex=[],
    binaries=[],
    datas=[('C:\\Users\\handz\\OneDrive\\デスクトップ\\Timesheets automation project\\Automated timesheets creation\\static', 'static/'), ('C:\\Users\\handz\\OneDrive\\デスクトップ\\Timesheets automation project\\Automated timesheets creation\\templates', 'templates/')],
    hiddenimports=[],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='(MK) HANDZ Punch Clock v1.1.0',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=['C:\\Users\\handz\\OneDrive\\デスクトップ\\Timesheets automation project\\Automated timesheets creation\\static\\images\\Logo v2 256x256.ico'],
)
