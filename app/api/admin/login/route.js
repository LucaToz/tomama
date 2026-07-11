import { NextResponse } from "next/server";
import { loginAdmin } from "@/lib/auth";

export async function POST(req) {
  try {
    const { password } = await req.json();
    const ok = await loginAdmin(password);
    if (ok) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ success: false, error: "Password errata" }, { status: 401 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
