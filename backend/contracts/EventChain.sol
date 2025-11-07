// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

// Import OpenZeppelin contracts for security and functionality
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IERC677 is IERC20 {
    function transferAndCall(
        address to,
        uint value,
        bytes calldata data
    ) external returns (bool);
}
/**
 * @title EventChain
 * @dev A decentralized event ticketing smart contract that supports multiple tokens.
 * Features include:
 * - Event creation and management
 * - Ticket purchasing with supported ERC20 tokens
 * - Refund functionality
 * - Secure fund handling
 * - Event capacity limits
 */
contract EventChain is ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice Mapping to track supported payment tokens (Mento stablecoins: cUSD, cEUR, cREAL)
    mapping(address => bool) public supportedTokens;

    /// @notice Maximum values for event parameters to prevent abuse
    uint256 public constant MAX_NAME_LENGTH = 100;
    uint256 public constant MAX_URL_LENGTH = 200;
    uint256 public constant MAX_DETAILS_LENGTH = 1000;
    uint256 public constant MAX_LOCATION_LENGTH = 150;
    uint256 public constant MAX_TICKET_PRICE = 1e24; // 1M tokens
    uint256 public constant MAX_ATTENDEES = 5000;
    uint256 public constant MIN_EVENT_DURATION = 1 hours;
    uint256 public constant REFUND_BUFFER = 5 hours;

    /// @notice Contract pause status - emergency stop mechanism
    bool public paused;

    /// @notice Address of the UBI pool that receives 1% fee from G$ token purchases
    address public ubiPool = 0x43d72Ff17701B2DA814620735C39C620Ce0ea4A1;

    address public constant Base = address(0);

    /**
     * @dev Constructor to initialize supported tokens.
     * @param _supportedTokens List of token addresses to be supported for payments.
     */
    constructor(address[] memory _supportedTokens) {
        // Explicitly handle ZeroAddress
        supportedTokens[address(0)] = true; // Native

        // Handle other tokens
        for (uint i = 0; i < _supportedTokens.length; i++) {
            address token = _supportedTokens[i];
            if (token != address(0)) {
                // Skip ZeroAddress in loop
                supportedTokens[token] = true;
            }
        }
    }

    receive() external payable {}
    /// @notice Structure to store comprehensive event details
    struct Event {
        address owner;
        string eventName;
        string eventCardImgUrl;
        string eventDetails;
        uint64 startDate;
        uint64 endDate;
        uint64 startTime;
        uint64 endTime;
        string eventLocation;
        bool isActive;
        uint256 ticketPrice;
        uint256 fundsHeld;
        uint256 minimumAge;
        bool isCanceled;
        bool fundsReleased;
        address paymentToken;
    }

    /// @notice Array of all created events
    Event[] public events;

    /// @notice Mapping of event ID to list of attendees
    mapping(uint256 => address[]) internal eventAttendees;

    /// @notice Mapping of creator address to their events
    mapping(address => Event[]) internal creatorEvents;

    /// @notice Mapping to track if a user has purchased a ticket for an event
    mapping(uint256 => mapping(address => bool)) public hasPurchasedTicket;

    mapping(uint256 => uint256) public baseFundsHeld;

    /// @notice Event emitted when a new event is created
    event EventCreated(
        uint256 indexed eventId,
        address indexed owner,
        string eventName
    );

    /// @notice Event emitted when an event is updated
    event EventUpdated(
        uint256 indexed eventId,
        address indexed owner,
        string eventName
    );

    /// @notice Event emitted when a ticket is purchased
    event TicketPurchased(
        uint256 indexed eventId,
        address indexed buyer,
        uint256 amount,
        address paymentToken
    );

    /// @notice Event emitted when an event is canceled
    event EventCanceled(uint256 indexed eventId);

    /// @notice Event emitted when a refund is issued
    event RefundIssued(
        uint256 indexed eventId,
        address indexed user,
        uint256 amount
    );

    /// @notice Event emitted when funds are released to the event owner
    event FundsReleased(uint256 indexed eventId, uint256 amount);

    /// @dev Modifier to check if the caller is the owner of the event
    modifier onlyOwner(uint256 _index) {
        require(events[_index].owner == msg.sender, "Not event owner");
        _;
    }

    /// @dev Modifier to validate event exists and is active
    modifier validEvent(uint256 _index) {
        require(_index < events.length, "Invalid event");
        require(events[_index].owner != address(0), "Event doesn't exist");
        _;
    }

    /// @dev Modifier to check if contract is not paused
    modifier whenNotPaused() {
        require(!paused, "Contract paused");
        _;
    }

    /**
     * @dev Internal function to add a new supported payment token
     * @param _token Address of the token to support
     */

    function _addSupportedToken(address _token) internal {
        supportedTokens[_token] = true;
    }

    /**
     * @dev Safe ERC20 transferFrom with success check
     * @param token ERC20 token interface
     * @param from Sender address
     * @param to Recipient address
     * @param amount Amount to transfer
     */

    function _safeTransferFrom(
        IERC20 token,
        address from,
        address to,
        uint256 amount
    ) internal {
        bool success = token.transferFrom(from, to, amount);
        require(success, "Transfer failed");
    }

    /**
     * @dev Safe ERC20 transfer with success check
     * @param token ERC20 token interface
     * @param to Recipient address
     * @param amount Amount to transfer
     */

    function _safeTransfer(IERC20 token, address to, uint256 amount) internal {
        bool success = token.transfer(to, amount);
        require(success, "Transfer failed");
    }

    /**
     * @dev ERC-677 token transfer callback
     * @param from Sender address
     * @param value Amount transferred
     * @param data Additional data (contains event ID)
     */

    function onTokenTransfer(
        address from,
        uint256 value,
        bytes calldata data
    ) external returns (bool) {
        // Only accept transfers from G$ token contract
        require(
            msg.sender == 0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A,
            "Only G$ token"
        );

        // Extract event ID from data (first 32 bytes)
        uint256 eventId = abi.decode(data[:32], (uint256));

        // Process ticket purchase
        _processTicketPurchase(from, eventId, value);

        return true;
    }

    /**
     * @dev Internal function to handle ticket purchase logic
     * @notice Validates purchase conditions, processes payment, and updates event state
     * Includes special handling for G$ token with 1% fee deduction
     */

    function _processTicketPurchase(
        address buyer,
        uint256 eventId,
        uint256 amount
    ) internal validEvent(eventId) whenNotPaused {
        Event storage event_ = events[eventId];
        require(
            event_.paymentToken == 0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A,
            "Only for G$ token"
        );

        require(event_.startDate > block.timestamp, "Event expired");
        require(event_.isActive, "Event inactive");
        require(!hasPurchasedTicket[eventId][buyer], "Already purchased");
        require(
            eventAttendees[eventId].length < MAX_ATTENDEES,
            "Event at capacity"
        );
        require(amount == event_.ticketPrice, "Incorrect amount");

        hasPurchasedTicket[eventId][buyer] = true;
        eventAttendees[eventId].push(buyer);

        uint256 fee = (amount * 100) / 10000; // 1% fee
        uint256 netAmount = amount - fee;

        // Send fee to UBI pool
        if (fee > 0 && ubiPool != address(0)) {
            IERC20(event_.paymentToken).transfer(ubiPool, fee);
        }

        // Add remaining funds to event
        event_.fundsHeld += netAmount;

        emit TicketPurchased(eventId, buyer, amount, event_.paymentToken);
    }

    /**
     * @notice Create a new event with comprehensive details
     * @dev Creates a new event with all necessary parameters and performs validation
     * @param _eventName The name of the event (1-100 chars)
     * @param _eventCardImgUrl Image URL for event display (1-200 chars)
     * @param _eventDetails Description of the event (1-1000 chars)
     * @param _startDate Start date of the event (timestamp)
     * @param _endDate End date of the event (timestamp)
     * @param _startTime Daily start time of the event
     * @param _endTime Daily end time of the event
     * @param _eventLocation Physical or virtual location (1-150 chars)
     * @param _ticketPrice Price of one ticket (0 < price <= MAX_TICKET_PRICE)
     * @param _paymentToken Address of the supported payment token
     */
    function createEvent(
        string calldata _eventName,
        string calldata _eventCardImgUrl,
        string calldata _eventDetails,
        uint64 _startDate,
        uint64 _endDate,
        uint64 _startTime,
        uint64 _endTime,
        string calldata _eventLocation,
        uint256 _ticketPrice,
        uint256 _minimumAge,
        address _paymentToken
    ) public whenNotPaused {
        // Input validation
        require(
            bytes(_eventName).length > 0 &&
                bytes(_eventName).length <= MAX_NAME_LENGTH,
            "Invalid name"
        );
        require(
            bytes(_eventCardImgUrl).length > 0 &&
                bytes(_eventCardImgUrl).length <= MAX_URL_LENGTH,
            "Invalid URL"
        );
        require(
            bytes(_eventDetails).length > 0 &&
                bytes(_eventDetails).length <= MAX_DETAILS_LENGTH,
            "Invalid details"
        );
        require(
            bytes(_eventLocation).length > 0 &&
                bytes(_eventLocation).length <= MAX_LOCATION_LENGTH,
            "Invalid location"
        );
        require(
            _ticketPrice > 0 && _ticketPrice <= MAX_TICKET_PRICE,
            "Invalid price"
        );
        require(_startDate >= block.timestamp, "Start date must be future");
        require(
            _endDate >= _startDate + MIN_EVENT_DURATION,
            "Duration too short"
        );
        require(supportedTokens[_paymentToken], "Unsupported token");
        // Create new event struct
        Event memory newEvent = Event({
            owner: msg.sender,
            eventName: _eventName,
            eventCardImgUrl: _eventCardImgUrl,
            eventDetails: _eventDetails,
            startDate: _startDate,
            endDate: _endDate,
            startTime: _startTime,
            endTime: _endTime,
            eventLocation: _eventLocation,
            ticketPrice: _ticketPrice,
            isActive: true,
            fundsHeld: 0,
            isCanceled: false,
            minimumAge: _minimumAge,
            fundsReleased: false,
            paymentToken: _paymentToken
        });

        events.push(newEvent);
        creatorEvents[msg.sender].push(newEvent);

        emit EventCreated(events.length - 1, msg.sender, _eventName);
    }

    /**
     * @notice Purchase a ticket for a specific event
     * @dev Handles ticket purchase with ERC20 tokens and prevents double purchases
     * @param _index The ID of the event to purchase a ticket for
     */

    function buyTicket(
        uint256 _index
    ) public payable nonReentrant validEvent(_index) whenNotPaused {
        Event storage event_ = events[_index];

        require(event_.startDate > block.timestamp, "Event expired");
        require(event_.isActive, "Event inactive");
        require(!hasPurchasedTicket[_index][msg.sender], "Already purchased");
        require(
            eventAttendees[_index].length < MAX_ATTENDEES,
            "Event at capacity"
        );

        uint256 price = event_.ticketPrice;
        bool isGdollar = (event_.paymentToken ==
            0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A);

        // Handle  payments
        if (event_.paymentToken == Base) {
            require(msg.value == price, "Incorrect Base amount");
            baseFundsHeld[_index] += price;
        }
        // Handle G$ token (with fee)
        else if (isGdollar) {
            // For G$ token: use transferAndCall + deduct 1% fee
            bytes memory data = abi.encode(_index);
            IERC677(event_.paymentToken).transferAndCall(
                address(this),
                price,
                data
            );

            uint256 fee = price / 100; // 1% fee
            uint256 netAmount = price - fee;

            // Send fee to UBI pool (handled in onTokenTransfer)
            event_.fundsHeld += netAmount;
        }
        // Handle other ERC20 tokens
        else {
            // For other tokens: no fee, full amount goes to fundsHeld
            require(
                IERC20(event_.paymentToken).allowance(
                    msg.sender,
                    address(this)
                ) >= price,
                "Insufficient allowance"
            );
            _safeTransferFrom(
                IERC20(event_.paymentToken),
                msg.sender,
                address(this),
                price
            );
            event_.fundsHeld += price; // Full amount
        }

        hasPurchasedTicket[_index][msg.sender] = true;
        eventAttendees[_index].push(msg.sender);
        emit TicketPurchased(_index, msg.sender, price, event_.paymentToken);
    }
    /**
     * @dev Internal function to process refunds
     * @param _index Event ID
     * @param refundAmount Amount to refund
     */
    function _processRefund(uint256 _index, uint256 refundAmount) internal {
        hasPurchasedTicket[_index][msg.sender] = false;
        events[_index].fundsHeld -= refundAmount;

        // Remove from attendees list
        address[] storage attendees = eventAttendees[_index];
        for (uint256 i = 0; i < attendees.length; i++) {
            if (attendees[i] == msg.sender) {
                attendees[i] = attendees[attendees.length - 1];
                attendees.pop();
                break;
            }
        }

        _safeTransfer(
            IERC20(events[_index].paymentToken),
            msg.sender,
            refundAmount
        );

        emit RefundIssued(_index, msg.sender, refundAmount);
    }

    /**
     * @notice Cancel an event (only callable by event owner)
     * @dev Marks event as canceled and inactive
     * @param _index The ID of the event to cancel
     */
    function cancelEvent(
        uint256 _index
    ) public onlyOwner(_index) validEvent(_index) whenNotPaused {
        require(events[_index].isActive, "Already canceled");

        events[_index].isActive = false;
        events[_index].isCanceled = true;

        emit EventCanceled(_index);
    }

    /**
     * @notice Request a refund for a ticket
     * @dev Allows refunds for canceled events or before refund buffer period
     * @param _index The ID of the event to request refund for
     */

    function requestRefund1(
        uint256 _index
    ) public nonReentrant validEvent(_index) whenNotPaused {
        require(hasPurchasedTicket[_index][msg.sender], "No ticket purchased");

        uint256 refundAmount = events[_index].ticketPrice;

        // For G$ token, refund 99% (1% fee already taken)
        if (
            events[_index].paymentToken ==
            0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A
        ) {
            refundAmount = (refundAmount * 99) / 100;
        }

        // Check if contract has enough funds (now matches refundAmount)
        require(events[_index].fundsHeld >= refundAmount, "Insufficient funds");

        if (!events[_index].isCanceled) {
            require(
                block.timestamp < events[_index].startDate - REFUND_BUFFER,
                "Refund period ended"
            );
        }

        _processRefund(_index, refundAmount);
    }

    function requestRefund(
        uint256 _index
    ) public nonReentrant validEvent(_index) whenNotPaused {
        require(hasPurchasedTicket[_index][msg.sender], "No ticket purchased");

        uint256 refundAmount = events[_index].ticketPrice;
        address paymentToken = events[_index].paymentToken;

        // Handle G$ token (refund 99%)
        if (paymentToken == 0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A) {
            refundAmount = (refundAmount * 99) / 100;
        }

        // Check available funds
        if (paymentToken == Base) {
            require(
                baseFundsHeld[_index] >= refundAmount,
                "Insufficient Base funds"
            );
        } else {
            require(
                events[_index].fundsHeld >= refundAmount,
                "Insufficient funds"
            );
        }

        if (!events[_index].isCanceled) {
            require(
                block.timestamp < events[_index].startDate - REFUND_BUFFER,
                "Refund period ended"
            );
        }

        // Process refund
        hasPurchasedTicket[_index][msg.sender] = false;

        if (paymentToken == Base) {
            baseFundsHeld[_index] -= refundAmount;
            (bool success, ) = msg.sender.call{value: refundAmount}("");
            require(success, "Base refund failed");
        } else {
            events[_index].fundsHeld -= refundAmount;
            IERC20(paymentToken).safeTransfer(msg.sender, refundAmount);
        }

        // Remove from attendees list
        address[] storage attendees = eventAttendees[_index];
        for (uint256 i = 0; i < attendees.length; i++) {
            if (attendees[i] == msg.sender) {
                attendees[i] = attendees[attendees.length - 1];
                attendees.pop();
                break;
            }
        }

        emit RefundIssued(_index, msg.sender, refundAmount);
    }
    /**
     * @notice Release collected funds to event owner after event ends
     * @dev Transfers held funds to event owner and marks funds as released
     * @param _index The ID of the event to release funds for
     */
    function releaseFunds1(
        uint256 _index
    ) public onlyOwner(_index) nonReentrant {
        require(_index < events.length, "Invalid event ID");
        require(
            block.timestamp > events[_index].endDate,
            "Event has not ended yet"
        );
        require(
            !events[_index].isCanceled,
            "Cannot release funds for a canceled event"
        );
        require(!events[_index].fundsReleased, "Funds already released");

        uint256 amountToRelease = events[_index].fundsHeld;
        events[_index].fundsHeld = 0;
        events[_index].fundsReleased = true;

        require(
            IERC20(events[_index].paymentToken).transfer(
                msg.sender,
                amountToRelease
            ),
            "Fund transfer failed"
        );

        emit FundsReleased(_index, amountToRelease);
    }

    function releaseFunds(
        uint256 _index
    ) public onlyOwner(_index) nonReentrant {
        require(_index < events.length, "Invalid event ID");
        require(
            block.timestamp > events[_index].endDate,
            "Event has not ended yet"
        );
        require(
            !events[_index].isCanceled,
            "Cannot release funds for canceled event"
        );
        require(!events[_index].fundsReleased, "Funds already released");

        uint256 amountToRelease;
        address paymentToken = events[_index].paymentToken;

        if (paymentToken == Base) {
            amountToRelease = baseFundsHeld[_index];
            baseFundsHeld[_index] = 0;
            (bool success, ) = msg.sender.call{value: amountToRelease}("");
            require(success, "Base transfer failed");
        } else {
            amountToRelease = events[_index].fundsHeld;
            events[_index].fundsHeld = 0;
            IERC20(paymentToken).safeTransfer(msg.sender, amountToRelease);
        }

        events[_index].fundsReleased = true;
        emit FundsReleased(_index, amountToRelease);
    }

    // View functions for accessing event data

    /**
     * @notice Get comprehensive event details by ID
     * @param _index The event ID to query
     * @return Event details, attendees list, and creator's other events
     */
    function getEventById(
        uint256 _index
    ) public view returns (Event memory, address[] memory, Event[] memory) {
        require(_index < events.length, "Event does not exist");
        return (
            events[_index],
            eventAttendees[_index],
            creatorEvents[events[_index].owner]
        );
    }

    /**
     * @notice Get attendees list for an event
     * @param _index The event ID to query
     * @return Array of attendee addresses
     */
    function getAttendees(
        uint256 _index
    ) public view returns (address[] memory) {
        require(_index < events.length, "Invalid event ID");
        return eventAttendees[_index];
    }

    /**
     * @notice Get total number of created events
     * @return Count of all events
     */
    function getEventLength() public view returns (uint256) {
        return events.length;
    }

    /**
     * @notice Get all events created by a specific creator.
     * @param _creator The address of the event creator.
     * @return An array of events created by the given address.
     */
    function getEventsByCreator(
        address _creator
    ) public view returns (Event[] memory) {
        return creatorEvents[_creator];
    }

    /**
     * @notice Get all active events.
     * @return An array of event IDs and corresponding active event details.
     */
    function getAllEvents()
        public
        view
        returns (uint256[] memory, Event[] memory)
    {
        uint count = 0;
        for (uint i = 0; i < events.length; i++) {
            if (events[i].isActive) {
                count++;
            }
        }

        uint256[] memory indexes = new uint256[](count);
        Event[] memory activeEvents = new Event[](count);
        uint j = 0;
        for (uint i = 0; i < events.length; i++) {
            if (events[i].isActive) {
                indexes[j] = i;
                activeEvents[j] = events[i];
                j++;
            }
        }
        return (indexes, activeEvents);
    }

    /**
     * @notice Get events that the caller has purchased tickets for.
     * @return An array of event IDs and corresponding event details.
     */
    function getUserEvents()
        public
        view
        returns (uint256[] memory, Event[] memory)
    {
        uint count = 0;

        // Count the number of events the user has purchased a ticket for
        for (uint i = 0; i < events.length; i++) {
            if (hasPurchasedTicket[i][msg.sender]) {
                count++;
            }
        }

        // Create arrays with the correct size
        uint256[] memory eventIds = new uint256[](count);
        Event[] memory userEvents = new Event[](count);
        uint j = 0;

        // Populate the arrays with the user's events
        for (uint i = 0; i < events.length; i++) {
            if (hasPurchasedTicket[i][msg.sender]) {
                eventIds[j] = i;
                userEvents[j] = events[i];
                j++;
            }
        }

        return (eventIds, userEvents);
    }

    /**
     * @notice Get all active events created by the caller.
     * @return An array of event IDs and corresponding active event details.
     */
    function getActiveEventsByCreator()
        public
        view
        returns (uint256[] memory, Event[] memory)
    {
        uint count = 0;
        for (uint i = 0; i < events.length; i++) {
            if (events[i].owner == msg.sender && events[i].isActive) {
                count++;
            }
        }

        uint256[] memory eventIds = new uint256[](count);
        Event[] memory activeEvents = new Event[](count);
        uint j = 0;
        for (uint i = 0; i < events.length; i++) {
            if (events[i].owner == msg.sender && events[i].isActive) {
                eventIds[j] = i;
                activeEvents[j] = events[i];
                j++;
            }
        }
        return (eventIds, activeEvents);
    }
}
