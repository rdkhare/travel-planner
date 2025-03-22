import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../../../auth/[...nextauth]/route";

// POST /api/trips/[id]/flights - Add a flight to a trip
export async function POST(
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

    // First, delete any existing flights for this trip
    await prisma.flight.deleteMany({
      where: {
        tripId: params.id
      }
    });

    // Create the outbound flight
    const outboundFlight = await prisma.flight.create({
      data: {
        airline: json.airline,
        flightNumber: json.flightNumber,
        departure: new Date(json.departure.time),
        arrival: new Date(json.arrival.time),
        cost: json.cost,
        isBooked: json.isBooked,
        bookingToken: json.bookingToken,
        tripId: params.id,
        isReturn: false
      }
    });

    // Create the return flight
    const returnFlight = await prisma.flight.create({
      data: {
        airline: json.returnFlight.airline,
        flightNumber: json.returnFlight.flightNumber,
        departure: new Date(json.returnFlight.departure.time),
        arrival: new Date(json.returnFlight.arrival.time),
        cost: json.returnFlight.cost,
        isBooked: json.returnFlight.isBooked,
        bookingToken: json.returnFlight.bookingToken,
        tripId: params.id,
        isReturn: true,
        outboundFlightId: outboundFlight.id
      }
    });

    // Return both flights in an array
    return NextResponse.json([
      {
        ...outboundFlight,
        returnFlight: returnFlight
      }
    ]);
  } catch (error) {
    console.error("Error creating flight:", error);
    return NextResponse.json(
      { error: "Failed to create flight", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// DELETE /api/trips/[id]/flights?flightId=xxx - Remove a flight from a trip
export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  const params = await context.params;
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(request.url);
  const flightId = searchParams.get("flightId");

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!flightId) {
    return NextResponse.json(
      { error: "Flight ID is required" },
      { status: 400 }
    );
  }

  try {
    // Delete the flight (this will cascade delete the return flight)
    await prisma.flight.delete({
      where: {
        id: flightId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting flight:", error);
    return NextResponse.json(
      { error: "Failed to delete flight" },
      { status: 500 }
    );
  }
} 