// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./GachaCard.sol";

/**
 * @title GachaPool
 * @notice On-chain gacha / pack-opening game on Monad Testnet.
 *
 * Rules:
 *  - Two card pools (Pokemon Pack & Monad Genesis Pack), each with 5 rarity tiers.
 *  - Randomness: keccak256(prevrandao, block.timestamp, msg.sender, nonce).
 *    Suitable for a testnet / low-stakes game. Upgrade to VRF for mainnet.
 *  - Users pay `pool.priceWei` MON to pull one card.
 *  - Users can sell back any card they hold; the contract transfers `card.buybackPriceWei`
 *    MON back and burns the NFT.
 *  - Pool / card configuration is fully public (getPoolInfo, getPoolCards).
 *  - Owner can withdraw profit above the buyback reserve and add reserve funds.
 */
contract GachaPool is Ownable, ReentrancyGuard {
    GachaCard public cardNFT;

    struct Card {
        uint256 id;
        string name;
        uint8 rarity;         // 0=Common 1=Uncommon 2=Rare 3=Epic 4=Legendary
        uint256 weight;       // out of 10000 (e.g. 6000 = 60%)
        uint256 buybackPriceWei;
        string tokenURIBase;  // e.g. "ipfs://..." or a placeholder URL
    }

    struct Pool {
        uint256 id;
        string name;
        uint256 priceWei;
        bool isActive;
        uint256[] cardIds;    // references into _cards mapping
    }

    // Rarity labels (for frontend display)
    string[5] public RARITY_NAMES = ["Common", "Uncommon", "Rare", "Epic", "Legendary"];

    mapping(uint256 => Pool) private _pools;
    mapping(uint256 => Card) private _cards;

    uint256 public poolCount;
    uint256 public cardCount;

    // Per-sender nonce to add entropy
    mapping(address => uint256) private _nonce;

    // ─── Events ───────────────────────────────────────────────────────────────

    event PullResult(
        address indexed buyer,
        uint256 indexed poolId,
        uint256 indexed cardId,
        uint256 tokenId,
        uint8 rarity,
        string cardName
    );

    event CardSold(
        address indexed seller,
        uint256 indexed tokenId,
        uint256 indexed cardId,
        uint256 buybackPriceWei
    );

    event PoolCreated(uint256 indexed poolId, string name, uint256 priceWei);
    event FundsAdded(address indexed by, uint256 amount);
    event FundsWithdrawn(address indexed to, uint256 amount);

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(address _cardNFT) Ownable(msg.sender) {
        cardNFT = GachaCard(_cardNFT);
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    /// @notice Deposit MON into the contract as a buyback reserve.
    function addFunds() external payable onlyOwner {
        emit FundsAdded(msg.sender, msg.value);
    }

    /// @notice Withdraw `amount` MON (profit above reserve). Owner's responsibility
    ///         to not drain the buyback reserve.
    function withdraw(uint256 amount) external onlyOwner nonReentrant {
        require(amount <= address(this).balance, "GachaPool: insufficient balance");
        (bool ok,) = owner().call{value: amount}("");
        require(ok, "GachaPool: transfer failed");
        emit FundsWithdrawn(owner(), amount);
    }

    /// @notice Create a new card pool.
    function createPool(string calldata name, uint256 priceWei) external onlyOwner returns (uint256 poolId) {
        poolId = poolCount++;
        _pools[poolId].id = poolId;
        _pools[poolId].name = name;
        _pools[poolId].priceWei = priceWei;
        _pools[poolId].isActive = true;
        emit PoolCreated(poolId, name, priceWei);
    }

    /// @notice Add a card definition to a pool.
    function addCard(
        uint256 poolId,
        string calldata name,
        uint8 rarity,
        uint256 weight,
        uint256 buybackPriceWei,
        string calldata tokenURIBase
    ) external onlyOwner returns (uint256 cardId) {
        require(poolId < poolCount, "GachaPool: invalid pool");
        cardId = cardCount++;
        _cards[cardId] = Card({
            id: cardId,
            name: name,
            rarity: rarity,
            weight: weight,
            buybackPriceWei: buybackPriceWei,
            tokenURIBase: tokenURIBase
        });
        _pools[poolId].cardIds.push(cardId);
    }

    /// @notice Toggle pool active status.
    function setPoolActive(uint256 poolId, bool active) external onlyOwner {
        require(poolId < poolCount, "GachaPool: invalid pool");
        _pools[poolId].isActive = active;
    }

    // ─── Core: Buy Pack ───────────────────────────────────────────────────────

    /**
     * @notice Purchase one card from a pool.
     * @param poolId Target pool ID.
     * @return tokenId Minted NFT token ID.
     */
    function buyPack(uint256 poolId) external payable nonReentrant returns (uint256 tokenId) {
        Pool storage pool = _pools[poolId];
        require(pool.isActive, "GachaPool: pool inactive");
        require(msg.value == pool.priceWei, "GachaPool: wrong price");
        require(pool.cardIds.length > 0, "GachaPool: no cards");

        // Weighted random selection
        uint256 rand = _random(msg.sender);
        uint256 roll = rand % 10000;

        uint256 cumulative = 0;
        uint256 selectedCardId = pool.cardIds[0]; // fallback to first

        uint256[] storage ids = pool.cardIds;
        for (uint256 i = 0; i < ids.length; i++) {
            cumulative += _cards[ids[i]].weight;
            if (roll < cumulative) {
                selectedCardId = ids[i];
                break;
            }
        }

        Card storage card = _cards[selectedCardId];

        // Build token URI (base + tokenId will be set after mint; pass base for now)
        string memory uri = card.tokenURIBase;

        // Mint NFT to buyer
        tokenId = cardNFT.mint(msg.sender, selectedCardId, poolId, uri);

        emit PullResult(msg.sender, poolId, selectedCardId, tokenId, card.rarity, card.name);
    }

    // ─── Core: Sell Card ──────────────────────────────────────────────────────

    /**
     * @notice Sell an owned card NFT back to the contract for the fixed buyback price.
     * @param tokenId NFT token ID to sell.
     */
    function sellCard(uint256 tokenId) external nonReentrant {
        require(cardNFT.ownerOf(tokenId) == msg.sender, "GachaPool: not owner");

        uint256 cardId = cardNFT.tokenCardId(tokenId);
        Card storage card = _cards[cardId];
        uint256 payout = card.buybackPriceWei;

        require(address(this).balance >= payout, "GachaPool: insufficient reserve");

        // Effects before interaction (CEI pattern)
        // Approve pool to burn (caller must approve, or pool is the operator)
        // Since this contract is not the NFT owner, the NFT contract's burn
        // is called by this contract acting as the authorised pool address.
        cardNFT.burn(tokenId);

        (bool ok,) = msg.sender.call{value: payout}("");
        require(ok, "GachaPool: payout failed");

        emit CardSold(msg.sender, tokenId, cardId, payout);
    }

    // ─── View: Pool & Card Info (open source transparency) ───────────────────

    struct PoolInfo {
        uint256 id;
        string name;
        uint256 priceWei;
        bool isActive;
        uint256 cardCount;
    }

    struct CardInfo {
        uint256 id;
        string name;
        uint8 rarity;
        string rarityName;
        uint256 weight;          // out of 10000
        uint256 buybackPriceWei;
        string tokenURIBase;
    }

    function getPoolInfo(uint256 poolId) external view returns (PoolInfo memory info) {
        require(poolId < poolCount, "GachaPool: invalid pool");
        Pool storage p = _pools[poolId];
        info = PoolInfo({
            id: p.id,
            name: p.name,
            priceWei: p.priceWei,
            isActive: p.isActive,
            cardCount: p.cardIds.length
        });
    }

    function getAllPools() external view returns (PoolInfo[] memory pools) {
        pools = new PoolInfo[](poolCount);
        for (uint256 i = 0; i < poolCount; i++) {
            Pool storage p = _pools[i];
            pools[i] = PoolInfo({
                id: p.id,
                name: p.name,
                priceWei: p.priceWei,
                isActive: p.isActive,
                cardCount: p.cardIds.length
            });
        }
    }

    function getPoolCards(uint256 poolId) external view returns (CardInfo[] memory cards) {
        require(poolId < poolCount, "GachaPool: invalid pool");
        uint256[] storage ids = _pools[poolId].cardIds;
        cards = new CardInfo[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            Card storage c = _cards[ids[i]];
            cards[i] = CardInfo({
                id: c.id,
                name: c.name,
                rarity: c.rarity,
                rarityName: RARITY_NAMES[c.rarity],
                weight: c.weight,
                buybackPriceWei: c.buybackPriceWei,
                tokenURIBase: c.tokenURIBase
            });
        }
    }

    /// @notice Get card info by NFT token ID (for collection display)
    function getCardByToken(uint256 tokenId) external view returns (CardInfo memory card) {
        uint256 cardId = cardNFT.tokenCardId(tokenId);
        Card storage c = _cards[cardId];
        card = CardInfo({
            id: c.id,
            name: c.name,
            rarity: c.rarity,
            rarityName: RARITY_NAMES[c.rarity],
            weight: c.weight,
            buybackPriceWei: c.buybackPriceWei,
            tokenURIBase: c.tokenURIBase
        });
    }

    /// @notice Contract MON balance
    function getReserveBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    function _random(address sender) internal returns (uint256) {
        uint256 rand = uint256(
            keccak256(
                abi.encodePacked(
                    block.prevrandao,
                    block.timestamp,
                    sender,
                    _nonce[sender]++
                )
            )
        );
        return rand;
    }

    // Accept plain ETH transfers (for addFunds shortcut)
    receive() external payable {}
}
