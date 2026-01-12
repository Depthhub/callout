// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PredictionMarkets
 * @notice A prediction market contract for YES/NO binary outcomes
 * @dev Uses USDC (or any ERC20) for betting with a 2% platform fee on winnings
 */
contract PredictionMarkets is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ Errors ============
    error MarketDoesNotExist();
    error MarketEnded();
    error MarketNotEnded();
    error MarketAlreadyResolved();
    error MarketNotResolved();
    error DeadlineMustBeFuture();
    error BetTooSmall();
    error BetTooLarge();
    error InvalidOutcome();
    error NoWinnings();
    error AlreadyClaimed();

    // ============ Events ============
    event MarketCreated(
        uint256 indexed marketId,
        string question,
        uint64 deadline,
        address indexed creator
    );
    event BetPlaced(
        uint256 indexed marketId,
        address indexed user,
        bool isYes,
        uint256 amount
    );
    event MarketResolved(uint256 indexed marketId, bool outcomeYes);
    event Claimed(uint256 indexed marketId, address indexed user, uint256 amount);
    event FeesWithdrawn(address indexed to, uint256 amount);
    event FeeUpdated(uint256 oldFee, uint256 newFee);

    // ============ Structs ============
    struct Market {
        string question;
        uint64 deadline;
        bool resolved;
        bool outcomeYes;
        uint256 yesPool;
        uint256 noPool;
    }

    // ============ State Variables ============
    IERC20 public immutable token;
    uint256 public marketCount;
    uint256 public minBetSize;
    uint256 public maxBetSize;

    // Platform fee in basis points (200 = 2%)
    uint256 public platformFeeBps = 200;
    uint256 public constant MAX_FEE_BPS = 1000; // Max 10%
    uint256 public constant BPS_DENOMINATOR = 10000;

    // Accumulated platform fees
    uint256 public accumulatedFees;

    // Market ID => Market data
    mapping(uint256 => Market) public markets;

    // Market ID => User => YES stake
    mapping(uint256 => mapping(address => uint256)) public yesStakes;

    // Market ID => User => NO stake
    mapping(uint256 => mapping(address => uint256)) public noStakes;

    // Market ID => User => claimed
    mapping(uint256 => mapping(address => bool)) public claimed;

    // ============ Constructor ============
    constructor(
        address _token,
        uint256 _minBetSize,
        uint256 _maxBetSize
    ) Ownable(msg.sender) {
        token = IERC20(_token);
        minBetSize = _minBetSize;
        maxBetSize = _maxBetSize;
    }

    // ============ External Functions ============

    /**
     * @notice Create a new prediction market
     * @param question The question for the market
     * @param deadline Unix timestamp when betting ends
     * @return marketId The ID of the created market
     */
    function createMarket(
        string calldata question,
        uint64 deadline
    ) external returns (uint256 marketId) {
        if (deadline <= block.timestamp) revert DeadlineMustBeFuture();

        marketId = ++marketCount;

        markets[marketId] = Market({
            question: question,
            deadline: deadline,
            resolved: false,
            outcomeYes: false,
            yesPool: 0,
            noPool: 0
        });

        emit MarketCreated(marketId, question, deadline, msg.sender);
    }

    /**
     * @notice Place a YES bet on a market
     * @param marketId The market to bet on
     * @param amount Amount of tokens to bet
     */
    function betYes(uint256 marketId, uint256 amount) external nonReentrant {
        _placeBet(marketId, amount, true);
    }

    /**
     * @notice Place a NO bet on a market
     * @param marketId The market to bet on
     * @param amount Amount of tokens to bet
     */
    function betNo(uint256 marketId, uint256 amount) external nonReentrant {
        _placeBet(marketId, amount, false);
    }

    /**
     * @notice Resolve a market with the outcome (owner only)
     * @param marketId The market to resolve
     * @param outcomeYes True if YES won, false if NO won
     */
    function resolveMarket(uint256 marketId, bool outcomeYes) external onlyOwner {
        Market storage market = markets[marketId];

        if (market.deadline == 0) revert MarketDoesNotExist();
        if (market.resolved) revert MarketAlreadyResolved();
        if (block.timestamp < market.deadline) revert MarketNotEnded();

        market.resolved = true;
        market.outcomeYes = outcomeYes;

        emit MarketResolved(marketId, outcomeYes);
    }

    /**
     * @notice Claim winnings from a resolved market
     * @param marketId The market to claim from
     */
    function claim(uint256 marketId) external nonReentrant {
        Market storage market = markets[marketId];

        if (market.deadline == 0) revert MarketDoesNotExist();
        if (!market.resolved) revert MarketNotResolved();
        if (claimed[marketId][msg.sender]) revert AlreadyClaimed();

        uint256 payout = calculatePayout(marketId, msg.sender);
        if (payout == 0) revert NoWinnings();

        claimed[marketId][msg.sender] = true;

        // Calculate and deduct platform fee (2%)
        uint256 fee = (payout * platformFeeBps) / BPS_DENOMINATOR;
        uint256 userPayout = payout - fee;

        // Accumulate fees for withdrawal
        accumulatedFees += fee;

        token.safeTransfer(msg.sender, userPayout);

        emit Claimed(marketId, msg.sender, userPayout);
    }

    /**
     * @notice Withdraw accumulated platform fees (owner only)
     * @param to Address to send fees to
     */
    function withdrawFees(address to) external onlyOwner {
        uint256 fees = accumulatedFees;
        if (fees == 0) revert NoWinnings();

        accumulatedFees = 0;
        token.safeTransfer(to, fees);

        emit FeesWithdrawn(to, fees);
    }

    /**
     * @notice Update the platform fee (owner only)
     * @param newFeeBps New fee in basis points (100 = 1%)
     */
    function setFee(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= MAX_FEE_BPS, "Fee too high");
        uint256 oldFee = platformFeeBps;
        platformFeeBps = newFeeBps;
        emit FeeUpdated(oldFee, newFeeBps);
    }

    /**
     * @notice Update bet size limits (owner only)
     */
    function setBetLimits(uint256 _minBetSize, uint256 _maxBetSize) external onlyOwner {
        minBetSize = _minBetSize;
        maxBetSize = _maxBetSize;
    }

    // ============ View Functions ============

    /**
     * @notice Get market details
     */
    function getMarket(uint256 marketId) external view returns (
        string memory question,
        uint64 deadline,
        bool resolved,
        bool outcomeYes,
        uint256 yesPool,
        uint256 noPool
    ) {
        Market storage m = markets[marketId];
        return (m.question, m.deadline, m.resolved, m.outcomeYes, m.yesPool, m.noPool);
    }

    /**
     * @notice Get current odds for a market
     * @return yesPercent Percentage chance of YES (0-100)
     * @return noPercent Percentage chance of NO (0-100)
     */
    function getOdds(uint256 marketId) external view returns (
        uint256 yesPercent,
        uint256 noPercent
    ) {
        Market storage market = markets[marketId];
        uint256 total = market.yesPool + market.noPool;

        if (total == 0) {
            return (50, 50);
        }

        yesPercent = (market.yesPool * 100) / total;
        noPercent = 100 - yesPercent;
    }

    /**
     * @notice Get a user's stakes in a market
     */
    function getUserStakes(uint256 marketId, address user) external view returns (
        uint256 yesStake,
        uint256 noStake
    ) {
        return (yesStakes[marketId][user], noStakes[marketId][user]);
    }

    /**
     * @notice Calculate potential payout for a user (before fee)
     */
    function calculatePayout(uint256 marketId, address user) public view returns (uint256 payout) {
        Market storage market = markets[marketId];

        if (!market.resolved) return 0;

        uint256 totalPool = market.yesPool + market.noPool;
        if (totalPool == 0) return 0;

        if (market.outcomeYes) {
            uint256 userStake = yesStakes[marketId][user];
            if (userStake == 0 || market.yesPool == 0) return 0;
            payout = (userStake * totalPool) / market.yesPool;
        } else {
            uint256 userStake = noStakes[marketId][user];
            if (userStake == 0 || market.noPool == 0) return 0;
            payout = (userStake * totalPool) / market.noPool;
        }
    }

    /**
     * @notice Calculate payout after fee deduction
     */
    function calculatePayoutAfterFee(uint256 marketId, address user) external view returns (uint256) {
        uint256 payout = calculatePayout(marketId, user);
        if (payout == 0) return 0;
        uint256 fee = (payout * platformFeeBps) / BPS_DENOMINATOR;
        return payout - fee;
    }

    // ============ Internal Functions ============

    function _placeBet(uint256 marketId, uint256 amount, bool isYes) internal {
        Market storage market = markets[marketId];

        if (market.deadline == 0) revert MarketDoesNotExist();
        if (market.resolved) revert MarketAlreadyResolved();
        if (block.timestamp >= market.deadline) revert MarketEnded();
        if (amount < minBetSize) revert BetTooSmall();
        if (maxBetSize > 0 && amount > maxBetSize) revert BetTooLarge();

        token.safeTransferFrom(msg.sender, address(this), amount);

        if (isYes) {
            market.yesPool += amount;
            yesStakes[marketId][msg.sender] += amount;
        } else {
            market.noPool += amount;
            noStakes[marketId][msg.sender] += amount;
        }

        emit BetPlaced(marketId, msg.sender, isYes, amount);
    }
}
