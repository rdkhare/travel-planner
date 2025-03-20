import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// POST /api/trips/[id]/flights - Add a flight to a trip
export async function POST(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tripId = context.params.id;
    
    // Verify trip exists and belongs to user
    const trip = await prisma.trip.findUnique({
      where: {
        id: tripId,
        userId: session.user.id,
      },
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    const flightData = await request.json();
    
    // Create the flight record
    const flight = await prisma.flight.create({
      data: {
        tripId,
        airline: flightData.airline,
        flightNumber: flightData.flightNumber,
        departure: new Date(flightData.departureTime),
        arrival: new Date(flightData.arrivalTime),
        cost: flightData.cost,
      },
    });

    return NextResponse.json(flight);
  } catch (error) {
    console.error("Error saving flight:", error);
    return NextResponse.json(
      { error: "Failed to save flight", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// DELETE /api/trips/[id]/flights - Remove a flight from a trip
export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tripId = context.params.id;
    const { searchParams } = new URL(request.url);
    const flightId = searchParams.get('flightId');

    if (!flightId) {
      return NextResponse.json({ error: "Flight ID is required" }, { status: 400 });
    }

    // Verify trip exists and belongs to user
    const trip = await prisma.trip.findUnique({
      where: {
        id: tripId,
        userId: session.user.id,
      },
      include: {
        flights: {
          where: {
            id: flightId
          }
        }
      }
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    if (trip.flights.length === 0) {
      return NextResponse.json({ error: "Flight not found" }, { status: 404 });
    }

    // Delete the flight
    await prisma.flight.delete({
      where: {
        id: flightId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting flight:", error);
    return NextResponse.json(
      { error: "Failed to delete flight", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 