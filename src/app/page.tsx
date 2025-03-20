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
import PlaceAutocomplete from "@/components/PlaceAutocomplete";

type SearchFormData = {
  from: string;
  to: string;
  tripName: string;
};

export default function Home() {
  const [date, setDate] = useState<DateRange | undefined>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [errorDialog, setErrorDialog] = useState({ isOpen: false, message: "" });
  const [searchData, setSearchData] = useState<{
    from: string;
    fromId: string;
    to: string;
    toId: string;
  }>({
    from: "",
    fromId: "",
    to: "",
    toId: "",
  });
  const router = useRouter();
  const { data: session } = useSession();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date?.from || !date?.to) {
      setErrorDialog({
        isOpen: true,
        message: "Please select travel dates"
      });
      return;
    }

    if (!searchData.from || !searchData.to) {
      setErrorDialog({
        isOpen: true,
        message: "Please select both departure and destination cities"
      });
      return;
    }

    if (!session) {
      // Store the form data in sessionStorage before redirecting
      sessionStorage.setItem('pendingTripData', JSON.stringify({
        startDate: date.from,
        endDate: date.to,
        departure: searchData.from,
        destination: searchData.to
      }));
      signIn(undefined, { callbackUrl: window.location.href });
      return;
    }

    // Redirect to the new trip page with the form data
    router.push(`/trips/new?from=${encodeURIComponent(searchData.from)}&to=${encodeURIComponent(searchData.to)}&startDate=${date.from.toISOString()}&endDate=${date.to.toISOString()}`);
  };

  // Check for pending trip data after sign-in
  useEffect(() => {
    if (session) {
      const pendingData = sessionStorage.getItem('pendingTripData');
      if (pendingData) {
        const data = JSON.parse(pendingData);
        sessionStorage.removeItem('pendingTripData');
        // Redirect to the new trip page with the form data
        router.push(`/trips/new?from=${encodeURIComponent(data.departure)}&to=${encodeURIComponent(data.destination)}&startDate=${new Date(data.startDate).toISOString()}&endDate=${new Date(data.endDate).toISOString()}`);
      }
    }
  }, [session]);

  return (
    <main className="flex min-h-screen flex-col items-center">
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
            <form onSubmit={handleSearch}>
              <div className="grid grid-cols-1 md:grid-cols-[1fr,1fr,1.5fr,auto] gap-4">
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From
                  </label>
                  <PlaceAutocomplete
                    placeholder="Departure Airport"
                    onPlaceSelect={(place) => 
                      setSearchData({ 
                        ...searchData, 
                        from: place.name,
                        fromId: place.placeId
                      })
                    }
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To
                  </label>
                  <PlaceAutocomplete
                    placeholder="Destination Airport"
                    onPlaceSelect={(place) => 
                      setSearchData({ 
                        ...searchData, 
                        to: place.name,
                        toId: place.placeId
                      })
                    }
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dates
                  </label>
                  <DateRangePicker date={date} onDateChange={setDate} variant="white" />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    &nbsp;
                  </label>
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6">
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
    </main>
  );
}
