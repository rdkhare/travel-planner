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
  return_date?: string;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { originLocationCode, destinationLocationCode, departureDate, returnDate } = await request.json();

    // Extract IATA codes
    const originIata = extractIataCode(originLocationCode);
    const destinationIata = extractIataCode(destinationLocationCode);

    console.log('Extracted IATA codes:', {
      originIata,
      destinationIata,
      departureDate,
      returnDate
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

    // Construct the request parameters exactly as per the example
    const requestParams: SerpApiRequestParams = {
      api_key: apiKey,
      engine: "google_flights",
      hl: "en",
      gl: "us",
      departure_id: originIata,
      arrival_id: destinationIata,
      outbound_date: departureDate,
      currency: "USD"
    };

    // Add return_date only if it exists
    if (returnDate) {
      requestParams.return_date = returnDate;
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

    console.log(`Found ${allFlights.length} flights`);
    return NextResponse.json(allFlights);

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