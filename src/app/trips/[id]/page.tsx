"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateRangePicker } from "@/components/DateRangePicker";
import { DateRange } from "react-day-picker";

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

export default function TripDetails() {
  const params = useParams();
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
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
      const response = await fetch(`/api/trips/${params.id}`);
      const data = await response.json();
      setTrip(data);
      
      // Initialize flight dates based on trip dates
      setFlightDate({
        from: new Date(data.startDate),
        to: new Date(data.endDate),
      });
    } catch (error) {
      console.error("Failed to fetch trip details:", error);
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

  if (!trip || !editedTrip) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trip Name
              </label>
              <Input
                value={editedTrip.title}
                onChange={(e) => setEditedTrip({ ...editedTrip, title: e.target.value })}
                className="text-3xl font-bold"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Departure Airport
                </label>
                <Input
                  value={editedTrip.departure}
                  onChange={(e) => setEditedTrip({ ...editedTrip, departure: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Destination Airport
                </label>
                <Input
                  value={editedTrip.destination}
                  onChange={(e) => setEditedTrip({ ...editedTrip, destination: e.target.value })}
                />
              </div>
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
            <div className="flex space-x-2">
              <Button onClick={handleSave} disabled={isSaving}>
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
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-3xl font-bold">{trip.title}</h1>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  Edit Trip
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete Trip"}
                </Button>
              </div>
            </div>
            <div className="flex items-center text-gray-600 space-x-4">
              <span>{trip.departure} → {trip.destination}</span>
              <span>•</span>
              <span>{new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}</span>
              {trip.budget && (
                <>
                  <span>•</span>
                  <span>Budget: ${trip.budget.toLocaleString()}</span>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "overview"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("flights")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "flights"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Flights
          </button>
          <button
            onClick={() => setActiveTab("accommodations")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "accommodations"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Accommodations
          </button>
          <button
            onClick={() => setActiveTab("activities")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
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
      <div className="bg-white rounded-lg shadow-md p-6">
        {activeTab === "overview" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Trip Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-medium mb-2">Flights</h3>
                {trip.flights.length > 0 ? (
                  <ul className="space-y-2">
                    {trip.flights.map((flight) => (
                      <li key={flight.id} className="text-gray-600">
                        {flight.airline} - {flight.flightNumber}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("flights")}
                    className="w-full"
                  >
                    Add Flights
                  </Button>
                )}
              </div>
              <div>
                <h3 className="font-medium mb-2">Accommodations</h3>
                {trip.accommodations.length > 0 ? (
                  <ul className="space-y-2">
                    {trip.accommodations.map((accommodation) => (
                      <li key={accommodation.id} className="text-gray-600">
                        {accommodation.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("accommodations")}
                    className="w-full"
                  >
                    Add Accommodation
                  </Button>
                )}
              </div>
              <div>
                <h3 className="font-medium mb-2">Activities</h3>
                {trip.activities.length > 0 ? (
                  <ul className="space-y-2">
                    {trip.activities.map((activity) => (
                      <li key={activity.id} className="text-gray-600">
                        {activity.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("activities")}
                    className="w-full"
                  >
                    Plan Activities
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "flights" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Flight Search</h2>
            <form onSubmit={handleFlightSearch} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">From</label>
                  <Input
                    type="text"
                    placeholder="Departure Airport"
                    defaultValue={trip.departure}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">To</label>
                  <Input
                    type="text"
                    placeholder="Destination Airport"
                    defaultValue={trip.destination}
                    disabled
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Travel Dates</label>
                <DateRangePicker
                  date={flightDate}
                  onDateChange={setFlightDate}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Passengers</label>
                <Input 
                  type="number" 
                  min="1" 
                  value={passengers}
                  onChange={(e) => setPassengers(parseInt(e.target.value))}
                />
              </div>

              <Button
                type="submit"
                className="w-full md:w-auto"
                disabled={isSearching}
              >
                {isSearching ? "Searching..." : "Search Flights"}
              </Button>
            </form>

            {flightError && (
              <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
                {flightError}
              </div>
            )}

            <div className="mt-8">
              {isSearching ? (
                <p className="text-gray-600">Searching for flights...</p>
              ) : flightResults.length > 0 ? (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Available Flights</h3>
                  {flightResults.map((flight, index) => (
                    <div key={index} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="space-y-4 flex-1">
                          {/* Flight Segments */}
                          {flight.flights.map((segment, i) => (
                            <div key={i} className="space-y-2">
                              <div className="flex items-center space-x-4">
                                <img 
                                  src={segment.airline_logo} 
                                  alt={segment.airline}
                                  className="w-8 h-8 object-contain"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <span className="font-medium">{segment.departure_airport.id}</span>
                                      <span>→</span>
                                      <span className="font-medium">{segment.arrival_airport.id}</span>
                                    </div>
                                    <span className="text-sm text-gray-500">
                                      {formatTime(segment.departure_airport.time)} - {formatTime(segment.arrival_airport.time)}
                                    </span>
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {segment.airline} {segment.flight_number} • {formatDate(segment.departure_airport.time)}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Layover */}
                              {flight.layovers && i < flight.layovers.length && (
                                <div className="ml-12 text-sm text-gray-500">
                                  {flight.layovers[i].overnight ? 'Overnight layover' : 'Layover'}: {flight.layovers[i].name} ({flight.layovers[i].id}) • {formatDuration(flight.layovers[i].duration)}
                                </div>
                              )}
                            </div>
                          ))}

                          {/* Flight Details */}
                          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Total Duration:</span> {formatDuration(flight.total_duration)}
                            </div>
                            <div>
                              <span className="font-medium">Carbon Emissions:</span> {Math.round(flight.carbon_emissions.this_flight / 1000)}kg
                              {flight.carbon_emissions.difference_percent !== 0 && (
                                <span className={flight.carbon_emissions.difference_percent > 0 ? 'text-red-500' : 'text-green-500'}>
                                  {' '}({flight.carbon_emissions.difference_percent > 0 ? '+' : ''}{flight.carbon_emissions.difference_percent}%)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right ml-6">
                          <div className="text-2xl font-bold">
                            ${flight.price.toLocaleString()}
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2"
                            onClick={() => {
                              // Handle flight selection
                              console.log('Selected flight:', flight);
                            }}
                          >
                            Select Flight
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">
                  {flightError ? flightError : "Search for flights to find the best deals"}
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === "accommodations" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Find Accommodations</h2>
            {/* Accommodation search form will go here */}
            <p className="text-gray-600">Accommodation search coming soon...</p>
          </div>
        )}

        {activeTab === "activities" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Plan Activities</h2>
            {/* Activities search and planning form will go here */}
            <p className="text-gray-600">Activity planning coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
} 