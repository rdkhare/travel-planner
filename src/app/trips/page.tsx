"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

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
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Trips</h1>
        <div className="relative">
          <Button 
            onClick={() => router.push('/trips/new')}
            variant="outline"
            className="group relative h-12 w-12 rounded-full bg-white hover:w-[180px] transition-all duration-300 ease-in-out overflow-hidden border border-gray-200 hover:border-gray-300 shadow-md hover:shadow-lg flex items-center justify-center"
          >
            <span className="absolute right-0 top-0 h-full w-12 flex items-center justify-center text-black transition-all duration-300 group-hover:right-auto group-hover:left-0">
              <Plus className="h-6 w-6" />
            </span>
            <span className="absolute right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap text-black">
              Create New Trip
            </span>
          </Button>
        </div>
      </div>

      {trips.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl text-gray-600">No Trips Made</h2>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <div
              key={trip.id}
              className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push(`/trips/${trip.id}`)}
            >
              <h2 className="text-xl font-semibold mb-2">{trip.title}</h2>
              <div className="text-gray-600">
                <p>{trip.departure} → {trip.destination}</p>
                <p className="mt-2">
                  {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 