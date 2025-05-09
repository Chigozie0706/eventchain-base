"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useReadContract, useWriteContract } from "wagmi";
import { MapPin, Calendar, Flag, DollarSign } from "lucide-react";
import { toast } from "react-hot-toast";
import contractABI from "../contract/abi.json";

const CONTRACT_ADDRESS = "0xc153E9A4A58324713e9575CE2918C58719A757Cc";

interface Event {
  id: string;
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
  ticketPrice: number;
  fundsHeld: number;
  isCanceled: boolean;
  fundsReleased: boolean;
  paymentToken: string;
}

// Expanded token information including decimals
const SUPPORTED_TOKENS: Record<string, { symbol: string; decimals: number }> = {
  "0x036CbD53842c5426634e7929541eC2318f3dCF7e": { symbol: "USDC", decimals: 6 },
  "0x4200000000000000000000000000000000000006": {
    symbol: "WETH",
    decimals: 18,
  },
};

export default function EventTickets() {
  const [events, setEvents] = useState<Event[]>([]);
  const { writeContractAsync, isPending: isWriting } = useWriteContract();

  const {
    data,
    error: contractError,
    isLoading,
    isError,
    isSuccess,
    refetch,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: contractABI.abi,
    functionName: "getUserEvents",
  });

  useEffect(() => {
    if (isError) {
      console.error("Contract read error:", contractError);
      toast.error("Failed to load your tickets");
    }
  }, [isError, contractError]);

  useEffect(() => {
    if (isSuccess && data) {
      try {
        const [eventIds, eventData] = data as [string[], any[]];

        const formattedEvents = eventData.map((event, index) => {
          const tokenInfo = SUPPORTED_TOKENS[
            ethers.getAddress(event.paymentToken)
          ] || {
            symbol: `${event.paymentToken.slice(
              0,
              6
            )}...${event.paymentToken.slice(-4)}`,
            decimals: 18,
          };

          return {
            id: eventIds[index],
            owner: event.owner,
            eventName: event.eventName,
            eventCardImgUrl: event.eventCardImgUrl,
            eventDetails: event.eventDetails,
            startDate: Number(event.startDate),
            endDate: Number(event.endDate),
            startTime: Number(event.startTime),
            endTime: Number(event.endTime),
            eventLocation: event.eventLocation,
            isActive: event.isActive,
            ticketPrice: Number(
              ethers.formatUnits(event.ticketPrice, tokenInfo.decimals)
            ),
            fundsHeld: Number(
              ethers.formatUnits(event.fundsHeld, tokenInfo.decimals)
            ),
            isCanceled: event.isCanceled,
            fundsReleased: event.fundsReleased,
            paymentToken: ethers.getAddress(event.paymentToken),
            tokenSymbol: tokenInfo.symbol,
          };
        });

        setEvents(formattedEvents);
      } catch (error) {
        console.error("Error processing events:", error);
        toast.error("Failed to process event data");
      }
    }
  }, [isSuccess, data]);

  const requestRefund = async (id: string) => {
    const toastId = toast.loading("Processing refund request...");
    try {
      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: contractABI.abi,
        functionName: "requestRefund",
        args: [id],
      });

      toast.dismiss(toastId);
      toast.success("Refund requested successfully!");
      await refetch();
    } catch (error) {
      toast.dismiss(toastId);
      toast.error(
        error instanceof Error ? error.message : "Failed to request refund"
      );
    }
  };

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return {
      date: date.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      time: date.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      }),
    };
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">My Tickets</h1>
        <p>Loading your tickets...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">My Tickets</h1>
        <p className="text-red-500">Error loading tickets</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">My Tickets</h1>

      {events.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">You don't have any tickets yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            const start = formatDateTime(event.startDate);
            const end = formatDateTime(event.endDate);
            const startTime = formatDateTime(event.startTime).time;
            const endTime = formatDateTime(event.endTime).time;

            return (
              <div
                key={event.id}
                className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    <img
                      src={event.eventCardImgUrl}
                      alt={event.eventName}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold">
                        {event.eventName}
                      </h2>
                      <p className="text-gray-600 mt-1 text-sm line-clamp-2">
                        {event.eventDetails}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 mt-0.5 text-gray-500 flex-shrink-0" />
                          <span className="text-sm">{event.eventLocation}</span>
                        </div>

                        <div className="flex items-start gap-2">
                          <DollarSign className="w-4 h-4 mt-0.5 text-gray-500 flex-shrink-0" />
                          <span className="text-sm">
                            {event.ticketPrice.toFixed(2)}
                            {/* {event.tokenSymbol} */}
                          </span>
                        </div>

                        <div className="flex items-start gap-2">
                          <Calendar className="w-4 h-4 mt-0.5 text-gray-500 flex-shrink-0" />
                          <div className="text-sm">
                            <p>{start.date}</p>
                            <p>{end.date}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Flag className="w-4 h-4 mt-0.5 text-gray-500 flex-shrink-0" />
                          <div className="text-sm">
                            <p>
                              {startTime} - {endTime}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => requestRefund(event.id)}
                      disabled={isWriting || event.isCanceled}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        event.isCanceled
                          ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                          : "bg-red-500 text-white hover:bg-red-600"
                      }`}
                    >
                      {event.isCanceled
                        ? "Event Canceled"
                        : isWriting
                        ? "Processing..."
                        : "Request Refund"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
