"use client";
import AttendeeList from "./AttendeeList";
import {
  MapPin,
  CalendarDays,
  Ticket,
  Handshake,
  UsersRound,
  Check,
  Info,
} from "lucide-react";
import { formatEventDate, formatEventTime, formatPrice } from "@/utils/format";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import SelfQRcodeWrapper, {
  SelfAppBuilder,
  type SelfApp,
} from "@selfxyz/qrcode";
import { useParams, useRouter } from "next/navigation";

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
  minimumAge: number;
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
  const router = useRouter();
  const formattedStartDate = formatEventDate(event.startDate);
  const formattedEndDate = formatEventDate(event.endDate);
  const formattedStartTime = formatEventTime(Number(event.startTime));
  const formattedEndTime = formatEventTime(Number(event.endTime));
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null);
  const [imgError, setImgError] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const { id: eventId } = useParams<{ id: string }>();
  const [showToast, setShowToast] = useState(false);
  const [verificationComplete, setVerificationComplete] = useState(false);

  const mentoTokens: Record<string, string> = {
    "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913": "USD",
    "0x0000000000000000000000000000000000000000": "eth",
  };

  // Normalize by trimming and lowercasing both sides
  const normalizedToken = event.paymentToken?.trim().toLowerCase();
  const tokenName =
    Object.entries(mentoTokens).find(
      ([address]) => address.toLowerCase() === normalizedToken
    )?.[1] || event.paymentToken;

  const formattedPrice = formatPrice(event.ticketPrice);
  const minimumAge = event.minimumAge;
  const requiresAgeVerification = minimumAge > 0;

  const getImageUrl = () => {
    if (!event.eventCardImgUrl) return "/default-event.jpg";
    return event.eventCardImgUrl.startsWith("http")
      ? event.eventCardImgUrl
      : `https://ipfs.io/ipfs/${event.eventCardImgUrl}`;
  };
  const NGROK_URL = process.env.NEXT_PUBLIC_SELF_ENDPOINT;

  const endpoint = `${NGROK_URL}/api/events/${eventId}/verify?minimumAge=${minimumAge}`;

  // Use useEffect to ensure code only executes on the client side
  useEffect(() => {
    if (!address || !requiresAgeVerification) return; // Don't initialize if no address is connected

    try {
      // const userId = v4();

      const userId = `${address}`;
      const app = new SelfAppBuilder({
        appName: process.env.NEXT_PUBLIC_SELF_APP_NAME || "EventChain",
        scope: process.env.NEXT_PUBLIC_SELF_SCOPE || "event-chain",
        endpoint,
        logoBase64:
          "https://pluspng.com/img-png/images-owls-png-hd-owl-free-download-png-png-image-485.png",
        userId,
        userIdType: "hex",
        disclosures: {
          minimumAge: Number(minimumAge),
        },
      }).build();

      setSelfApp(app);
    } catch (error) {
      console.error("Failed to initialize Self app:", error);
    }
  }, [address, endpoint, minimumAge]);

  const displayToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleSuccessfulVerification = () => {
    displayToast("Verification successful! You can now register.");
    setVerificationComplete(true);
  };

  // Check if current user is registered
  const isRegistered = address && attendees.includes(address);

  return (
    <div className="container mx-auto px-6 md:px-12 lg:px-20 py-8">
      {/* Banner Section */}
      <div className="relative w-full flex justify-center mt-4 h-[300px] md:h-[400px] lg:h-[450px] overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/40 via-gray-800/40 to-gray-900/40 backdrop-blur-md rounded-2xl"></div>
        <div className="relative w-full max-w-5xl rounded-2xl overflow-hidden">
          <img
            src={imgError ? "/default-event.jpg" : getImageUrl()}
            alt="Event Banner"
            width={1200}
            height={500}
            className="w-full h-full object-cover"
            // className="rounded-2xl"
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
              {formattedPrice} {tokenName}
            </p>
          </div>

          {/* Age Restriction */}
          <div className="mt-6">
            <h3 className="text-md font-semibold flex items-center space-x-2 text-gray-800">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-600"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
              </svg>
              <span>Age Restriction</span>
            </h3>
            {requiresAgeVerification ? (
              <p className="text-gray-700 text-sm">
                This event is restricted to attendees aged{" "}
                <span className="font-semibold">{minimumAge}+ years</span>.
                You'll need to verify your age to register.
              </p>
            ) : (
              <p className="text-gray-700 text-sm">
                This event has{" "}
                <span className="font-semibold">no age restrictions</span>. All
                ages are welcome to attend.
              </p>
            )}
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
                {formattedPrice} {tokenName}
              </span>
            </p>
          </div>

          {!address ? (
            <div className="w-full bg-gray-600 text-white mt-4 py-2 rounded-lg text-lg font-semibold text-center">
              Connect Wallet to Verify
            </div>
          ) : isRegistered ? (
            <div className="w-full bg-green-600 text-white mt-4 py-2 rounded-lg text-lg font-semibold flex items-center justify-center gap-2">
              <Check className="w-5 h-5" />
              Registered
            </div>
          ) : (
            <>
              {/* Verification QR Code Section */}
              {requiresAgeVerification && !verificationComplete && (
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 w-full mt-4">
                  <div className="flex justify-center mb-4">
                    {selfApp ? (
                      <SelfQRcodeWrapper
                        selfApp={selfApp}
                        onSuccess={handleSuccessfulVerification}
                      />
                    ) : (
                      <div className="w-[256px] h-[256px] bg-gray-200 animate-pulse flex items-center justify-center">
                        <p className="text-gray-500 text-sm">
                          Loading QR Code...
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Configuration Info */}
                  <div className="border-t border-gray-200 pt-3">
                    <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Verification Requirements:
                    </h3>
                    <ul className="text-xs sm:text-sm text-gray-600 space-y-1">
                      <li className="flex items-center">
                        <svg
                          className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span>
                          Minimum Age:{" "}
                          <span className="font-medium ml-1">
                            {minimumAge}+ years
                          </span>
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Information message when no age verification is needed */}
              {!requiresAgeVerification && !verificationComplete && (
                <div className="bg-blue-50 rounded-xl shadow-lg p-4 sm:p-6 w-full mt-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-medium text-blue-800 mb-1">
                        No Age Restriction
                      </h3>
                      <p className="text-xs sm:text-sm text-blue-600">
                        This event has no minimum age requirement. You can
                        proceed directly to registration.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {/* Show registration button if verification is complete OR no age verification is needed */}
              {(verificationComplete || !requiresAgeVerification) && (
                <button
                  className="w-full bg-orange-600 text-white mt-4 py-2 rounded-lg text-lg font-semibold hover:bg-orange-700 transition"
                  onClick={buyTicket}
                  disabled={loading || registering}
                >
                  {registering ? "Processing..." : "Complete Registration"}
                </button>
              )}
            </>
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

          {/* Toast notification */}
          {showToast && (
            <div className="fixed bottom-4 right-4 bg-gray-800 text-white py-2 px-4 rounded shadow-lg animate-fade-in text-sm">
              {toastMessage}
            </div>
          )}
        </div>
        ;
      </div>
    </div>
  );
}
