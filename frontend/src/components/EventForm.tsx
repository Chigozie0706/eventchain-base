"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { parseUnits } from "ethers";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import contractABI from "../contract/abi.json";

interface EventData {
  eventName: string;
  eventCardImgUrl: string;
  eventDetails: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  eventLocation: string;
  eventPrice: string;
  paymentToken: string;
}

// Update with your deployed contract address on Base
const CONTRACT_ADDRESS = "0xb3972Ca9d6BD396CE0C1Cc2065bBb386f9892474";

// Base network token options (mainnet and testnet)
// const BASE_TOKENS = {
//   // Mainnet tokens
//   mainnet: [
//     { symbol: "USDC", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" },
//     { symbol: "WETH", address: "0x4200000000000000000000000000000000000006" },
//     { symbol: "DAI", address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb" },
//   ],
//   // Testnet tokens (Base Sepolia)
//   testnet: [
//     { symbol: "USDC", address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e" },
//     { symbol: "WETH", address: "0x4200000000000000000000000000000000000006" },
//   ],
// };

const tokenOptions = [
  {
    symbol: "USDC",
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    decimals: 6,
  },
  {
    symbol: "WETH",
    address: "0x4200000000000000000000000000000000000006",
    decimals: 18,
  },
];

// Default to testnet tokens
// const tokenOptions = BASE_TOKENS.testnet;

const EventForm = () => {
  const router = useRouter();
  const [eventData, setEventData] = useState<EventData>({
    eventName: "",
    eventCardImgUrl: "",
    eventDetails: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    eventLocation: "",
    eventPrice: "",
    paymentToken: tokenOptions[0].address,
  });
  const [loading, setLoading] = useState(false);
  const { address, chainId } = useAccount();

  // Wagmi hooks for contract interaction
  const {
    writeContract: write,
    data: hash,
    isPending: isWriting,
    error: writeError,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setEventData({ ...eventData, [e.target.name]: e.target.value });
  };

  // Validate form fields with comprehensive checks
  const validateForm = () => {
    try {
      // Check all required fields
      if (
        !eventData.eventName ||
        !eventData.eventDetails ||
        !eventData.startDate ||
        !eventData.endDate ||
        !eventData.startTime ||
        !eventData.endTime ||
        !eventData.eventLocation ||
        !eventData.eventPrice
      ) {
        throw new Error("Please fill in all required fields");
      }

      // Create datetime objects
      const startDateTime = new Date(
        `${eventData.startDate}T${eventData.startTime}`
      );
      const endDateTime = new Date(`${eventData.endDate}T${eventData.endTime}`);

      // Validate dates
      if (startDateTime.getTime() < Date.now()) {
        throw new Error("The event must start in the future");
      }

      if (endDateTime.getTime() <= startDateTime.getTime()) {
        throw new Error("End date/time must be after start date/time");
      }

      // Validate price
      const price = parseFloat(eventData.eventPrice);
      if (isNaN(price))
        throw new Error("Please enter a valid number for price");
      if (price <= 0) throw new Error("Price must be greater than 0");

      // Validate payment token
      if (
        !tokenOptions.some((token) => token.address === eventData.paymentToken)
      ) {
        throw new Error("Selected payment token is not supported");
      }

      return true;
    } catch (error: any) {
      console.error("Form validation error:", {
        error: error.message,
        formData: eventData,
        timestamp: new Date().toISOString(),
      });
      toast.error(error.message);
      return false;
    }
  };

  const createEvent = async () => {
    if (!validateForm()) return;
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      setLoading(true);
      console.log("Starting event creation process...", {
        eventData,
        userAddress: address,
        timestamp: new Date().toISOString(),
      });

      // Prepare date/time values
      const startDateTime = new Date(
        `${eventData.startDate}T${eventData.startTime}`
      );
      const endDateTime = new Date(`${eventData.endDate}T${eventData.endTime}`);

      const startDate = BigInt(Math.floor(startDateTime.getTime() / 1000));
      const endDate = BigInt(Math.floor(endDateTime.getTime() / 1000));
      const startTime = BigInt(
        startDateTime.getHours() * 3600 + startDateTime.getMinutes() * 60
      );
      const endTime = BigInt(
        endDateTime.getHours() * 3600 + endDateTime.getMinutes() * 60
      );
      const selectedToken = tokenOptions.find(
        (t) => t.address === eventData.paymentToken
      );
      const priceInWei = parseUnits(
        eventData.eventPrice,
        selectedToken?.decimals || 18
      );

      console.log("Prepared contract call parameters:", {
        startDate: startDate.toString(),
        endDate: endDate.toString(),
        startTime: startTime.toString(),
        endTime: endTime.toString(),
        priceInWei: priceInWei.toString(),
        timestamp: new Date().toISOString(),
      });

      // Execute contract call
      write({
        address: CONTRACT_ADDRESS,
        abi: contractABI.abi,
        functionName: "createEvent",
        args: [
          eventData.eventName,
          eventData.eventCardImgUrl,
          eventData.eventDetails,
          startDate,
          endDate,
          startTime,
          endTime,
          eventData.eventLocation,
          priceInWei,
          eventData.paymentToken,
        ],
      });
    } catch (error: any) {
      console.error("Event creation failed:", {
        error: error.message,
        stack: error.stack,
        eventData,
        userAddress: address,
        timestamp: new Date().toISOString(),
      });
      toast.error(error.message || "Failed to create event");
      setLoading(false);
    }
  };

  const handleTokenChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEventData({ ...eventData, paymentToken: e.target.value });
  };

  // Handle transaction states
  useEffect(() => {
    let toastId: string | undefined;

    if (isWriting) {
      console.log("Transaction signing initiated...");
      toastId = toast.loading("Confirming transaction...");
    }
    if (isConfirming) {
      console.log("Transaction pending confirmation...", { hash });
      toastId = toast.loading("Processing transaction...");
    }
    if (isConfirmed) {
      console.log("Transaction confirmed:", { hash });
      toast.dismiss(toastId);
      toast.success("Event created successfully!", { duration: 3000 });
      setLoading(false);
      // Reset form and redirect
      setEventData({
        eventName: "",
        eventCardImgUrl: "",
        eventDetails: "",
        startDate: "",
        endDate: "",
        startTime: "",
        endTime: "",
        eventLocation: "",
        eventPrice: "",
        paymentToken: tokenOptions[0].address,
      });
      router.push("/view_events");
    }
    if (writeError) {
      console.error("Transaction failed:", {
        error: writeError,
        hash,
        timestamp: new Date().toISOString(),
      });
      toast.error(writeError.message || "Transaction failed");
      setLoading(false);
    }

    return () => {
      if (toastId) toast.dismiss(toastId);
    };
  }, [isWriting, isConfirming, isConfirmed, writeError, hash, router]);

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-lg my-20">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
        Create Your Event
      </h2>

      {/* Form fields */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium text-sm mb-2">
          Event Title *
        </label>
        <input
          type="text"
          name="eventName"
          value={eventData.eventName}
          onChange={handleChange}
          placeholder="Enter event title"
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-5"
        />
      </div>

      {/* Event Card Image */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium text-sm mb-2">
          Event Image URL *
        </label>
        <input
          type="text"
          name="eventCardImgUrl"
          value={eventData.eventCardImgUrl}
          onChange={handleChange}
          placeholder="https://example.com/image.jpg"
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-5"
        />
      </div>

      {/* Event Details */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2 text-sm">
          Event Description *
        </label>
        <textarea
          name="eventDetails"
          value={eventData.eventDetails}
          onChange={handleChange}
          placeholder="Enter event description"
          rows={4}
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        ></textarea>
      </div>

      {/* Start Date */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2 text-sm">
          Start Date *
        </label>
        <input
          type="date"
          name="startDate"
          value={eventData.startDate}
          onChange={handleChange}
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-5"
        />
      </div>

      {/* End Date */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2 text-sm">
          End Date *
        </label>
        <input
          type="date"
          name="endDate"
          value={eventData.endDate}
          onChange={handleChange}
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-5"
        />
      </div>

      {/* Start & End Time */}
      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <label className="block text-gray-700 font-medium mb-2 text-sm">
            Start Time *
          </label>
          <input
            type="time"
            name="startTime"
            value={eventData.startTime}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-5"
          />
        </div>
        <div className="flex-1">
          <label className="block text-gray-700 font-medium mb-2 text-sm">
            End Time *
          </label>
          <input
            type="time"
            name="endTime"
            value={eventData.endTime}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-5"
          />
        </div>
      </div>

      {/* Event Location */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2 text-sm">
          Location *
        </label>
        <input
          type="text"
          name="eventLocation"
          value={eventData.eventLocation}
          onChange={handleChange}
          placeholder="Enter event location"
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-5"
        />
      </div>

      {/* Select Payment Token */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium text-sm mb-2">
          Payment Token *
        </label>
        <select
          name="paymentToken"
          value={eventData.paymentToken}
          onChange={handleTokenChange}
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-5"
        >
          <option value="" disabled>
            Select a payment token
          </option>
          {tokenOptions.map((token) => (
            <option key={token.address} value={token.address}>
              {token.symbol}
            </option>
          ))}
        </select>
      </div>

      {/* Event Price */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2 text-sm">
          Ticket Price *
        </label>
        <input
          type="number"
          name="eventPrice"
          value={eventData.eventPrice}
          onChange={handleChange}
          placeholder="Enter ticket price"
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-5"
        />
      </div>

      <button
        className="w-full bg-orange-700 text-white p-3 rounded-lg font-semibold hover:bg-orange-800 transition"
        onClick={createEvent}
        disabled={loading || isWriting || isConfirming}
      >
        {loading || isWriting || isConfirming
          ? "Processing..."
          : "Create Event"}
      </button>
    </div>
  );
};

export default EventForm;
