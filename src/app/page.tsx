"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import Link from "next/link";
import { DateRangePicker } from "@/components/DateRangePicker";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { DateRange } from "react-day-picker";
import { useSession, signIn } from "next-auth/react";

type SearchFormData = {
  from: string;
  to: string;
  tripName: string;
};

export default function Home() {
  const [date, setDate] = useState<DateRange | undefined>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchData, setSearchData] = useState<Partial<SearchFormData>>();
  const router = useRouter();
  const { data: session } = useSession();
  
  const { register, handleSubmit } = useForm<SearchFormData>();

  const onSubmit = async (data: SearchFormData) => {
    if (!date?.from || !date?.to) {
      alert("Please select travel dates");
      return;
    }

    if (!session) {
      // Store the form data in sessionStorage before redirecting
      sessionStorage.setItem('pendingTripData', JSON.stringify({
        ...data,
        startDate: date.from,
        endDate: date.to
      }));
      signIn(undefined, { callbackUrl: window.location.href });
      return;
    }

    setSearchData(data);
    setIsDialogOpen(true);
  };

  const createTrip = async (tripName: string) => {
    if (!session) {
      sessionStorage.setItem('pendingTripData', JSON.stringify({
        name: tripName,
        startDate: date?.from,
        endDate: date?.to,
        departureCity: searchData?.from,
        destinationCity: searchData?.to
      }));
      signIn(undefined, { callbackUrl: window.location.href });
      return;
    }

    try {
      const response = await fetch("/api/trips", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: tripName,
          startDate: date?.from,
          endDate: date?.to,
          departureCity: searchData?.from,
          destinationCity: searchData?.to,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create trip");
      }

      const trip = await response.json();
      router.push(`/trips/${trip.id}`);
    } catch (error) {
      console.error("Error creating trip:", error);
      alert("Failed to create trip. Please try again.");
    }
  };

  // Check for pending trip data after sign-in
  useEffect(() => {
    if (session) {
      const pendingData = sessionStorage.getItem('pendingTripData');
      if (pendingData) {
        const data = JSON.parse(pendingData);
        sessionStorage.removeItem('pendingTripData');
        if (data.name) {
          // If we have a name, create the trip directly
          createTrip(data.name);
        } else {
          // Otherwise, set the form data and open the dialog
          setDate({
            from: new Date(data.startDate),
            to: new Date(data.endDate)
          });
          setSearchData({
            from: data.from,
            to: data.to
          });
          setIsDialogOpen(true);
        }
      }
    }
  }, [session]);

  return (
    <main className="flex min-h-screen flex-col items-center">
      {/* Hero Section */}
      <section className="w-full bg-gradient-to-r from-blue-600 to-blue-400 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Plan Your Perfect Trip
            </h1>
            <p className="text-xl md:text-2xl mb-8">
              Create personalized itineraries with AI-powered recommendations
            </p>
          </div>

          {/* Search Box */}
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl p-6 mt-8">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From
                  </label>
                  <Input
                    {...register("from", { required: true })}
                    type="text"
                    placeholder="Departure City"
                    className="w-full"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To
                  </label>
                  <Input
                    {...register("to", { required: true })}
                    type="text"
                    placeholder="Destination City"
                    className="w-full"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dates
                  </label>
                  <DateRangePicker date={date} onDateChange={setDate} />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    &nbsp;
                  </label>
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                    Search
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 w-full">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Search Simply</h3>
              <p className="text-gray-600">
                Find and compare the best travel options in seconds
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Planning</h3>
              <p className="text-gray-600">
                Get personalized itineraries generated by AI
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Save Big</h3>
              <p className="text-gray-600">
                Find the best deals on flights, hotels, and activities
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trip Name Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Name Your Trip</DialogTitle>
            <DialogDescription>
              Give your trip a name to help you identify it later.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const tripName = formData.get("tripName") as string;
            if (tripName) {
              createTrip(tripName);
            }
          }}>
            <div className="grid gap-4 py-4">
              <Input
                name="tripName"
                placeholder="e.g., Summer Vacation 2024"
                required
              />
              <Button type="submit">Create Trip</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
