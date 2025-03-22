import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

// Helper function to extract IATA code from airport name
const extractIataCode = (airportName: string): string => {
  const match = airportName.match(/\(([A-Z]{3})\)/);
  return match ? match[1] : airportName;
};

interface SerpApiRequestParams {
  api_key: string;
  engine: string;
  hl: string;
  gl: string;
  departure_id: string;
  arrival_id: string;
  outbound_date: string;
  currency: string;
  departure_token?: string;
  return_date?: string;
  type?: string;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { originLocationCode, destinationLocationCode, departureDate, departure_token, returnDate } = await request.json();

    // Extract IATA codes
    const originIata = extractIataCode(originLocationCode);
    const destinationIata = extractIataCode(destinationLocationCode);

    console.log('Extracted IATA codes:', {
      originIata,
      destinationIata,
      departureDate,
      returnDate,
      departure_token
    });

    if (!originIata || !destinationIata || !departureDate) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const apiKey = process.env.SERPAPI_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "SerpApi key not configured" },
        { status: 500 }
      );
    }

    // Construct the request parameters
    const requestParams: SerpApiRequestParams = {
      api_key: apiKey,
      engine: "google_flights",
      hl: "en",
      gl: "us",
      departure_id: originIata,
      arrival_id: destinationIata,
      outbound_date: departureDate,
      return_date: returnDate, // Always include return_date for round-trip
      type: "1", // Always set to round-trip
      currency: "USD"
    };

    // Only add departure_token for return flight searches
    if (departure_token) {
      requestParams.departure_token = departure_token;
    }

    console.log('Making SerpApi request with params:', JSON.stringify(requestParams, null, 2));

    // Convert requestParams to Record<string, string> for URLSearchParams
    const searchParams = new URLSearchParams();
    Object.entries(requestParams).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value);
      }
    });

    const response = await fetch(`https://serpapi.com/search.json?${searchParams.toString()}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('SerpApi error response:', errorData);
      throw new Error(`SerpApi request failed: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    console.log('Full SerpApi response:', JSON.stringify(data, null, 2));

    // Combine best_flights and other_flights arrays
    const allFlights = [
      ...(data.best_flights || []),
      ...(data.other_flights || [])
    ];

    if (allFlights.length === 0) {
      console.log('No flights found in the response');
      return NextResponse.json([]);
    }

    // Add booking_token to each flight if available
    const flightsWithBooking = allFlights.map(flight => ({
      ...flight,
      booking_token: data.booking_token
    }));

    console.log(`Found ${flightsWithBooking.length} flights`);
    return NextResponse.json(flightsWithBooking);

  } catch (error: any) {
    console.error("Error searching flights:", error);
    
    // Log the full error details
    if (error.response) {
      console.error('Error response:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    }

    // Return more detailed error information
    return NextResponse.json(
      { 
        error: "Failed to search flights",
        details: error.message || 'Unknown error',
        code: error.code,
        status: error.response?.status
      },
      { status: 500 }
    );
  }
} 