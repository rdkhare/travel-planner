"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Trip {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  destination: string;
  departure: string;
  budget: number | null;
}

export default function TripsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newTrip, setNewTrip] = useState({
    title: "",
    startDate: "",
    endDate: "",
    destination: "",
    departure: "",
    budget: "",
  });

  useEffect(() => {
    if (status === "authenticated") {
      fetchTrips();
    } else if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status]);

  const fetchTrips = async () => {
    try {
      const response = await fetch("/api/trips");
      const data = await response.json();
      setTrips(data);
    } catch (error) {
      console.error("Failed to fetch trips:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const response = await fetch("/api/trips", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTrip),
      });

      if (response.ok) {
        const trip = await response.json();
        setTrips([...trips, trip]);
        setNewTrip({
          title: "",
          startDate: "",
          endDate: "",
          destination: "",
          departure: "",
          budget: "",
        });
      }
    } catch (error) {
      console.error("Failed to create trip:", error);
    } finally {
      setIsCreating(false);
    }
  };

  if (status === "loading" || isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Trips</h1>

      {/* Create Trip Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Create New Trip</h2>
        <form onSubmit={handleCreateTrip} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="text"
              placeholder="Trip Title"
              value={newTrip.title}
              onChange={(e) =>
                setNewTrip({ ...newTrip, title: e.target.value })
              }
              required
            />
            <Input
              type="text"
              placeholder="Destination"
              value={newTrip.destination}
              onChange={(e) =>
                setNewTrip({ ...newTrip, destination: e.target.value })
              }
              required
            />
            <Input
              type="text"
              placeholder="Departure City"
              value={newTrip.departure}
              onChange={(e) =>
                setNewTrip({ ...newTrip, departure: e.target.value })
              }
              required
            />
            <Input
              type="number"
              placeholder="Budget"
              value={newTrip.budget}
              onChange={(e) =>
                setNewTrip({ ...newTrip, budget: e.target.value })
              }
            />
            <Input
              type="date"
              value={newTrip.startDate}
              onChange={(e) =>
                setNewTrip({ ...newTrip, startDate: e.target.value })
              }
              required
            />
            <Input
              type="date"
              value={newTrip.endDate}
              onChange={(e) =>
                setNewTrip({ ...newTrip, endDate: e.target.value })
              }
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full md:w-auto"
            disabled={isCreating}
          >
            {isCreating ? "Creating..." : "Create Trip"}
          </Button>
        </form>
      </div>

      {/* Trips List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trips.map((trip) => (
          <div
            key={trip.id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <h3 className="text-xl font-semibold mb-2">{trip.title}</h3>
            <p className="text-gray-600 mb-2">
              {trip.departure} → {trip.destination}
            </p>
            <p className="text-gray-600 mb-2">
              {new Date(trip.startDate).toLocaleDateString()} -{" "}
              {new Date(trip.endDate).toLocaleDateString()}
            </p>
            {trip.budget && (
              <p className="text-gray-600">
                Budget: ${trip.budget.toLocaleString()}
              </p>
            )}
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push(`/trips/${trip.id}`)}
            >
              View Details
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
} 