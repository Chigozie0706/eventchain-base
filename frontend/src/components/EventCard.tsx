import Image from "next/image";
import Link from "next/link";
import { formatEventDate } from "@/utils/format";

interface Event {
  index: number;
  owner: string;
  eventName: string;
  eventCardImgUrl: string;
  eventDetails: string;
  startDate: number;
  startTime: number;
  endTime: number;
  eventLocation: string;
  isActive: boolean;
}

export default function EventCard({ event }: { event: Event }) {
  const shortAddress = `${event.owner.slice(0, 6)}...${event.owner.slice(-4)}`;
  const formattedDate = formatEventDate(event.startDate);

  return (
    <div className="w-full max-w-xs md:max-w-sm rounded-2xl overflow-hidden shadow-lg bg-white border border-gray-200 mx-auto">
      <img
        src={event.eventCardImgUrl}
        width={500}
        height={300}
        alt="Event Banner"
      />

      <div className="p-4">
        <span className="bg-purple-200 text-purple-700 text-xs font-bold px-3 py-1 rounded-full w-50">
          {shortAddress}
        </span>

        <h2 className="text-sm md:text-base lg:text-lg font-semibold mt-2">
          {event.eventName}
        </h2>

        <p className="text-gray-600 text-xs mt-1">
          <span className="font-semibold">Date:</span> {formattedDate}
        </p>

        <p className=" text-orange-600 text-sm font-semibold mt-5 ">
          <Link href={`/view_event_details/${event.index}`}>View Details</Link>
        </p>
      </div>
    </div>
  );
}
