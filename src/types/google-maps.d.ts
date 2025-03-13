declare namespace google.maps {
  class places {
    static Autocomplete: new (
      inputField: HTMLInputElement,
      opts?: AutocompleteOptions
    ) => Autocomplete;
  }

  interface AutocompleteOptions {
    fields?: string[];
    types?: string[];
  }

  interface Autocomplete {
    addListener(eventName: string, handler: () => void): void;
    getPlace(): PlaceResult;
  }

  interface PlaceResult {
    name?: string;
    place_id?: string;
  }

  namespace event {
    function clearInstanceListeners(instance: any): void;
  }
} 