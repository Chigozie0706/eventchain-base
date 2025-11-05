"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import "@reown/appkit-wallet-button/react";

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [eventsDropdownOpen, setEventsDropdownOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isConnected } = useAccount();

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setEventsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown when route changes
  useEffect(() => {
    setEventsDropdownOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  return (
    <nav className="flex items-center justify-between bg-white px-6 py-4 shadow-md fixed w-full z-50">
      {/* Logo */}
      <div className="text-orange-500 text-xl font-bold">
        <Link href="/">EventChain</Link>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden focus:outline-none"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Navigation Menu (Mobile + Desktop) */}
        <div
          ref={menuRef}
          className={`absolute md:static top-16 left-0 w-full md:w-auto bg-white shadow-md md:shadow-none px-6 py-4 md:p-0 transition-all duration-300 ${
            menuOpen
              ? "flex flex-col space-y-4 md:space-y-0 md:flex md:flex-row md:space-x-6"
              : "hidden md:flex gap-6"
          } text-xs items-center`}
        >
          <Link
            href="/"
            className={`text-gray-700 ${
              pathname === "/" ? "text-orange-600 font-bold" : ""
            }`}
          >
            Home
          </Link>
          <Link
            href="/view_events"
            className={`text-gray-700 ${
              pathname === "/view_events" ? "text-orange-600 font-bold" : ""
            }`}
          >
            Events
          </Link>
          <Link
            href="/create_event"
            className={`text-gray-700 ${
              pathname === "/create_event" ? "text-orange-600 font-bold" : ""
            }`}
          >
            Create Event
          </Link>

          {/* Mobile View - Show My Events links directly */}
          {isConnected && menuOpen && (
            <div className="md:hidden flex flex-col space-y-4 w-full">
              <Link
                href="/event_tickets"
                className={`text-gray-700 ${
                  pathname === "/event_tickets"
                    ? "text-orange-600 font-bold"
                    : ""
                }`}
              >
                My Tickets
              </Link>
              <Link
                href="/view_created_events"
                className={`text-gray-700 ${
                  pathname === "/view_created_events"
                    ? "text-orange-600 font-bold"
                    : ""
                }`}
              >
                Created Events
              </Link>
            </div>
          )}
        </div>

        {/* Desktop View - My Events Dropdown */}
        {isConnected && (
          <div className="relative hidden md:block" ref={dropdownRef}>
            <button
              onClick={() => setEventsDropdownOpen(!eventsDropdownOpen)}
              className="flex items-center gap-1 text-gray-700 hover:text-orange-600 text-xs"
            >
              My Events <ChevronDown size={16} />
            </button>

            {eventsDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg p-2 text-xs">
                <Link
                  href="/event_tickets"
                  className="block px-4 py-2 hover:bg-gray-100 rounded"
                >
                  My Tickets
                </Link>
                <Link
                  href="/view_created_events"
                  className="block px-4 py-2 hover:bg-gray-100 rounded"
                >
                  Created Events
                </Link>
              </div>
            )}
          </div>
        )}

        {/* RainbowKit Connect Button - Always Visible */}
        <div className="ml-2">
          <appkit-button />
        </div>
      </div>
    </nav>
  );
}
