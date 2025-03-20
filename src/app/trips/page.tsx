"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Plane, Home, Calendar, Loader2, Ticket } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [error, setError] = useState<string | null>(null);
  const [tripToDelete, setTripToDelete] = useState<Trip | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetchTrips();
    } else if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status]);

  const fetchTrips = async () => {
    try {
      setError(null);
      const response = await fetch("/api/trips");
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          router.push('/auth/signin');
          return;
        }
        throw new Error(errorData.error || 'Failed to fetch trips');
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        console.error("Unexpected response format:", data);
        throw new Error('Invalid response format from server');
      }
      setTrips(data);
    } catch (error: any) {
      console.error("Failed to fetch trips:", error);
      setError(error.message || 'Failed to fetch trips');
      setTrips([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTrip = async (trip: Trip) => {
    try {
      const response = await fetch(`/api/trips/${trip.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete trip');
      }

      // Remove the trip from the local state
      setTrips(trips.filter(t => t.id !== trip.id));
      setTripToDelete(null);
    } catch (error) {
      console.error('Failed to delete trip:', error);
      // You might want to show an error message to the user here
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
          <p className="mt-2 text-sm text-gray-500">Loading your trips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 sm:px-6 py-8">
        {error && (
          <div className="w-full max-w-7xl mx-auto mb-8 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100">
            {error}
          </div>
        )}
        <div className="w-full max-w-7xl mx-auto flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Trips</h1>
          <div className="relative">
            <Button 
              onClick={() => router.push('/trips/new')}
              variant="outline"
              className="group relative h-12 w-12 rounded-full bg-white hover:w-[180px] transition-all duration-300 ease-in-out overflow-hidden border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md flex items-center justify-center cursor-pointer"
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
          <div className="w-full max-w-7xl mx-auto bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="max-w-sm mx-auto">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-xl font-medium text-gray-900 mb-2">No trips yet</h2>
              <p className="text-gray-500 mb-6">Create your first trip to get started with your travel planning.</p>
              <Button 
                onClick={() => router.push('/trips/new')}
                className="w-full cursor-pointer"
              >
                Create Your First Trip
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-7xl mx-auto">
            <div className={`grid gap-4 sm:gap-6 ${
              trips.length === 1 ? 'grid-cols-1' : 
              trips.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 
              'grid-cols-1 sm:grid-cols-2'
            } auto-rows-fr`}>
              {trips.map((trip) => (
                <div
                  key={trip.id}
                  className="w-full group relative bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer"
                >
                  <div 
                    className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTripToDelete(trip);
                    }}
                  >
                    <button className="p-2 rounded-full bg-white hover:bg-red-500 shadow-sm hover:shadow-md transition-all duration-200 group/delete cursor-pointer">
                      <Trash2 className="h-4 w-4 text-gray-500 group-hover/delete:text-white transition-colors" />
                    </button>
                  </div>
                  <div
                    className="p-4 sm:p-6 h-full flex flex-col"
                    onClick={() => router.push(`/trips/${trip.id}`)}
                  >
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate pr-2">{trip.title}</h2>
                    </div>
                    <div className="space-y-4 sm:space-y-5 flex-grow">
                      <div className="w-full flex text-gray-600 text-sm">
                        <div className="flex">
                          <div className="flex flex-col items-center mr-4">
                            <div className="h-2 w-2 rounded-full bg-blue-500 mt-[10px]"></div>
                            <div className="h-12 w-[2px] bg-blue-500"></div>
                            <div className="h-2 w-2 rounded-full bg-blue-500 mb-[10px]"></div>
                          </div>
                          <div className="flex flex-col items-start justify-between py-1">
                            <div className="flex items-center space-x-2">
                              <Home className="h-4 w-4 text-gray-500 flex-shrink-0" />
                              <span className="font-medium">{trip.departure}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Plane className="h-4 w-4 text-gray-500 flex-shrink-0" />
                              <span className="font-medium">{trip.destination}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                          <span className="truncate">
                            {new Date(trip.startDate).toLocaleDateString('en-US', { 
                              month: 'short',
                              day: 'numeric'
                            })} - {new Date(trip.endDate).toLocaleDateString('en-US', { 
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <Ticket className="h-5 w-5 text-blue-500 flex-shrink-0" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <AlertDialog open={!!tripToDelete} onOpenChange={() => setTripToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Trip</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{tripToDelete?.title}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-500 hover:bg-red-600 text-white cursor-pointer"
                onClick={() => tripToDelete && handleDeleteTrip(tripToDelete)}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
} 