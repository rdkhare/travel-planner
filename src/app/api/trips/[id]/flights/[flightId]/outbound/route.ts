import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// DELETE /api/trips/[id]/flights/[flightId]/outbound - Remove outbound flight from a trip
export async function DELETE(
  request: Request,
  context: { params: { id: string; flightId: string } }
) {
  const params = await context.params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // First verify the flight belongs to the trip and user
    const flight = await prisma.flight.findFirst({
      where: {
        AND: [
          {
            id: params.flightId,
            tripId: params.id,
            trip: {
              userId: session.user.id
            }
          },
          {
            isReturn: false
          }
        ]
      },
      include: {
        returnFlight: true
      }
    });

    if (!flight) {
      return NextResponse.json({ error: "Flight not found" }, { status: 404 });
    }

    // If this flight has a return flight, update it to remove the relationship
    if (flight.returnFlight) {
      await prisma.flight.update({
        where: {
          id: flight.returnFlight.id
        },
        data: {
          outboundFlightId: null
        }
      });
    }

    // Now delete the outbound flight
    await prisma.flight.delete({
      where: {
        id: params.flightId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting outbound flight:", error);
    return NextResponse.json(
      { error: "Failed to delete outbound flight", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 