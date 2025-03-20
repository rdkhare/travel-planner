import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// GET /api/trips - Get all trips for the current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    console.error("Error fetching trips:", error);
    return NextResponse.json(
      { error: "Failed to fetch trips", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// POST /api/trips - Create a new trip
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const trip = await prisma.trip.create({
      data: {
        title: json.title || json.name,
        startDate: new Date(json.startDate),
        endDate: new Date(json.endDate),
        departure: json.departure || json.departureCity,
        destination: json.destination || json.destinationCity,
        userId: session.user.id,
      },
    });

    return NextResponse.json(trip);
  } catch (error) {
    console.error("Error creating trip:", error);
    return NextResponse.json(
      { error: "Failed to create trip", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 