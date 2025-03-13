"use client";

interface MapLoadingStatusProps {
  scriptError: string | null;
  isExtendedLibraryLoaded: boolean;
  isMapsApiLoaded: boolean;
}

export default function MapLoadingStatus({
  scriptError,
  isExtendedLibraryLoaded,
  isMapsApiLoaded
}: MapLoadingStatusProps) {
  if (!scriptError && !isExtendedLibraryLoaded && !isMapsApiLoaded) {
    return null;
  }

  return (
    <>
      {scriptError && (
        <div style={{ 
          position: 'fixed', 
          bottom: 20, 
          right: 20, 
          background: 'red', 
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          zIndex: 9999
        }}>
          Error: {scriptError}
        </div>
      )}
      {isExtendedLibraryLoaded && isMapsApiLoaded && (
        <div style={{ 
          position: 'fixed', 
          bottom: 20, 
          right: 20, 
          background: 'green', 
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          zIndex: 9999
        }}>
          Google Maps loaded successfully
        </div>
      )}
    </>
  );
} 