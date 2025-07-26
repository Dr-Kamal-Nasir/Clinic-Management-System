// lib/errors/InsufficientStockError.ts
export class InsufficientStockError extends Error {
  available: number;
  requested: number;

  constructor(message: string, available: number, requested: number) {
    super(message);
    this.name = 'InsufficientStockError';
    this.available = available;
    this.requested = requested;
  }
}