import { getIntakePreview } from '@/lib/social/intake/service';
import { previewHtml } from '@/lib/social/intake-scheduling/preview-html';
export const dynamic = 'force-dynamic';
export async function GET(req: Request, {params}: {params: Promise<{id:string}>}) {
 const headers = {'Content-Type':'text/html; charset=utf-8','Cache-Control':'private, no-store, max-age=0','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; img-src https: data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"};
 const {id}=await params; const token=new URL(req.url).searchParams.get('token');
 if(!token || token.length>2048) return new Response('Preview unavailable or expired.',{status:404,headers});
 try { return new Response(previewHtml(await getIntakePreview(id,token)),{headers}); }
 catch { return new Response('Preview unavailable or expired. Request a fresh preview in Telegram.',{status:404,headers}); }
}
