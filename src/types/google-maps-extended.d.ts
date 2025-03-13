declare namespace JSX {
  interface IntrinsicElements {
    'gmpx-place-picker': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      placeholder?: string;
      value?: any;
    }, HTMLElement>;
  }
}

interface PlacePickerElement extends HTMLElement {
  value: {
    name: string;
    placeId: string;
    location?: {
      lat: number;
      lng: number;
    };
    viewport?: {
      north: number;
      south: number;
      east: number;
      west: number;
    };
  };
} 