// A deliberately simple sign-in: no password, just "who are you" — enough to
// tell contractors apart and keep their saved quotes separate while testing
// with a small group (your brother, uncles, a handful of contractors). This
// is not meant to be public-launch security; swap in real auth (e.g. a magic
// link or NextAuth) before opening this up beyond people you trust.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  const { email, name, company, state } = await request.json();

  if (!email || !name || !state) {
    return NextResponse.json({ error: "Email, name, and state are required." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "That doesn't look like a valid email address." }, { status: 400 });
  }

  try {
    const contractor = await prisma.contractor.upsert({
      where: { email },
      update: { name, company, state },
      create: { email, name, company, state },
    });

    const response = NextResponse.json({ contractor });
    response.cookies.set("contractorId", contractor.id, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 90, // 90 days
      path: "/",
    });
    return response;
  } catch (err) {
    console.error("POST /api/login failed:", err);
    return NextResponse.json(
      { error: "Couldn't reach the database. If this is a fresh deploy, make sure DATABASE_URL is set." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete("contractorId");
  return response;
}
