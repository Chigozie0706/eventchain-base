"use client";
import { useEffect, useState } from "react";
import EventCard from "@/components/EventCard";
import { useReadContract } from "wagmi";
import contractABI from "../../contract/abi.json";

interface Event {
  index: number;
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

const CONTRACT_ADDRESS = "0x4d076657405ec101Ee546f81BCc818abE83e31f3";

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    data,
    error: contractError,
    isLoading,
    isError,
    isSuccess,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: contractABI.abi,
    functionName: "getAllEvents",
  });

  useEffect(() => {
    if (isLoading) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }, [isLoading]);

  useEffect(() => {
    if (isError) {
      console.error("🚨 Contract read error:", {
        error: contractError,
        contractAddress: CONTRACT_ADDRESS,
        functionName: "getAllEvents",
        timestamp: new Date().toISOString(),
      });
      setError("Failed to load events");
    }
  }, [isError, contractError]);

  useEffect(() => {
    if (isSuccess && data) {
      try {
        console.log("ℹ️ Raw events data received:", {
          data,
          timestamp: new Date().toISOString(),
        });

        if (!Array.isArray(data) || data.length !== 2) {
          throw new Error("Unexpected data format from contract");
        }

        const [indexes, eventData] = data as [bigint[], any[]];

        console.log("ℹ️ Processing events data...", {
          indexesCount: indexes.length,
          eventsCount: eventData.length,
          timestamp: new Date().toISOString(),
        });

        const formattedEvents = eventData.map((event, idx) => {
          // Now handling the event as an object with properties
          return {
            index: Number(indexes[idx]),
            owner: event.owner,
            eventName: event.eventName,
            eventCardImgUrl: event.eventCardImgUrl,
            eventDetails: event.eventDetails,
            startDate: Number(event.startDate), // Using startDate as eventDate
            startTime: Number(event.startTime),
            endDate: Number(event.startTime),
            endTime: Number(event.endTime),
            eventLocation: event.eventLocation,
            isActive: event.isActive,
            ticketPrice: Number(event.ticketPrice),
            fundsHeld: Number(event.fundsHeld),
            isCanceled: event.isCanceled,
            fundsReleased: event.fundsReleased,
            paymentToken: event.paymentToken,
          };
        });

        console.log("✅ Successfully formatted events:", {
          eventCount: formattedEvents.length,
          sampleEvent: formattedEvents[0],
          timestamp: new Date().toISOString(),
        });

        setEvents(formattedEvents);
      } catch (error) {
        console.error("🚨 Error processing events data:", {
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
          data,
          timestamp: new Date().toISOString(),
        });
        setError("Error processing event data");
      }
    }
  }, [isSuccess, data]);

  if (loading) {
    return (
      <div className="pt-16 text-center">
        <p>Loading events...</p>
      </div>
    );
  }

  if (isError || error) {
    return (
      <div className="pt-16 text-center text-red-500">
        <p>
          Error: {contractError?.message || error || "Failed to load events"}
        </p>
      </div>
    );
  }

  return (
    <div className="">
      <div className="pt-16">
        <h3 className="text-xl md:text-2xl font-bold mt-20 mx-5">
          Featured & Upcoming Events
        </h3>

        <div className="w-full px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 justify-center">
            {events.length > 0 ? (
              events.map((event) => (
                <EventCard
                  key={`${event.index}-${event.owner}`}
                  event={event}
                />
              ))
            ) : (
              <p className="text-center text-gray-500 col-span-full">
                No events found.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
