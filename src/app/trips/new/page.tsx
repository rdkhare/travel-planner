"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PlaceAutocomplete from "@/components/PlaceAutocomplete";
import { DateRangePicker } from "@/components/DateRangePicker";
import { DateRange } from "react-day-picker";
import { useSession } from "next-auth/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

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
  const [errorDialog, setErrorDialog] = useState({ isOpen: false, message: "" });

  useEffect(() => {
    // Set initial values from URL parameters if they exist
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (from) {
      setTripData(prev => ({ ...prev, departure: decodeURIComponent(from) }));
    }
    if (to) {
      setTripData(prev => ({ ...prev, destination: decodeURIComponent(to) }));
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
      setErrorDialog({
        isOpen: true,
        message: "Please select trip dates"
      });
      return;
    }

    if (!tripData.departure || !tripData.destination) {
      setErrorDialog({
        isOpen: true,
        message: "Please select both departure and destination airports"
      });
      return;
    }

    if (!tripData.title.trim()) {
      setErrorDialog({
        isOpen: true,
        message: "Please enter a trip name"
      });
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
    <>
      <Dialog open={errorDialog.isOpen} onOpenChange={(open) => setErrorDialog(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <svg
                className="w-6 h-6 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span>Invalid Input</span>
            </DialogTitle>
            <DialogDescription className="text-red-600">
              {errorDialog.message}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Create New Trip</h1>
              <Button
                variant="outline"
                onClick={() => router.push("/trips")}
                className="bg-white border-gray-200 text-gray-900 hover:bg-gray-50"
              >
                Cancel
              </Button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Trip Name
                </label>
                <Input
                  required
                  value={tripData.title}
                  onChange={(e) => setTripData({ ...tripData, title: e.target.value })}
                  placeholder="Enter trip name"
                  className="bg-white border-gray-200 text-gray-900 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
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
                <label className="block text-sm font-medium text-gray-900 mb-1">
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
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Trip Dates
                </label>
                <DateRangePicker
                  date={dateRange}
                  onDateChange={setDateRange}
                  variant="white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Budget (Optional)
                </label>
                <Input
                  type="number"
                  placeholder="Enter budget"
                  value={tripData.budget}
                  onChange={(e) => setTripData({ ...tripData, budget: e.target.value })}
                  className="bg-white border-gray-200 text-gray-900 focus:border-blue-500 max-w-[200px]"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isCreating}
              >
                {isCreating ? "Creating..." : "Create Trip"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
} 