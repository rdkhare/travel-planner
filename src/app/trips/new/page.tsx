"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PlaceAutocomplete from "@/components/PlaceAutocomplete";
import { DateRangePicker } from "@/components/DateRangePicker";
import { DateRange } from "react-day-picker";

export default function NewTripPage() {
  const router = useRouter();
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

    setIsCreating(true);
    try {
      const response = await fetch("/api/trips", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...tripData,
          startDate: dateRange.from,
          endDate: dateRange.to,
        }),
      });

      if (response.ok) {
        router.push("/trips");
      } else {
        throw new Error("Failed to create trip");
      }
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
              Departure City
            </label>
            <PlaceAutocomplete
              placeholder="Enter departure city"
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
              Destination City
            </label>
            <PlaceAutocomplete
              placeholder="Enter destination city"
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