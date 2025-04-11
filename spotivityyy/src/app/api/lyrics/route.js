export async function GET() {
    const response = await fetch("http://xxxxxxx.ngrok-free.app/get_lyrics");
    const data = await response.json();
    return Response.json({ lyrics: data.lyrics });
  }
  