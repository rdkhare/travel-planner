import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "../auth/[...nextauth]/route";

const prisma = new PrismaClient();

// GET /api/trips - Get all trips for the current user
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const trips = await prisma.trip.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        flights: true,
        activities: true,
        accommodations: true,
      },
    });

    return NextResponse.json(trips);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch trips" },
      { status: 500 }
    );
  }
}

// POST /api/trips - Create a new trip
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const trip = await prisma.trip.create({
      data: {
        title: json.name,
        startDate: new Date(json.startDate),
        endDate: new Date(json.endDate),
        departure: json.departureCity,
        destination: json.destinationCity,
        userId: session.user.id,
      },
    });

    return NextResponse.json(trip);
  } catch (error) {
    console.error("Error creating trip:", error);
    return NextResponse.json(
      { error: "Failed to create trip" },
      { status: 500 }
    );
  }
} 