import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export async function GET() {
  const cookieStore = await cookies();
  const contractorId = cookieStore.get("contractorId")?.value;
  if (!contractorId) return NextResponse.json({ quotes: [] });

  try {
    const quotes = await prisma.quote.findMany({
      where: { contractorId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ quotes });
  } catch (err) {
    console.error("GET /api/quotes failed:", err);
    return NextResponse.json(
      { error: "Couldn't load your quotes right now. Is the database connected?" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const cookieStore = await cookies();
  const contractorId = cookieStore.get("contractorId")?.value;
  if (!contractorId) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const body = await request.json();
  const required = ["jobType", "state", "inputs", "materials", "labor", "overhead", "profit", "total"];
  const missing = required.filter((k) => body[k] === undefined || body[k] === null);
  if (missing.length) {
    return NextResponse.json({ error: `Missing fields: ${missing.join(", ")}` }, { status: 400 });
  }

  try {
    const quote = await prisma.quote.create({
      data: {
        contractorId,
        jobType: body.jobType,
        state: body.state,
        inputs: body.inputs,
        customerName: body.customerName || null,
        jobAddress: body.jobAddress || null,
        materials: body.materials,
        labor: body.labor,
        overhead: body.overhead,
        profit: body.profit,
        total: body.total,
      },
    });
    return NextResponse.json({ quote });
  } catch (err) {
    console.error("POST /api/quotes failed:", err);
    return NextResponse.json(
      { error: "Couldn't save that quote right now. Is the database connected?" },
      { status: 500 }
    );
  }
}
