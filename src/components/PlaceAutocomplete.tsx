"use client";

import { useEffect, useRef, useState } from 'react';
import { Input } from "@/components/ui/input";

interface PlaceAutocompleteProps {
  onPlaceSelect: (place: { name: string; placeId: string }) => void;
  placeholder: string;
  defaultValue?: string;
}

declare global {
  interface Window {
    google: typeof google;
  }
}

export default function PlaceAutocomplete({ 
  onPlaceSelect, 
  placeholder,
  defaultValue = ""
}: PlaceAutocompleteProps) {
  const [inputValue, setInputValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<InstanceType<typeof google.maps.places.Autocomplete> | null>(null);

  useEffect(() => {
    const initializeAutocomplete = () => {
      console.log('Initializing autocomplete...');
      
      if (!inputRef.current) {
        console.error('Input ref not ready');
        return;
      }

      if (!window.google?.maps?.places) {
        console.error('Google Maps Places API not available');
        setError('Google Maps Places API not available');
        return;
      }

      try {
        console.log('Creating new Autocomplete instance');
        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['airport'],
          fields: ['name', 'place_id']
        });

        console.log('Adding place_changed listener');
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          console.log('Place selected:', place);

          if (place?.name && place?.place_id) {
            setInputValue(place.name);
            onPlaceSelect({
              name: place.name,
              placeId: place.place_id
            });
          } else {
            console.error('Invalid place data:', place);
            setError('Failed to get place details');
          }
        });

        autocompleteRef.current = autocomplete;
        setError(null);
        console.log('Autocomplete initialized successfully');
      } catch (error) {
        console.error('Error initializing autocomplete:', error);
        setError('Failed to initialize Places Autocomplete');
      }
    };

    // Check if Google Maps is already loaded
    if (window.google?.maps?.places) {
      console.log('Google Maps already loaded, initializing immediately');
      initializeAutocomplete();
    } else {
      console.log('Waiting for Google Maps to load...');
      const checkGoogleMapsInterval = setInterval(() => {
        if (window.google?.maps?.places) {
          console.log('Google Maps loaded, initializing...');
          initializeAutocomplete();
          clearInterval(checkGoogleMapsInterval);
        }
      }, 100);

      // Clear interval after 10 seconds if Google Maps hasn't loaded
      setTimeout(() => {
        clearInterval(checkGoogleMapsInterval);
        if (!window.google?.maps?.places) {
          console.error('Google Maps failed to load after 10 seconds');
          setError('Google Maps failed to load. Please check your internet connection and API key.');
        }
      }, 10000);
    }

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [onPlaceSelect]);

  return (
    <div>
      <Input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        className="bg-white"
      />
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
} 