import asyncio, base64, os, sys
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

PROMPT = (
    "Create a professional ultra-wide banner illustration (aspect ratio about 16:5) in the same style, composition and quality as the reference: "
    "a glowing crystalline BULL on the LEFT (facing right, emerald/mint neon #4ade80 glow, geometric low-poly faceted head with glowing eyes) "
    "and a glowing crystalline BEAR on the RIGHT (facing left, roaring, crimson/rose neon #fb7185 glow). "
    "In the CENTER between them, a neon candlestick chart: green candles rising from the bull side, red candles falling toward the bear side, "
    "with thin wicks and soft glowing wave lines beneath. "
    "COLOR GRADING adapted to a premium fintech website: the background is deep cosmic purple-black (#0b0618 to #1a0f3d) with subtle violet "
    "(#6d3bff / #8b5cff) nebula haze and faint diagonal light streaks, so the green and red neon pops against purple-black. "
    "Cinematic, sharp, high detail, clean edges, no frame border lines around the image, no text, no letters, no logos, no watermark. "
    "Full-bleed artwork that fills the whole canvas edge to edge."
)

def b64(path):
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode()

async def main():
    chat = LlmChat(api_key=os.environ["EMERGENT_LLM_KEY"], session_id=f"banner-gen-{sys.argv[1]}", system_message="You are an image generator")
    chat.with_model("gemini", "gemini-3-pro-image-preview").with_params(modalities=["image", "text"])
    msg = UserMessage(text=PROMPT, file_contents=[ImageContent(b64("/app/memory/assets/ref_bullbear.webp"))])
    text, images = await chat.send_message_multimodal_response(msg)
    print("text:", (text or "")[:100])
    for i, img in enumerate(images or []):
        out = f"/app/memory/assets/banner_raw_{sys.argv[1]}_{i}.png"
        with open(out, "wb") as f:
            f.write(base64.b64decode(img["data"]))
        print("saved", out)

asyncio.run(main())
