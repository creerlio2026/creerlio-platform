import sys, site, pkgutil
from passlib.context import CryptContext
import bcrypt, passlib

print("\n=== PYTHON RUNTIME ===")
print("Executable:", sys.executable)
print("Version:", sys.version)

print("\n=== SITE-PACKAGES ===")
for p in site.getsitepackages():
    print("-", p)

print("\n=== BCRYPT / PASSLIB VERSIONS ===")
print("bcrypt version:", getattr(bcrypt, "__version__", "UNKNOWN"))
print("bcrypt file:", bcrypt.__file__)
print("passlib version:", passlib.__version__)
print("passlib file:", passlib.__file__)

print("\n=== DUPLICATE BCRYPT CHECK ===")
found = []
for m in pkgutil.iter_modules():
    if m.name == "bcrypt":
        found.append(m.module_finder.path)

if found:
    for f in found:
        print("bcrypt found in:", f)
else:
    print("No duplicate bcrypt modules found")

print("\n=== PASSLIB BACKEND DETECTION ===")
ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
handler = ctx.handler("bcrypt")
print("Passlib bcrypt backend:", handler)

print("\n=== PASSWORD TEST (SHORT PASSWORD) ===")
pwd = "Keith123"
print("Password:", pwd)
print("Password length:", len(pwd))
print("Password byte length:", len(pwd.encode("utf-8")))

try:
    h = ctx.hash(pwd)
    print("Hash OK:", h[:30] + "...")
    assert ctx.verify(pwd, h)
    print("Verify OK")
except Exception as e:
    print(" ERROR DURING HASH:", repr(e))

print("\n=== DIAGNOSTIC COMPLETE ===")
