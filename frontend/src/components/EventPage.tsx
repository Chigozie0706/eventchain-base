"use client";
import AttendeeList from "./AttendeeList";
import {
  MapPin,
  CalendarDays,
  Ticket,
  Handshake,
  UsersRound,
  Check,
} from "lucide-react";
import { formatEventDate, formatEventTime, formatPrice } from "@/utils/format";
import { useAccount } from "wagmi";

export interface Event {
  owner: string;
  eventName: string;
  eventCardImgUrl: string;
  eventDetails: string;
  startDate: number;
  endDate: number;
  startTime: number;
  endTime: number;
  eventLocation: string;
  isActive: boolean;
  ticketPrice: bigint;
  paymentToken: string;
}

export interface EventPageProps {
  event: Event;
  attendees: string[];
  createdEvents: Event[];
  buyTicket: () => Promise<void>;
  requestRefund: () => Promise<void>;
  loading: boolean;
  registering: boolean;
  refunding: boolean;
  id: string;
}

export default function EventPage({
  event,
  attendees,
  createdEvents,
  buyTicket,
  requestRefund,
  loading,
  registering,
  refunding,
  id,
}: EventPageProps) {
  const { address } = useAccount();
  const formattedStartDate = formatEventDate(event.startDate);
  const formattedEndDate = formatEventDate(event.endDate);
  const formattedStartTime = formatEventTime(Number(event.startTime));
  const formattedEndTime = formatEventTime(Number(event.endTime));

  const SUPPORTED_TOKENS: Record<string, { symbol: string; decimals: number }> =
    {
      "0x036CbD53842c5426634e7929541eC2318f3dCF7e": {
        symbol: "USDC",
        decimals: 6, // USDC uses 6 decimals
      },
      "0x4200000000000000000000000000000000000006": {
        symbol: "WETH",
        decimals: 18, // WETH uses 18 decimals
      },
    };

  const tokenInfo = SUPPORTED_TOKENS[event.paymentToken] || {
    symbol: `${event.paymentToken.slice(0, 6)}...`,
    decimals: 18,
  };

  const formattedPrice = formatPrice(event.ticketPrice, tokenInfo.decimals);

  // Check if current user is registered
  const isRegistered = address && attendees.includes(address);

  return (
    <div className="container mx-auto px-6 md:px-12 lg:px-20 py-8">
      {/* Banner Section */}
      <div className="relative w-full flex justify-center mt-4 h-[300px] md:h-[400px] lg:h-[450px] overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/40 via-gray-800/40 to-gray-900/40 backdrop-blur-md rounded-2xl"></div>
        <div className="relative w-full max-w-5xl rounded-2xl overflow-hidden">
          <img
            src={event.eventCardImgUrl}
            alt="Event Banner"
            width={1200}
            height={500}
            className="rounded-2xl"
          />
        </div>
      </div>

      {/* Event Details Section */}
      <div className="flex flex-col md:flex-row md:justify-between md:space-x-8 mt-10">
        {/* Left Side */}
        <div className="max-w-4xl bg-white p-6 md:p-8">
          <h2 className="text-3xl font-bold text-gray-900">
            {event.eventName}
          </h2>
          <p className="text-gray-600 mt-3 text-base">{event.eventDetails}</p>

          {/* Date and Time */}
          <div className="mt-6">
            <h3 className="text-md font-semibold flex items-center space-x-2 text-gray-800">
              <CalendarDays className="w-5 h-5 text-gray-600" />
              <span>Date & Time</span>
            </h3>
            <p className="text-gray-700 text-sm mb-3">
              {formattedStartDate} - {formattedEndDate}
            </p>
            <p className="text-gray-700 text-sm">
              {formattedStartTime} - {formattedEndTime}
            </p>
          </div>

          {/* Location */}
          <div className="mt-6">
            <h3 className="text-md font-semibold flex items-center space-x-2 text-gray-800">
              <MapPin className="w-5 h-5 text-gray-600" />
              <span>Location</span>
            </h3>
            <p className="text-gray-700 text-sm">{event.eventLocation}</p>
          </div>

          {/* Ticket Price */}
          <div className="mt-6">
            <h3 className="text-md font-semibold flex items-center space-x-2 text-gray-800">
              <Ticket className="w-5 h-5 text-gray-600" />
              <span>Ticket Price</span>
            </h3>
            <p className="text-green-600 text-sm font-bold">
              {formattedPrice} {tokenInfo.symbol}
            </p>
          </div>

          {/* Attendee List */}
          <div className="mt-6">
            <h3 className="text-md font-semibold mb-4 flex items-center space-x-2 text-gray-800">
              <UsersRound className="w-5 h-5 text-gray-600" />
              <span>Attendees</span>
            </h3>
            <AttendeeList attendees={attendees} />
          </div>

          {/* Refund Policy */}
          <div className="mt-6">
            <h3 className="text-md font-semibold flex items-center space-x-2 text-gray-800">
              <Handshake className="w-5 h-5 text-gray-600" />
              <span>Refund Policy</span>
            </h3>
            <p className="text-gray-700 text-sm text-justify">
              Refunds are available if the event is canceled or if requested at
              least 5 hours before the event starts, provided funds are still in
              escrow. Refunds are issued in the same token used for payment and
              processed automatically. No refunds are available once the event
              has started, if funds have been released to the organizer, or if
              the request is made too late.
              <br />
              To request a refund, use the "Request Refund" button on the event
              page. If you experience issues, contact the organizer.
            </p>
          </div>
        </div>

        {/* Right Side (Ticket Selection) */}
        <div className="p-6 md:p-8 w-full md:w-1/3">
          <div className="border p-6 rounded-lg flex flex-col items-center bg-gray-100 shadow-md">
            <p className="font-semibold text-lg text-gray-900">
              Reserve a Spot
            </p>
            <p className="text-gray-600 text-base mt-2">
              Price:{" "}
              <span className="font-semibold">
                {formattedPrice} {tokenInfo.symbol}
              </span>
            </p>
          </div>

          {isRegistered ? (
            <div className="w-full bg-green-600 text-white mt-4 py-2 rounded-lg text-lg font-semibold flex items-center justify-center gap-2">
              <Check className="w-5 h-5" />
              Registered
            </div>
          ) : (
            <button
              className="w-full bg-orange-600 text-white mt-4 py-2 rounded-lg text-lg font-semibold hover:bg-orange-700 transition"
              onClick={buyTicket}
              disabled={loading || registering || !address}
            >
              {!address
                ? "Connect Wallet"
                : registering
                ? "Processing..."
                : "Register"}
            </button>
          )}

          {isRegistered && (
            <button
              onClick={requestRefund}
              className="w-full bg-red-500 text-white mt-4 py-2 rounded-lg text-lg font-semibold hover:bg-red-600 transition"
              disabled={loading || refunding}
            >
              {refunding ? "Processing..." : "Request Refund"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
