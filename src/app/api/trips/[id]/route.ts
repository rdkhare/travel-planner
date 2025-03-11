import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "../../auth/[...nextauth]/route";

const prisma = new PrismaClient();

// GET /api/trips/[id] - Get a specific trip
export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  const params = await context.params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const trip = await prisma.trip.findUnique({
      where: {
        id: params.id,
      },
      include: {
        flights: true,
        activities: true,
        accommodations: true,
      },
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // Verify the trip belongs to the current user
    if (trip.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(trip);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch trip" },
      { status: 500 }
    );
  }
}

// PUT /api/trips/[id] - Update a trip
export async function PUT(
  request: Request,
  context: { params: { id: string } }
) {
  const params = await context.params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const trip = await prisma.trip.update({
      where: {
        id: params.id,
      },
      data: {
        title: json.title,
        startDate: new Date(json.startDate),
        endDate: new Date(json.endDate),
        budget: json.budget ? parseFloat(json.budget) : null,
        destination: json.destination,
        departure: json.departure,
      },
    });

    return NextResponse.json(trip);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update trip" },
      { status: 500 }
    );
  }
}

// DELETE /api/trips/[id] - Delete a trip
export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  const params = await context.params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.trip.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete trip" },
      { status: 500 }
    );
  }
} 