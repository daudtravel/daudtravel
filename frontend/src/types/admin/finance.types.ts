import type { CurrencyCode } from "./currency.types";
import type { BookingType } from "./bookings.types";

export interface FinanceKpis {
  revenue: number;
  costOfSales: number;
  commissions: number;
  grossProfit: number;
  bookingProfit: number;
  /** Paid website orders that never became a booking. */
  onlineIncome: number;
  otherIncome: number;
  expenses: number;
  netResult: number;
  received: number;
  outstanding: number;
  bookings: number;
}

export interface FinanceReport {
  period: { from: string | null; to: string | null };
  displayCurrency: CurrencyCode;
  /** GEL per 1 unit of the display currency, at today's rate. */
  displayRate: number;
  kpis: FinanceKpis;
  monthly: {
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }[];
  expensesByCategory: { category: string; amount: number }[];
  byBookingType: {
    type: BookingType;
    count: number;
    revenue: number;
    cost: number;
    commission: number;
    profit: number;
  }[];
  byItemType: { type: string; revenue: number; cost: number; profit: number }[];
  perVehicle: {
    vehicleId: string;
    label: string;
    revenue: number;
    cost: number;
    expenses: number;
    net: number;
  }[];
  hotels: {
    hotelId: string;
    name: string;
    revenue: number;
    cost: number;
    commission: number;
  }[];
  driverPayouts: {
    driverId: string;
    name: string;
    earned: number;
    paid: number;
    outstanding: number;
  }[];
  partnerCommissions: {
    partnerId: string | null;
    name: string;
    amount: number;
    paid: number;
    unpaid: number;
  }[];
  byCurrency: {
    currency: CurrencyCode;
    revenue: number;
    cost: number;
    profit: number;
  }[];
}
