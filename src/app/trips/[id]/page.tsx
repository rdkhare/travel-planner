"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateRangePicker } from "@/components/DateRangePicker";
import { DateRange } from "react-day-picker";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import PlaceAutocomplete from "@/components/PlaceAutocomplete";

interface Trip {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  destination: string;
  departure: string;
  budget: number | null;
  flights: any[];
  accommodations: any[];
  activities: any[];
}

interface FlightOffer {
  itineraries: Array<{
    segments: Array<{
      departure: {
        iataCode: string;
        terminal?: string;
        at: string;
      };
      arrival: {
        iataCode: string;
        terminal?: string;
        at: string;
      };
      carrierCode: string;
      number: string;
      aircraft: {
        code: string;
      };
      duration: string;
      id: string;
      numberOfStops: number;
      blacklistedInEU: boolean;
    }>;
  }>;
  price: {
    currency: string;
    total: string;
    base: string;
    fees: Array<{
      amount: string;
      type: string;
    }>;
    grandTotal: string;
  };
  validatingAirlineCodes: string[];
  travelerPricings: Array<{
    travelerId: string;
    fareOption: string;
    travelerType: string;
    price: {
      currency: string;
      total: string;
      base: string;
      fees: Array<{
        amount: string;
        type: string;
      }>;
      grandTotal: string;
    };
    fareDetailsBySegment: Array<{
      segmentId: string;
      cabin: string;
      fareBasis: string;
      brandedFare?: string;
      class: string;
      includedCheckedBags: {
        quantity: number;
      };
    }>;
  }>;
}

interface FlightSegment {
  departure_airport: {
    name: string;
    id: string;
    time: string;
  };
  arrival_airport: {
    name: string;
    id: string;
    time: string;
  };
  duration: number;
  airplane: string;
  airline: string;
  airline_logo: string;
  travel_class: string;
  flight_number: string;
  legroom: string;
  extensions: string[];
  overnight?: boolean;
  often_delayed_by_over_30_min?: boolean;
}

interface Layover {
  duration: number;
  name: string;
  id: string;
  overnight?: boolean;
}

interface FlightResult {
  flights: FlightSegment[];
  layovers: Layover[];
  total_duration: number;
  carbon_emissions: {
    this_flight: number;
    typical_for_this_route: number;
    difference_percent: number;
  };
  price: number;
  type: string;
  airline_logo: string;
  departure_token: string;
}

interface Place {
  name: string;
  placeId: string;
}

const formatDateForAPI = (date: Date) => {
  return date.toISOString().split('T')[0];
};

const formatDate = (dateTimeStr: string) => {
  const date = new Date(dateTimeStr);
  return date.toLocaleDateString('en-US', { 
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

const formatTime = (dateTimeStr: string) => {
  const date = new Date(dateTimeStr);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatFlightDateTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return {
    date: date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric'
    }),
    time: date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    }).toLowerCase()
  };
};

export default function TripDetails() {
  const params = useParams();
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [flightDate, setFlightDate] = useState<DateRange | undefined>();
  const [isSearching, setIsSearching] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTrip, setEditedTrip] = useState<Trip | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isDeleting, setIsDeleting] = useState(false);
  const [flightResults, setFlightResults] = useState<FlightResult[]>([]);
  const [flightError, setFlightError] = useState<string | null>(null);
  const [passengers, setPassengers] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isSelectingFlight, setIsSelectingFlight] = useState(false);
  const [selectedFlightIds, setSelectedFlightIds] = useState<Set<string>>(new Set());
  const [errorDialog, setErrorDialog] = useState({ isOpen: false, message: "" });

  useEffect(() => {
    fetchTripDetails();
  }, []);

  useEffect(() => {
    if (trip) {
      setDateRange({
        from: new Date(trip.startDate),
        to: new Date(trip.endDate),
      });
      setEditedTrip(trip);
    }
  }, [trip]);

  const fetchTripDetails = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/trips/${params.id}`);
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          router.push('/auth/signin');
          return;
        }
        throw new Error(errorData.error || 'Failed to fetch trip details');
      }
      const data = await response.json();
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid trip data received');
      }
      // Ensure the trip has all required arrays even if they're empty
      setTrip({
        ...data,
        flights: data.flights || [],
        accommodations: data.accommodations || [],
        activities: data.activities || []
      });
      
      // Initialize flight dates based on trip dates
      setFlightDate({
        from: new Date(data.startDate),
        to: new Date(data.endDate),
      });
    } catch (error: any) {
      console.error("Failed to fetch trip details:", error);
      setError(error.message || 'Failed to fetch trip details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editedTrip || !dateRange?.from || !dateRange?.to) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/trips/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editedTrip,
          startDate: dateRange.from,
          endDate: dateRange.to,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update trip');
      }

      const updatedTrip = await response.json();
      setTrip(updatedTrip);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update trip:', error);
      alert('Failed to update trip. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFlightSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trip) return;

    if (!flightDate?.from || !flightDate?.to) {
      setErrorDialog({
        isOpen: true,
        message: "Please select travel dates for your flight search"
      });
      return;
    }

    setIsSearching(true);
    setFlightError(null);

    try {
      const response = await fetch('/api/flights/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originLocationCode: trip.departure,
          destinationLocationCode: trip.destination,
          departureDate: formatDateForAPI(new Date(trip.startDate)),
          returnDate: trip.endDate ? formatDateForAPI(new Date(trip.endDate)) : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to search flights');
      }

      const data = await response.json();
      
      if (Array.isArray(data)) {
        setFlightResults(data);
      } else {
        console.error('Unexpected response format:', data);
        setFlightError('Received unexpected response format from flight search');
      }
    } catch (err: any) {
      setFlightError(err.message);
      console.error('Error searching flights:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this trip? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/trips/${params.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete trip');
      }

      router.push('/trips');
    } catch (error) {
      console.error('Failed to delete trip:', error);
      alert('Failed to delete trip. Please try again.');
      setIsDeleting(false);
    }
  };

  const isFlightSelected = (flightNumber: string, departureTime: string) => {
    return trip?.flights?.some(
      f => f.flightNumber === flightNumber && new Date(f.departure).getTime() === new Date(departureTime).getTime()
    ) ?? false;
  };

  const handleFlightSelection = async (flight: FlightResult) => {
    if (!trip) return;
    
    const firstSegment = flight.flights[0];
    const lastSegment = flight.flights[flight.flights.length - 1];
    
    // Check if this flight is already selected
    const isSelected = isFlightSelected(firstSegment.flight_number, firstSegment.departure_airport.time);
    
    setIsSelectingFlight(true);
    try {
      if (isSelected) {
        // Find the flight ID to delete
        const existingFlight = trip.flights.find(
          f => f.flightNumber === firstSegment.flight_number && 
              new Date(f.departure).getTime() === new Date(firstSegment.departure_airport.time).getTime()
        );
        
        if (!existingFlight) {
          throw new Error('Could not find flight to remove');
        }

        const response = await fetch(`/api/trips/${params.id}/flights?flightId=${existingFlight.id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to remove flight');
        }

        // Update local state
        setTrip(prev => prev ? {
          ...prev,
          flights: prev.flights.filter(f => f.id !== existingFlight.id)
        } : null);
      } else {
        // Add new flight
        const response = await fetch(`/api/trips/${params.id}/flights`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            airline: firstSegment.airline,
            flightNumber: firstSegment.flight_number,
            departureTime: firstSegment.departure_airport.time,
            arrivalTime: lastSegment.arrival_airport.time,
            cost: flight.price,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save flight');
        }

        const savedFlight = await response.json();
        
        // Update local state
        setTrip(prev => prev ? {
          ...prev,
          flights: [...prev.flights, savedFlight]
        } : null);
      }
    } catch (error) {
      console.error('Error managing flight selection:', error);
      setFlightError(error instanceof Error ? error.message : 'Failed to manage flight selection');
    } finally {
      setIsSelectingFlight(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
          <p className="mt-2 text-sm text-gray-500">Loading trip details...</p>
        </div>
      </div>
    );
  }

  if (!trip || !editedTrip) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          {isEditing ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trip Name
                </label>
                <Input
                  value={editedTrip.title}
                  onChange={(e) => setEditedTrip({ ...editedTrip, title: e.target.value })}
                  className="text-2xl font-medium"
                  placeholder="Enter trip name"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Departure Airport
                  </label>
                  <PlaceAutocomplete
                    placeholder="Enter departure airport"
                    defaultValue={editedTrip.departure}
                    onPlaceSelect={(place: Place) => 
                      setEditedTrip({ 
                        ...editedTrip, 
                        departure: place.name
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Destination Airport
                  </label>
                  <PlaceAutocomplete
                    placeholder="Enter destination airport"
                    defaultValue={editedTrip.destination}
                    onPlaceSelect={(place: Place) => 
                      setEditedTrip({ 
                        ...editedTrip, 
                        destination: place.name
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trip Dates
                </label>
                <DateRangePicker
                  date={dateRange}
                  onDateChange={setDateRange}
                  variant="white"
                />
              </div>
              <div className="flex space-x-3 pt-2">
                <Button onClick={handleSave} disabled={isSaving} className="px-6">
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
                <Button variant="outline" onClick={() => {
                  setEditedTrip(trip);
                  setIsEditing(false);
                }}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-start mb-6">
                <h1 className="text-3xl font-bold text-gray-900">{trip.title}</h1>
                <div className="flex space-x-3">
                  <Button variant="outline" onClick={() => setIsEditing(true)} className="px-4">
                    Edit Trip
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-4 bg-red-600 hover:bg-red-700"
                  >
                    {isDeleting ? "Deleting..." : "Delete Trip"}
                  </Button>
                </div>
              </div>
              <div className="flex items-center text-gray-600 space-x-4 text-sm">
                <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1.5 rounded-lg">
                  <span className="font-medium">{trip.departure}</span>
                  <span>→</span>
                  <span className="font-medium">{trip.destination}</span>
                </div>
                <span>•</span>
                <div className="bg-gray-50 px-3 py-1.5 rounded-lg">
                  {new Date(trip.startDate).toLocaleDateString('en-US', { 
                    month: 'short',
                    day: 'numeric'
                  })} - {new Date(trip.endDate).toLocaleDateString('en-US', { 
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
                {trip.budget && (
                  <>
                    <span>•</span>
                    <div className="bg-gray-50 px-3 py-1.5 rounded-lg">
                      Budget: ${trip.budget.toLocaleString()}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "overview"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("flights")}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "flights"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Flights
            </button>
            <button
              onClick={() => setActiveTab("accommodations")}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "accommodations"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Accommodations
            </button>
            <button
              onClick={() => setActiveTab("activities")}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "activities"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Activities
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm p-8">
          {activeTab === "overview" && (
            <div>
              <h2 className="text-xl font-semibold mb-6 text-gray-900">Trip Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <h3 className="font-medium mb-4 text-gray-900 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Flights
                  </h3>
                  {(trip?.flights?.length ?? 0) > 0 ? (
                    <ul className="space-y-3">
                      {trip.flights.map((flight) => (
                        <li key={flight.id} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                          <div className="flex flex-col space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-900">{flight.airline} - {flight.flightNumber}</span>
                              <span className="font-medium text-blue-600">${flight.cost?.toLocaleString()}</span>
                            </div>
                            <div className="text-sm space-y-2">
                              <div className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-2">
                                <span className="text-gray-500 flex items-center">
                                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                  </svg>
                                  Departure:
                                </span>
                                <div className="text-gray-900">
                                  {formatFlightDateTime(flight.departure).date} • {formatFlightDateTime(flight.departure).time}
                                </div>
                                <span className="text-gray-500 flex items-center">
                                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                  </svg>
                                  Arrival:
                                </span>
                                <div className="text-gray-900">
                                  {formatFlightDateTime(flight.arrival).date} • {formatFlightDateTime(flight.arrival).time}
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="bg-gray-50 rounded-xl p-6 text-center h-[160px] flex flex-col justify-center">
                      <p className="text-gray-500 mb-4">No flights added yet</p>
                      <Button
                        variant="outline"
                        onClick={() => setActiveTab("flights")}
                        className="w-full"
                      >
                        Search Flights
                      </Button>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-medium mb-4 text-gray-900 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Accommodations
                  </h3>
                  {(trip?.accommodations?.length ?? 0) > 0 ? (
                    <ul className="space-y-3">
                      {trip.accommodations.map((accommodation) => (
                        <li key={accommodation.id} className="bg-gray-50 rounded-xl p-4">
                          {accommodation.name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="bg-gray-50 rounded-xl p-6 text-center h-[160px] flex flex-col justify-center">
                      <p className="text-gray-500 mb-4">No accommodations added yet</p>
                      <Button
                        variant="outline"
                        onClick={() => setActiveTab("accommodations")}
                        className="w-full"
                      >
                        Find Accommodations
                      </Button>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-medium mb-4 text-gray-900 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Activities
                  </h3>
                  {(trip?.activities?.length ?? 0) > 0 ? (
                    <ul className="space-y-3">
                      {trip.activities.map((activity) => (
                        <li key={activity.id} className="bg-gray-50 rounded-xl p-4">
                          {activity.name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="bg-gray-50 rounded-xl p-6 text-center h-[160px] flex flex-col justify-center">
                      <p className="text-gray-500 mb-4">No activities planned yet</p>
                      <Button
                        variant="outline"
                        onClick={() => setActiveTab("activities")}
                        className="w-full"
                      >
                        Plan Activities
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "flights" && (
            <div>
              <h2 className="text-xl font-semibold mb-6 text-gray-900">Flight Search</h2>
              <div className="bg-gray-50 rounded-xl p-6 mb-8">
                <form onSubmit={handleFlightSearch} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">From</label>
                      <Input
                        type="text"
                        placeholder="Departure Airport"
                        defaultValue={trip.departure}
                        disabled
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">To</label>
                      <Input
                        type="text"
                        placeholder="Destination Airport"
                        defaultValue={trip.destination}
                        disabled
                        className="bg-white"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Travel Dates</label>
                    <DateRangePicker
                      date={flightDate}
                      onDateChange={setFlightDate}
                      variant="white"
                      fromDate={new Date(trip.startDate)}
                      toDate={new Date(trip.endDate)}
                      className="bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Passengers</label>
                    <Input 
                      type="number" 
                      min="1" 
                      value={passengers}
                      onChange={(e) => setPassengers(parseInt(e.target.value))}
                      className="bg-white max-w-[200px]"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full md:w-auto px-8"
                    disabled={isSearching}
                  >
                    {isSearching ? "Searching..." : "Search Flights"}
                  </Button>
                </form>
              </div>

              {flightError && (
                <div className="mb-8 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100">
                  {flightError}
                </div>
              )}

              <div>
                {isSearching ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600">Searching for flights...</p>
                  </div>
                ) : flightResults.length > 0 ? (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-gray-900">Available Flights</h3>
                    {flightResults.map((flight, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div className="space-y-6 flex-1">
                            {/* Flight Segments */}
                            {flight.flights.map((segment, i) => (
                              <div key={i} className="space-y-3">
                                <div className="flex items-center space-x-4">
                                  <img 
                                    src={segment.airline_logo} 
                                    alt={segment.airline}
                                    className="w-8 h-8 object-contain"
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-3">
                                        <span className="font-medium text-gray-900">{segment.departure_airport.id}</span>
                                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                        <span className="font-medium text-gray-900">{segment.arrival_airport.id}</span>
                                      </div>
                                      <span className="text-sm text-gray-500">
                                        {formatTime(segment.departure_airport.time)} - {formatTime(segment.arrival_airport.time)}
                                      </span>
                                    </div>
                                    <div className="text-sm text-gray-600 mt-1">
                                      {segment.airline} {segment.flight_number} • {formatDate(segment.departure_airport.time)}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Layover */}
                                {flight.layovers && i < flight.layovers.length && (
                                  <div className="ml-12 text-sm text-gray-500 bg-gray-50 rounded-lg px-4 py-2">
                                    {flight.layovers[i].overnight ? 'Overnight layover' : 'Layover'}: {flight.layovers[i].name} ({flight.layovers[i].id}) • {formatDuration(flight.layovers[i].duration)}
                                  </div>
                                )}
                              </div>
                            ))}

                            {/* Flight Details */}
                            <div className="grid grid-cols-2 gap-6 text-sm bg-gray-50 rounded-lg p-4">
                              <div>
                                <span className="font-medium text-gray-700">Total Duration:</span>{' '}
                                <span className="text-gray-900">{formatDuration(flight.total_duration)}</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Carbon Emissions:</span>{' '}
                                <span className="text-gray-900">{Math.round(flight.carbon_emissions.this_flight / 1000)}kg</span>
                                {flight.carbon_emissions.difference_percent !== 0 && (
                                  <span className={flight.carbon_emissions.difference_percent > 0 ? 'text-red-500' : 'text-green-500'}>
                                    {' '}({flight.carbon_emissions.difference_percent > 0 ? '+' : ''}{flight.carbon_emissions.difference_percent}%)
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right ml-6 flex flex-col items-end">
                            <div className="text-2xl font-bold text-gray-900 mb-2">
                              ${flight.price.toLocaleString()}
                            </div>
                            <Button 
                              variant={isFlightSelected(flight.flights[0].flight_number, flight.flights[0].departure_airport.time) ? "default" : "outline"}
                              size="sm" 
                              className="px-6"
                              onClick={() => handleFlightSelection(flight)}
                              disabled={isSelectingFlight}
                            >
                              {isSelectingFlight ? "Saving..." : 
                               isFlightSelected(flight.flights[0].flight_number, flight.flights[0].departure_airport.time) 
                               ? "Remove Flight" : "Select Flight"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-600">
                      {flightError ? flightError : "Search for flights to find the best deals"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "accommodations" && (
            <div>
              <h2 className="text-xl font-semibold mb-6 text-gray-900">Find Accommodations</h2>
              <div className="bg-gray-50 rounded-xl p-12 text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <p className="text-gray-600 mb-4">Accommodation search coming soon...</p>
              </div>
            </div>
          )}

          {activeTab === "activities" && (
            <div>
              <h2 className="text-xl font-semibold mb-6 text-gray-900">Plan Activities</h2>
              <div className="bg-gray-50 rounded-xl p-12 text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-gray-600 mb-4">Activity planning coming soon...</p>
              </div>
            </div>
          )}
        </div>
      </div>
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
    </div>
  );
} 