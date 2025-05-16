# **EventChain Frontend**

[![Next.js](https://img.shields.io/badge/Next.js-13+-blue)](https://nextjs.org/)  
[![TypeScript](https://img.shields.io/badge/TypeScript-✔️-blue)](https://www.typescriptlang.org/)  
 [![Smart Contracts](https://img.shields.io/badge/Smart_Contracts-Solidity-orange)](https://soliditylang.org/)

**EventChain** is a decentralized event ticketing platform powered by **Next.js** and **Base network**. It allows users to **create events, buy tickets, and request refunds** while ensuring **transparency and security** via smart contracts.

**[Live Demo](https://eventchain-git-main-chigozie0706s-projects.vercel.app/)**  
**[Backend Repository](../backend/)**

---

## **Features**

**Decentralized Ticketing** – Tickets are securely recorded on the blockchain.  
**Multi-Token Payments** – Supports **USDC, WETH**, and more.  
**Refund Mechanism** – Users can get refunds in case of event cancellations.  
**Blockchain-Powered Transparency** – All transactions are visible on **basescan**.  
**Smart Contract-Based Security** – No centralized authority, reducing fraud risks.

---

<!-- ## **Project Structure** -->

```plaintext
event-frontend/
│── src/
│   ├── app/               # Next.js App Router structure
│   │   ├── api/           # API handlers for contract interactions
│   │   ├── create_event/  # Event creation UI
│   │   ├── event_tickets/ # Ticket purchasing & management UI
│   │   ├── view_created_events/ # Dashboard for event creators
│   │   ├── view_event_details/ # Individual event details page
│   │   ├── view_events/   # Event listing page
│   │   ├── layout.tsx     # Global layout wrapper
│   │   ├── page.tsx       # Main landing page
│   ├── components/        # Reusable UI components
│   │   ├── AttendeeList.tsx     # List of attendees
│   │   ├── CreatorEventCard.tsx # Event card for organizers
│   │   ├── EventCard.tsx        # Event preview card
│   │   ├── EventForm.tsx        # Form for event creation
│   │   ├── EventPage.tsx        # Full event details page
│   │   ├── EventTickets.tsx     # Ticket purchase UI
│   │   ├── HeroSection.tsx      # Landing page banner
│   │   ├── Navbar.tsx           # Navigation bar
│   ├── context/           # Context API for smart contract interactions
│   │   ├── ContractContext.tsx  # Manages blockchain connections
│   ├── contract/          # Smart contract-related files
│   │   ├── abi.json       # Compiled smart contract ABI
│── .gitignore
│── eslint.config.mjs
│── next-env.d.ts
│── README.md (this file)
```

---

## **Installation & Setup**

### **1 Prerequisites**

Ensure you have the following installed:

- **[Node.js](https://nodejs.org/)** (v16+ recommended)
- **[pnpm](https://pnpm.io/)** (or npm/yarn)
- **[Metamask](https://metamask.io/)** browser extension

### **2 Clone the Repository**

```sh
git clone https://github.com/Chigozie0706/eventchain.git
cd event-frontend
```

### **3 Install Dependencies**

```sh
pnpm install  # Or use npm install / yarn install
```

### **4 Start the Development Server**

```sh
pnpm dev  # Or use npm run dev / yarn dev
```

Your application will be available at **[http://localhost:3000](http://localhost:3000)**.

---

## **Deployment**

The frontend is deployed on **Vercel**.

---

## **Additional Resources**

- [Next.js Documentation](https://nextjs.org/docs)
- [EventChain Backend Repository](../backend/)

---

## **Contributing**

We welcome contributions!

1. **Fork** the repository
2. **Create a new branch** (`feature/new-feature`)
3. **Commit your changes**
4. **Push** and open a **Pull Request**

For major changes, please open an issue first to discuss them.

---

## **License**

This project is open-source and licensed under the **MIT License**.

---
