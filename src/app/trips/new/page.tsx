"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PlaceAutocomplete from "@/components/PlaceAutocomplete";
import { DateRangePicker } from "@/components/DateRangePicker";
import { DateRange } from "react-day-picker";
import { useSession } from "next-auth/react";

export default function NewTripPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [isCreating, setIsCreating] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [tripData, setTripData] = useState({
    title: "",
    departure: "",
    departureId: "",
    destination: "",
    destinationId: "",
    budget: "",
  });

  useEffect(() => {
    // Set initial values from URL parameters if they exist
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (from) {
      setTripData(prev => ({ ...prev, departure: from }));
    }
    if (to) {
      setTripData(prev => ({ ...prev, destination: to }));
    }
    if (startDate && endDate) {
      setDateRange({
        from: new Date(startDate),
        to: new Date(endDate),
      });
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateRange?.from || !dateRange?.to) {
      alert("Please select trip dates");
      return;
    }

    if (!tripData.departure || !tripData.destination) {
      alert("Please select both departure and destination cities");
      return;
    }

    if (!session) {
      // Store the form data in sessionStorage before redirecting
      sessionStorage.setItem('pendingTripData', JSON.stringify({
        title: tripData.title,
        startDate: dateRange.from,
        endDate: dateRange.to,
        departure: tripData.departure,
        destination: tripData.destination
      }));
      router.push('/auth/signin');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/trips", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: tripData.title,
          startDate: dateRange.from,
          endDate: dateRange.to,
          departure: tripData.departure,
          destination: tripData.destination,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create trip");
      }

      const trip = await response.json();
      router.push(`/trips/${trip.id}`);
    } catch (error) {
      console.error("Failed to create trip:", error);
      alert("Failed to create trip. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Create New Trip</h1>
          <Button
            variant="outline"
            onClick={() => router.push("/trips")}
          >
            Cancel
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trip Name
            </label>
            <Input
              required
              value={tripData.title}
              onChange={(e) => setTripData({ ...tripData, title: e.target.value })}
              placeholder="Enter trip name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Departure Airport
            </label>
            <PlaceAutocomplete
              placeholder="Enter departure airport"
              defaultValue={tripData.departure}
              onPlaceSelect={(place) => 
                setTripData({ 
                  ...tripData, 
                  departure: place.name,
                  departureId: place.placeId
                })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Destination Airport
            </label>
            <PlaceAutocomplete
              placeholder="Enter destination airport"
              defaultValue={tripData.destination}
              onPlaceSelect={(place) => 
                setTripData({ 
                  ...tripData, 
                  destination: place.name,
                  destinationId: place.placeId
                })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trip Dates
            </label>
            <DateRangePicker
              date={dateRange}
              onDateChange={setDateRange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Budget (Optional)
            </label>
            <Input
              type="number"
              placeholder="Enter budget"
              value={tripData.budget}
              onChange={(e) => setTripData({ ...tripData, budget: e.target.value })}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isCreating}
          >
            {isCreating ? "Creating..." : "Create Trip"}
          </Button>
        </form>
      </div>
    </div>
  );
} 