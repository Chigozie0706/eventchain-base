"use client"; // Ensures this component runs on the client side in a Next.js app

import EventTickets from "@/components/EventTickets";

export default function EventTicket() {
  return (
    <>
      {/* Page wrapper with top padding to prevent content from being hidden behind fixed headers */}
      <div className="pt-16">
        {/* Renders the EventTickets component, which displays available event tickets */}
        <EventTickets />
      </div>
    </>
  );
}
