"use client";
import React from "react";
import blockies from "ethereum-blockies";

interface AttendeeListProps {
  attendees: string[];
}

const AttendeeList: React.FC<AttendeeListProps> = ({ attendees }) => {
  return (
    <div className="flex flex-wrap gap-3">
      {attendees.map((address, index) => {
        const icon = blockies
          .create({ seed: address.toLowerCase(), size: 8, scale: 4 })
          .toDataURL();

        return (
          <div key={index} className="flex flex-col items-center mb-3">
            <img
              src={icon}
              alt="Attendee Avatar"
              className="w-10 h-10 rounded-full border border-gray-300"
            />
            <p className="text-xs text-gray-500 mt-1">
              {address.slice(0, 6)}...{address.slice(-4)}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default AttendeeList;
