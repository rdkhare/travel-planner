declare module 'kursor' {
  interface KursorOptions {
    type?: number;
    removeDefaultCursor?: boolean;
    color?: string;
    el?: HTMLElement;
  }

  export default class Kursor {
    constructor(options?: KursorOptions);
  }
} 