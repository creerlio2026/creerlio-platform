from passlib.context import CryptContext
import bcrypt

REQUIRED_BCRYPT_MAJOR = 4

def verify_crypto_stack():
    version = tuple(map(int, bcrypt.__version__.split(".")))
    if version[0] != REQUIRED_BCRYPT_MAJOR:
        raise RuntimeError(
            f"FATAL: bcrypt {bcrypt.__version__} detected. "
            f"Passlib 1.7.4 REQUIRES bcrypt 4.x. "
            f"Run: pip install bcrypt==4.1.2"
        )

    ctx = CryptContext(schemes=["bcrypt"])
    test = "Keith123"
    h = ctx.hash(test)
    if not ctx.verify(test, h):
        raise RuntimeError("FATAL: bcrypt verification failed")

    print(" Crypto stack verified (bcrypt/passlib OK)")
