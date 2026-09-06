import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export async function GET() {
  const cookieStore = await cookies();
  const contractorId = cookieStore.get("contractorId")?.value;
  if (!contractorId) return NextResponse.json({ quotes: [] });

  const quotes = await prisma.quote.findMany({
    where: { contractorId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ quotes });
}

export async function POST(request) {
  const cookieStore = await cookies();
  const contractorId = cookieStore.get("contractorId")?.value;
  if (!contractorId) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const body = await request.json();
  const quote = await prisma.quote.create({
    data: {
      contractorId,
      jobType: body.jobType,
      state: body.state,
      inputs: body.inputs,
      materials: body.materials,
      labor: body.labor,
      overhead: body.overhead,
      profit: body.profit,
      total: body.total,
    },
  });
  return NextResponse.json({ quote });
}
