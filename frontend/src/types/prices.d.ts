export interface Prices {
    [key: number]: {
        reservation_price?: number;
        total_price?: number;
    };
}


export interface MonthlyPricesProps {
    prices: Prices;
}