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
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

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
  booking_token?: string;
}

interface Place {
  name: string;
  placeId: string;
}

interface SavedFlight {
  id: string;
  airline: string;
  flightNumber: string;
  departure: string;
  arrival: string;
  cost: number;
  isBooked: boolean;
  bookingToken?: string;
  returnFlight?: {
    airline: string;
    flightNumber: string;
    departure: string;
    arrival: string;
    cost: number;
    bookingToken?: string;
  };
}

interface FlightPair {
  outbound: FlightResult;
  return: FlightResult;
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
  const [selectedOutboundFlight, setSelectedOutboundFlight] = useState<FlightResult | null>(null);
  const [returnFlights, setReturnFlights] = useState<FlightResult[]>([]);
  const [isSearchingReturn, setIsSearchingReturn] = useState(false);
  const [showFlightSearch, setShowFlightSearch] = useState(false);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [selectedFlights, setSelectedFlights] = useState<{
    outbound: FlightResult | null;
    return: FlightResult | null;
  }>({ outbound: null, return: null });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [flightToDelete, setFlightToDelete] = useState<{
    id: string;
    isReturn: boolean;
    type: string;
  } | null>(null);

  useEffect(() => {
    fetchTripDetails();
  }, []);

  useEffect(() => {
    if (trip) {
      setDateRange({
        from: new Date(trip.startDate),
        to: new Date(trip.endDate),
      });
      setFlightDate({
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

    // Reset states when starting a new search
    setSelectedOutboundFlight(null);
    setReturnFlights([]);
    setFlightResults([]);

    setIsSearching(true);
    setFlightError(null);

    try {
      // Search for outbound flights
      const response = await fetch('/api/flights/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originLocationCode: trip.departure,
          destinationLocationCode: trip.destination,
          departureDate: formatDateForAPI(flightDate.from),
          returnDate: formatDateForAPI(flightDate.to),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to search flights');
      }

      const flightData = await response.json();
      
      if (Array.isArray(flightData) && flightData.length > 0) {
        setFlightResults(flightData);
      } else {
        setFlightError('No flights found for the selected dates');
      }
    } catch (err: any) {
      setFlightError(err.message);
      console.error('Error searching flights:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleOutboundFlightSelection = async (flight: FlightResult) => {
    setSelectedOutboundFlight(flight);
    setIsSearchingReturn(true);
    setFlightError(null);

    try {
      // Search for return flights using the departure_token
      const response = await fetch('/api/flights/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originLocationCode: trip?.departure,
          destinationLocationCode: trip?.destination,
          departureDate: formatDateForAPI(flightDate?.from!),
          returnDate: formatDateForAPI(flightDate?.to!),
          departure_token: flight.departure_token
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to search return flights');
      }

      const returnFlightData = await response.json();
      
      if (Array.isArray(returnFlightData) && returnFlightData.length > 0) {
        setReturnFlights(returnFlightData);
      } else {
        setFlightError('No return flights found for the selected dates');
      }
    } catch (err: any) {
      setFlightError(err.message);
      console.error('Error searching return flights:', err);
    } finally {
      setIsSearchingReturn(false);
    }
  };

  const handleFlightSelection = async (returnFlight: FlightResult) => {
    if (!trip || !selectedOutboundFlight) return;
    
    const outboundFirstSegment = selectedOutboundFlight.flights[0];
    const outboundLastSegment = selectedOutboundFlight.flights[selectedOutboundFlight.flights.length - 1];
    const returnFirstSegment = returnFlight.flights[0];
    const returnLastSegment = returnFlight.flights[returnFlight.flights.length - 1];
    
    setIsSelectingFlight(true);
    try {
      // Store selected flights for booking dialog
      setSelectedFlights({
        outbound: selectedOutboundFlight,
        return: returnFlight
      });
      setShowBookingDialog(true);
    } catch (error) {
      console.error('Error preparing flight selection:', error);
      setFlightError(error instanceof Error ? error.message : 'Failed to prepare flight selection');
    } finally {
      setIsSelectingFlight(false);
    }
  };

  const handleBookingConfirmation = async (bookOutbound: boolean, bookReturn: boolean) => {
    if (!trip || !selectedFlights.outbound || !selectedFlights.return) return;

    const outboundFirstSegment = selectedFlights.outbound.flights[0];
    const outboundLastSegment = selectedFlights.outbound.flights[selectedFlights.outbound.flights.length - 1];
    const returnFirstSegment = selectedFlights.return.flights[0];
    const returnLastSegment = selectedFlights.return.flights[selectedFlights.return.flights.length - 1];

    try {
      // Remove any existing flights
      if (trip.flights.length > 0) {
        for (const existingFlight of trip.flights) {
          const response = await fetch(`/api/trips/${params.id}/flights?flightId=${existingFlight.id}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            throw new Error('Failed to remove existing flight');
          }
        }
      }
      
      const flightData = {
        airline: outboundFirstSegment.airline,
        flightNumber: outboundFirstSegment.flight_number,
        departure: {
          airport: outboundFirstSegment.departure_airport.id,
          time: outboundFirstSegment.departure_airport.time
        },
        arrival: {
          airport: outboundLastSegment.arrival_airport.id,
          time: outboundLastSegment.arrival_airport.time
        },
        cost: selectedFlights.outbound.price,
        isBooked: bookOutbound,
        bookingToken: bookOutbound ? selectedFlights.outbound.booking_token : undefined,
        returnFlight: {
          airline: returnFirstSegment.airline,
          flightNumber: returnFirstSegment.flight_number,
          departure: {
            airport: returnFirstSegment.departure_airport.id,
            time: returnFirstSegment.departure_airport.time
          },
          arrival: {
            airport: returnLastSegment.arrival_airport.id,
            time: returnLastSegment.arrival_airport.time
          },
          cost: selectedFlights.return.price,
          isBooked: bookReturn,
          bookingToken: bookReturn ? selectedFlights.return.booking_token : undefined
        }
      };

      const response = await fetch(`/api/trips/${params.id}/flights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(flightData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to save flight');
      }

      const savedFlight = await response.json();
      
      // Update local state
      setTrip(prev => prev ? {
        ...prev,
        flights: [savedFlight]
      } : null);

      // Open booking pages based on user selection
      if (bookOutbound && selectedFlights.outbound.booking_token) {
        window.open(`https://www.google.com/flights/booking?token=${selectedFlights.outbound.booking_token}`, '_blank');
      }
      if (bookReturn && selectedFlights.return.booking_token) {
        window.open(`https://www.google.com/flights/booking?token=${selectedFlights.return.booking_token}`, '_blank');
      }

      // Reset selection states and navigate to overview
      setSelectedOutboundFlight(null);
      setReturnFlights([]);
      setFlightResults([]);
      setActiveTab("overview");
      setShowBookingDialog(false);
      setSelectedFlights({ outbound: null, return: null });
    } catch (error) {
      console.error('Error managing flight selection:', error);
      setFlightError(error instanceof Error ? error.message : 'Failed to manage flight selection');
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

  const bookedFlights = trip?.flights?.filter((flight) => flight.isBooked) || [];
  const hasBookedOutboundFlight = bookedFlights.length > 0;
  const hasBookedReturnFlight = bookedFlights.some((flight) => flight.returnFlight);

  // Update the flight display in the overview section
  const renderFlightStatus = (isBooked: boolean) => {
    if (isBooked) {
      return <div className="text-sm text-green-600 font-medium">✓ Flight Booked</div>;
    }
    return <div className="text-sm text-red-600 font-medium">Not Booked</div>;
  };

  const handleDeleteFlightClick = (flightId: string, isReturn: boolean) => {
    setFlightToDelete({
      id: flightId,
      isReturn,
      type: isReturn ? "return" : "outbound"
    });
    setShowDeleteDialog(true);
  };

  const handleDeleteFlight = async () => {
    if (!flightToDelete) return;
    
    try {
      let response;
      
      if (flightToDelete.isReturn) {
        // Delete just the return flight using the return flight endpoint
        response = await fetch(`/api/trips/${params.id}/flights?flightId=${flightToDelete.id}`, {
          method: 'DELETE',
        });
      } else {
        // Delete the outbound flight using the outbound endpoint
        response = await fetch(`/api/trips/${params.id}/flights?flightId=${flightToDelete.id}`, {
          method: 'DELETE',
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || `Failed to delete ${flightToDelete.type} flight`);
      }

      // Update the UI state based on what was deleted
      setTrip(prev => prev ? {
        ...prev,
        flights: prev.flights.filter(f => f.id !== flightToDelete.id)
      } : null);

      // Reset states
      setShowDeleteDialog(false);
      setFlightToDelete(null);
      
      // Show flight search if appropriate
      if (!flightToDelete.isReturn) {
        setShowFlightSearch(true);
        setSelectedOutboundFlight(null);
        setReturnFlights([]);
        setFlightResults([]);
      }
    } catch (error) {
      console.error('Failed to delete flight:', error);
      setFlightError(error instanceof Error ? error.message : 'Failed to delete flight. Please try again.');
      setShowDeleteDialog(false);
      setFlightToDelete(null);
    }
  };

  const handleChangeFlightClick = (isReturn: boolean) => {
    setShowFlightSearch(true);
    setIsSearchingReturn(isReturn);
    setFlightResults([]);
    setReturnFlights([]);

    // If changing return flight, keep the outbound flight selected
    if (isReturn && trip?.flights[0]) {
      const outboundFlight: FlightResult = {
        flights: [{
          airline: trip.flights[0].airline,
          flight_number: trip.flights[0].flightNumber,
          departure_airport: {
            name: trip.departure,
            id: trip.flights[0].departure.airport,
            time: trip.flights[0].departure
          },
          arrival_airport: {
            name: trip.destination,
            id: trip.flights[0].arrival.airport,
            time: trip.flights[0].arrival
          },
          duration: 0, // These fields are required by the type but not used in this context
          airplane: "",
          airline_logo: "",
          travel_class: "",
          legroom: "",
          extensions: []
        }],
        layovers: [],
        total_duration: 0,
        carbon_emissions: {
          this_flight: 0,
          typical_for_this_route: 0,
          difference_percent: 0
        },
        price: trip.flights[0].cost,
        type: "outbound",
        airline_logo: "",
        departure_token: "",
        booking_token: trip.flights[0].bookingToken
      };
      setSelectedOutboundFlight(outboundFlight);
    } else {
      setSelectedOutboundFlight(null);
    }

    // Start a new flight search
    handleFlightSearch(new Event('submit') as any);
  };

  // Update the flight card rendering to pass isReturn to delete function
  const renderFlightCard = (flight: any, isReturn: boolean = false) => {
    // If this is a return flight card, use the flight data directly
    // If this is an outbound flight card, use the main flight data
    const flightData = isReturn ? flight : flight;
    const departureTime = formatFlightDateTime(flightData.departure);
    const arrivalTime = formatFlightDateTime(flightData.arrival);
    
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{isReturn ? "Return Flight" : "Outbound Flight"}</CardTitle>
              <CardDescription>
                {flightData.airline} {flightData.flightNumber}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {!flightData.isBooked && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleChangeFlightClick(isReturn)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Change
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteFlightClick(flightData.id, isReturn)}
                className="text-red-600 hover:text-red-800"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Departure</p>
              <p className="text-sm">{flightData.departure.airport}</p>
              <p className="text-sm">{departureTime.date}</p>
              <p className="text-sm">{departureTime.time}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Arrival</p>
              <p className="text-sm">{flightData.arrival.airport}</p>
              <p className="text-sm">{arrivalTime.date}</p>
              <p className="text-sm">{arrivalTime.time}</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium">Cost</p>
            <p className="text-sm">${flightData.cost.toFixed(2)}</p>
          </div>
          <div className="mt-2">
            {renderFlightStatus(flightData.isBooked)}
            {!flightData.isBooked && flightData.bookingToken && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://www.google.com/flights/booking?token=${flightData.bookingToken}`, '_blank')}
                className="mt-2"
              >
                Book Flight
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const formatPrice = (price: number | undefined) => {
    if (typeof price === 'undefined') return '$0.00';
    return `$${price.toLocaleString()}`;
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
                  {trip.flights && trip.flights.length > 0 ? (
                    <div className="space-y-4">
                      {trip.flights.map((flight) => (
                        <div key={flight.id} className="space-y-6">
                          {/* Show all flights regardless of their relationship */}
                          {renderFlightCard(flight)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-xl p-6 text-center h-[160px] flex flex-col justify-center">
                      <p className="text-gray-500 mb-4">No flights added yet</p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setActiveTab("flights");
                          setShowFlightSearch(true);
                        }}
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
              {/* Always show search interface first */}
              <>
                <h2 className="text-xl font-semibold mb-6 text-gray-900">Search Flights</h2>
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
                        onDateChange={() => {}}
                        variant="white"
                        fromDate={new Date(trip.startDate)}
                        toDate={new Date(trip.endDate)}
                        className="bg-white pointer-events-none opacity-75 cursor-not-allowed border border-gray-200"
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

                {/* Show existing flights if any */}
                {trip.flights && trip.flights.length > 0 && (
                  <div className="space-y-6 mt-8">
                    <h2 className="text-xl font-semibold text-gray-900">Your Flights</h2>
                    {trip.flights.map((flight) => (
                      <div key={flight.id} className="space-y-6">
                        {/* Show all flights regardless of their relationship */}
                        {renderFlightCard(flight)}
                      </div>
                    ))}
                  </div>
                )}

                {/* Rest of the flight search results code */}
                {flightError && (
                  <div className="mb-8 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100">
                    {flightError}
                  </div>
                )}
              </>
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
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book Your Flights</DialogTitle>
            <DialogDescription>
              Would you like to book your flights now or save them for later?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Outbound Flight</h4>
                  <p className="text-sm text-gray-500">
                    {selectedFlights.outbound?.flights[0].airline} {selectedFlights.outbound?.flights[0].flight_number}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBookingConfirmation(false, false)}
                  >
                    Later
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleBookingConfirmation(true, false)}
                  >
                    Book Now
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Return Flight</h4>
                  <p className="text-sm text-gray-500">
                    {selectedFlights.return?.flights[0].airline} {selectedFlights.return?.flights[0].flight_number}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBookingConfirmation(false, false)}
                  >
                    Later
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleBookingConfirmation(false, true)}
                  >
                    Book Now
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  // Save flights as not booked when canceling
                  handleBookingConfirmation(false, false);
                  setShowBookingDialog(false);
                  setSelectedFlights({ outbound: null, return: null });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleBookingConfirmation(true, true)}
              >
                Book Both Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showDeleteDialog} onOpenChange={(open) => !open && setShowDeleteDialog(false)}>
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              <span>Confirm Deletion</span>
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {flightToDelete?.type} flight? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setFlightToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteFlight}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Flight
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 