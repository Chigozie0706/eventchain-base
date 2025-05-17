"use client";
import { useEffect, useState } from "react";
import CreatorEventCard from "@/components/CreatorEventCard";
import {
  useReadContract,
  useWriteContract,
  useAccount,
  useWaitForTransactionReceipt,
  useBlockNumber,
} from "wagmi";
import contractABI from "../../contract/abi.json";
import { toast } from "react-hot-toast";
import { ethers } from "ethers";

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

const CONTRACT_ADDRESS = "0xb3972Ca9d6BD396CE0C1Cc2065bBb386f9892474";

export default function MyEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { writeContractAsync } = useWriteContract();
  const { address: connectedAddress } = useAccount();
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Add this hook for transaction tracking
  const { data: hash, isPending: isWriting } = useWriteContract();
  const { data: blockNumber } = useBlockNumber({ watch: true });

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

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
    functionName: "getActiveEventsByCreator",
    account: connectedAddress,
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
        functionName: "getActiveEventsByCreator",
        timestamp: new Date().toISOString(),
      });
      setError("Failed to load your events");
    }
  }, [isError, contractError]);

  useEffect(() => {
    if (isSuccess && data) {
      try {
        console.log("ℹ️ Raw creator events data received:", {
          data,
          timestamp: new Date().toISOString(),
        });

        if (!Array.isArray(data) || data.length !== 2) {
          throw new Error("Unexpected data format from contract");
        }

        const [indexes, eventData] = data as [bigint[], any[]];

        console.log("ℹ️ Processing creator events data...", {
          indexesCount: indexes.length,
          eventsCount: eventData.length,
          timestamp: new Date().toISOString(),
        });

        const formattedEvents = eventData.map((event, idx) => ({
          index: Number(indexes[idx]),
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
          ticketPrice: Number(event.ticketPrice),
          fundsHeld: Number(ethers.formatUnits(event.fundsHeld, 18)),
          isCanceled: event.isCanceled,
          fundsReleased: event.fundsReleased,
          paymentToken: event.paymentToken,
        }));

        console.log("✅ Successfully formatted creator events:", {
          eventCount: formattedEvents.length,
          sampleEvent: formattedEvents[0],
          timestamp: new Date().toISOString(),
        });

        setEvents(formattedEvents);
      } catch (error) {
        console.error("🚨 Error processing creator events data:", {
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
          data,
          timestamp: new Date().toISOString(),
        });
        setError("Error processing your event data");
      }
    }
  }, [isSuccess, data]);

  // Auto-refresh when block number changes (new blocks mean state might have changed)
  useEffect(() => {
    refetch();
  }, [blockNumber, refetch]);

  const cancelEvent = async (eventId: number) => {
    setCancelingId(eventId);
    const toastId = toast.loading("Canceling event...");
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: contractABI.abi,
        functionName: "cancelEvent",
        args: [eventId],
      });

      toast.dismiss(toastId);
      toast.success("Transaction submitted! Waiting for confirmation...");

      // Force a refresh after a short delay to account for block confirmation
      setTimeout(() => {
        refetch();
      }, 5000);

      // The useEffect above will handle the refetch after confirmation
    } catch (error) {
      toast.dismiss(toastId);
      toast.error(
        error instanceof Error ? error.message : "Failed to cancel event"
      );
      console.error("Cancel error:", error);
    } finally {
      setCancelingId(null);
    }
  };

  const deleteEvent = async (eventId: number) => {
    const toastId = toast.loading("Deleting event...");
    try {
      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: contractABI.abi,
        functionName: "deleteEventById",
        args: [eventId],
      });

      toast.dismiss(toastId);
      toast.success("Event deleted successfully!");

      console.log(`🗑️ Event ${eventId} deleted. Refreshing events...`);
      await refetch();
    } catch (error) {
      console.error("🚨 Error deleting event:", {
        error,
        eventId,
        timestamp: new Date().toISOString(),
      });

      toast.dismiss(toastId);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete event"
      );
    }
  };

  if (loading) {
    return (
      <div className="pt-16 text-center">
        <p>Loading your events...</p>
      </div>
    );
  }

  if (isError || error) {
    return (
      <div className="pt-16 text-center text-red-500">
        <p>
          Error:{" "}
          {contractError?.message || error || "Failed to load your events"}
        </p>
      </div>
    );
  }

  return (
    <div className="pt-16 px-4">
      <h3 className="text-2xl font-bold mt-10 mb-6">Created Events</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {events.length > 0 ? (
          events.map((event) => (
            <CreatorEventCard
              key={`${event.index}-${event.owner}`}
              event={event}
              onDelete={deleteEvent}
              onCancel={cancelEvent}
              cancelLoading={cancelingId === event.index}
              loading={isLoading}
            />
          ))
        ) : (
          <p className="text-center text-gray-500 col-span-full">
            You haven't created any events yet.
          </p>
        )}
      </div>
    </div>
  );
}
