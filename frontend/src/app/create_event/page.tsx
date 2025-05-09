"use client"; // Ensures this component runs on the client side in a Next.js app

import EventForm from "@/components/EventForm";

export default function CreateEvent() {
  return (
    <>
      {/* Page wrapper with top padding to prevent content from being hidden behind fixed headers */}
      <div className="pt-16">
        <EventForm />
      </div>
    </>
  );
}
