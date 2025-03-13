"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

interface GoogleMapsScriptProps {
  onScriptLoad?: (isLoaded: boolean) => void;
  onScriptError?: (error: string) => void;
}

export default function GoogleMapsScript({ onScriptLoad, onScriptError }: GoogleMapsScriptProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!apiKey) {
      console.error('Google Maps API key is not set in environment variables');
      onScriptError?.('API key is missing');
    }
  }, [apiKey, onScriptError]);

  const handleScriptError = (e: Error) => {
    console.error('Google Maps script failed to load:', e);
    onScriptError?.('Failed to load Google Maps');
  };

  if (!apiKey) {
    return null;
  }

  return (
    <>
      <Script
        src="https://ajax.googleapis.com/ajax/libs/@googlemaps/extended-component-library/0.6.11/index.min.js"
        strategy="afterInteractive"
        onError={handleScriptError}
        onLoad={() => {
          console.log('Google Maps Extended Component Library loaded successfully');
          onScriptLoad?.(true);
        }}
      />
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`}
        strategy="afterInteractive"
        onError={handleScriptError}
        onLoad={() => {
          console.log('Google Maps API loaded successfully');
          if (window.google?.maps?.places) {
            console.log('Places API is available');
            onScriptLoad?.(true);
          } else {
            console.error('Places API is not available');
            onScriptError?.('Places API failed to initialize');
          }
        }}
      />
    </>
  );
} 