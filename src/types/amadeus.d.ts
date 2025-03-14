declare module 'amadeus' {
  interface AmadeusConfig {
    clientId: string;
    clientSecret: string;
    hostname?: string;
  }

  interface FlightOfferSearchParams {
    originLocationCode: string;
    destinationLocationCode: string;
    departureDate: string;
    returnDate?: string;
    adults?: number;
    currencyCode?: string;
    max?: number;
  }

  interface Amadeus {
    shopping: {
      flightOffersSearch: {
        get: (params: FlightOfferSearchParams) => Promise<{
          data: any[];
        }>;
      };
    };
  }

  export default class Amadeus {
    constructor(config: AmadeusConfig);
    shopping: {
      flightOffersSearch: {
        get: (params: FlightOfferSearchParams) => Promise<{
          data: any[];
        }>;
      };
    };
  }
} 