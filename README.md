# **EventChain**

A **decentralized event ticketing platform** built on the **Base network**, allowing users to create events, buy tickets, and request refunds in multiple tokens.

**[Live Demo](https://eventchain-base-git-main-chigozie0706s-projects.vercel.app/)**

**[GitHub Repository](https://github.com/Chigozie0706/eventchain-base)**

---

## **Features**

**Decentralized Ticketing** – Secure and transparent event ticketing powered by **smart contracts**.  
**Multi-Token Payments** – Buy tickets using **USDC, WETH**, and more.  
**Refund System** – Request refunds in the same token used for payment if an event is canceled.  
**Event Management** – Organizers can create, update, and deactivate events.  
**Base Integration** – Uses USDC, WETH on Base for payments and event validation.

---

## **Project Structure**

```
EventChain/
│── backend/          # Smart contracts (Hardhat + Solidity)
│── frontend/   # Next.js frontend for interacting with the contract
│── README.md         # Project documentation
```

---

## **Installation & Setup**

### **1 Clone the Repository**

```sh
git clone https://github.com/Chigozie0706/eventchain-base.git
cd eventchain-base
```

### **2 Install Dependencies**

#### **Backend**

```sh
cd backend
pnpm install  # Or use npm install / yarn install
```

#### **Frontend**

```sh
cd frontend
pnpm install
```

---

## ** Environment Variables**

Create a **`.env`** file in both the **backend** and **event-frontend** directories.

### **Backend (`backend/.env`)**

```sh
PRIVATE_KEY=your_metamask_wallet_private_key
```

## **Running the Project**

### **1 compile the Smart Contract (Backend)**

```sh
cd backend
yarn hardhat compile
```

### **2 Deploy the Smart Contract**

```sh
npx hardhat ignition deploy ./ignition/modules/EventChain.js --network celo_alfajores
```

### **3 Start the Frontend**

```sh
cd event-frontend
pnpm run dev   # Runs the Next.js app on http://localhost:3000
```

---

## **Deployment & Transactions**

### **Smart Contract Addresses (Base Mainnet)**

| Contract   | Address                                      | Status   |
| ---------- | -------------------------------------------- | -------- |
| EventChain | `0xb3972Ca9d6BD396CE0C1Cc2065bBb386f9892474` | **Live** |

### **Recent Transactions**

1. **Latest TX 1**  
   🔗 [View on BaseScan](https://basescan.org/tx/0x2d4af5be6ba94cb1f45cf7c5db67471ab884c13825bf388dee4fd0886955555c)

   - Contract: `0xb3972Ca9d6BD396CE0C1Cc2065bBb386f9892474`

2. **Latest TX 2**  
   🔗 [View on BaseScan](https://basescan.org/tx/0xc7229640074ce51700fe1be97df40232895fd5f7c08a65aadbc0156424cb5f93)

   - Contract: `0xb3972Ca9d6BD396CE0C1Cc2065bBb386f9892474`

3. **Latest TX 3**  
   🔗 [View on BaseScan](https://basescan.org/tx/0x63d6eff478e48c3186e49921defce5049f3d048c4526133588c51fe8ede108bf)

   - Contract: `0xb3972Ca9d6BD396CE0C1Cc2065bBb386f9892474`

4. **Latest TX 4**  
   🔗 [View on BaseScan](https://basescan.org/tx/0x725a916cf39f7aea05d97be510b98ad25b3c7cfc74ee08c8be9b620ac1d8a18d)

   - Contract: `0xb3972Ca9d6BD396CE0C1Cc2065bBb386f9892474`

---

### **Architecture**

#### **Tech Stack**

- **Frontend:** Next.js (React + TypeScript)
- **Backend:** Solidity smart contract (Hardhat, Hardhat Ignition)
- **Blockchain:** Base
- **Wallet Integration:** MetaMask, Celo Extension Wallet

#### **Challenges & Implementation Notes**

- **Multi-token support:** Implementing refunds in the same token used for purchases was tricky. Solved by restricting users to pay with the same token for all tickets in a single event and tracking purchase history for refunds.
- **Deployment automation:** Hardhat Ignition simplified contract deployment but required additional debugging for module dependencies.

#### **Future Enhancements**

- **NFT-based ticketing** for secure, transferable event tickets.
- **Gas fee optimizations** for cost-efficient transactions.
- **Frontend dashboard** for event organizers to track sales & refunds.

---

## **Contributing**

Pull requests are welcome! Follow these steps:

1. **Fork** the repository.
2. **Create a new branch** (`feature/new-feature`).
3. **Commit** your changes.
4. **Push** and open a **Pull Request**.

---

## **License**

This project is **open-source** under the **MIT License**.
