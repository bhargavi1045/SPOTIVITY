export async function GET(req) {
    const url = new URL(req.url);
    const lang = url.searchParams.get("lang") || "es";
  
    const response = await fetch(`http://xxxxxxx.ngrok-free.app/translate?lang=${lang}`);
    const data = await response.json();
  
    return Response.json({ translated_lyrics: data.translated_lyrics });
  }
  