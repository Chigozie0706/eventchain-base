import { Trash2, XCircle, Eye } from "lucide-react";
import Link from "next/link";

interface CreatorEventCardProps {
  event: {
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
    isCanceled: boolean;
    ticketPrice: number;
    paymentToken: string;
  };
  onDelete: (eventId: number) => void;
  onCancel: (eventId: number) => Promise<void>;
  loading: boolean;
  cancelLoading: boolean;
}

// Base Mainnet token addresses
const BASE_TOKENS: Record<string, { symbol: string; decimals: number }> = {
  "0x8a21CF9Ba08Ae709D64Cb25AfAA951183EC9FF6D": { symbol: "USDC", decimals: 6 }, // Base USDC
  "0x4200000000000000000000000000000000000006": {
    symbol: "WETH",
    decimals: 18,
  }, // Wrapped Ether
  "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA": {
    symbol: "USDbC",
    decimals: 6,
  }, // USD Base Coin
};

const CreatorEventCard: React.FC<CreatorEventCardProps> = ({
  event,
  onDelete,
  onCancel,
  loading,
  cancelLoading,
}) => {
  // Format price with correct decimals
  const formatTicketPrice = (price: number, tokenAddress: string) => {
    const tokenInfo = BASE_TOKENS[tokenAddress] || {
      symbol: "TOK",
      decimals: 18,
    };
    const formatted = price / Math.pow(10, tokenInfo.decimals);
    return formatted.toFixed(tokenInfo.decimals > 4 ? 4 : 2);
  };

  const tokenInfo = BASE_TOKENS[event.paymentToken] || {
    symbol: `${event.paymentToken.slice(0, 4)}...${event.paymentToken.slice(
      -4
    )}`,
    decimals: 18,
  };

  const formattedTicketPrice = formatTicketPrice(
    event.ticketPrice,
    event.paymentToken
  );

  // Format date and time
  const formattedStartDate = new Date(
    event.startDate * 1000
  ).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const formattedStartTime = new Date(
    event.startTime * 1000
  ).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const formattedEndTime = new Date(event.endTime * 1000).toLocaleTimeString(
    undefined,
    {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }
  );

  return (
    <div
      className={`relative flex flex-col w-full max-w-sm p-4 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow ${
        event.isCanceled ? "opacity-70 border-2 border-red-200" : ""
      }`}
    >
      {/* Action Buttons */}
      <div className="absolute top-3 right-3 flex gap-2">
        <Link href={`/view_event_details/${event.index}`} passHref>
          <button
            className="bg-blue-500 text-white p-2 rounded-full shadow-md hover:bg-blue-600 transition"
            aria-label="View event details"
          >
            <Eye size={16} />
          </button>
        </Link>

        {/* Cancel Button */}
        {event.isActive && !event.isCanceled && (
          <button
            onClick={() => onCancel(event.index)}
            disabled={cancelLoading}
            className="bg-yellow-500 text-white p-2 rounded-full shadow-md hover:bg-yellow-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Cancel event"
          >
            <XCircle size={16} />
          </button>
        )}

        {/* Delete Button */}
        {/* <button
          onClick={() => onDelete(event.index)}
          disabled={loading}
          className="bg-red-500 text-white p-2 rounded-full shadow-md hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Delete event"
        >
          <Trash2 size={16} />
        </button> */}
      </div>

      {/* Canceled Badge */}
      {event.isCanceled && (
        <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold">
          CANCELED
        </div>
      )}

      {/* Event Image */}
      <div className="w-full h-48 overflow-hidden rounded-lg">
        <img
          src={event.eventCardImgUrl || "/default-event.jpg"}
          alt={event.eventName}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/default-event.jpg";
          }}
        />
      </div>

      {/* Event Details */}
      <div className="mt-4 space-y-2">
        <h2 className="text-lg font-semibold text-gray-900 line-clamp-1">
          {event.eventName}
        </h2>

        <div className="flex items-center text-sm text-gray-600">
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>{formattedStartDate}</span>
        </div>

        <div className="flex items-center text-sm text-gray-600">
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>
            {formattedStartTime} - {formattedEndTime}
          </span>
        </div>

        <div className="flex items-center text-sm text-gray-600">
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="line-clamp-1">{event.eventLocation}</span>
        </div>

        <div className="pt-2 flex justify-between items-center">
          <span
            className={`text-sm font-medium ${
              event.isCanceled
                ? "text-red-500"
                : event.isActive
                ? "text-green-500"
                : "text-gray-500"
            }`}
          >
            {event.isCanceled
              ? "Canceled"
              : event.isActive
              ? "Active"
              : "Inactive"}
          </span>
          <span className="text-sm font-semibold text-gray-900">
            {formattedTicketPrice} {tokenInfo.symbol}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CreatorEventCard;
