// utils/format.ts
import { formatUnits } from "ethers";

export function formatDate(timestamp: bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString();
}

export function formatTime(seconds: bigint): string {
  const hours = Math.floor(Number(seconds) / 3600);
  const minutes = Math.floor((Number(seconds) % 3600) / 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export function formatPrice(price: bigint, decimals: number = 18): string {
  const value = formatUnits(price, decimals);
  // Trim trailing zeros after decimal point
  return value.replace(/(\.\d*?[1-9])0+$/, "$1").replace(/\.$/, "");
}

export function formatEventDate(timestamp: number | bigint): string {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }
  
  export function formatEventTime(secondsSinceMidnight: number): string {
    const hours = Math.floor(secondsSinceMidnight / 3600);
    const minutes = Math.floor((secondsSinceMidnight % 3600) / 60);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  }