import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export async function GET() {
  const cookieStore = await cookies();
  const contractorId = cookieStore.get("contractorId")?.value;
  if (!contractorId) return NextResponse.json({ contractor: null });

  try {
    const contractor = await prisma.contractor.findUnique({ where: { id: contractorId } });
    return NextResponse.json({ contractor });
  } catch (err) {
    console.error("GET /api/me failed:", err);
    return NextResponse.json({ contractor: null });
  }
}
