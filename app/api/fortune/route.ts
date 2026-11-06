import { NextRequest, NextResponse } from "next/server";
import { dailyFortune } from "../../../lib/daily";

// resposta depende de quem pede e de que dia é: nunca pode ser cacheada
export const dynamic = "force-dynamic";

function clientIp(req: NextRequest): string {
  // Atrás de proxy (Vercel, Cloudflare...) o IP real vem no primeiro item do x-forwarded-for.
  // Só confie nisso se existir um proxy de confiança na frente: fora disso o cliente pode forjar.
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "127.0.0.1";
}

export function GET(req: NextRequest) {
  const result = dailyFortune(clientIp(req));
  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store" },
  });
}
