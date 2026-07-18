import asyncio
import sys
from pathlib import Path

# Make sure we import from the bam-api package
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "mini-services" / "bam-api"))

from config import settings
from ai_service import _call_ai


async def main():
    print(f"Provider : {settings.AI_PROVIDER}")
    print(f"Model    : {settings.AI_MODEL}")
    print(f"Base URL : {settings.AI_BASE_URL}")
    key_preview = settings.AI_API_KEY[:8] + "..." if settings.AI_API_KEY else "(EMPTY)"
    print(f"API Key  : {key_preview}")
    print()

    if settings.AI_API_KEY in ("", "PUT_YOUR_GROQ_API_KEY_HERE", "your_groq_api_key_here",
                                "your_gemini_api_key_here"):
        print("❌  API key is still the placeholder. Edit:")
        print(f"    {Path(__file__).resolve().parent.parent / 'mini-services' / 'bam-api' / '.env'}")
        print("  and replace PUT_YOUR_GROQ_API_KEY_HERE with your real key.")
        return 1

    print("Sending a tiny test prompt...")
    reply = await _call_ai(
        prompt="Reply with the single word POW! and nothing else.",
        system="You are a comic-book hero coach. Be concise.",
        max_tokens=20,
    )
    print()
    if reply:
        print(f"✅  AI replied: {reply.strip()!r}")
        print("    Provider integration is working — your BAM! app is now AI-powered.")
        return 0
    print("❌  AI returned empty. Check the server log above for the error.")
    print("    Common causes: wrong key, wrong model name, network/firewall block.")
    return 1


if __name__ == "__main__":
    rc = asyncio.run(main())
    sys.exit(rc)
