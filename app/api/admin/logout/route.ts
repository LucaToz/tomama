import { NextResponse } from "next/server";
import { isAuthenticated, logoutAdmin } from "@/lib/auth";

export async function POST() {
  const auth = await isAuthenticated();
  if (!auth) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }
  await logoutAdmin();
  return NextResponse.json({ success: true });
}
