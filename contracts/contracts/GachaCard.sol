// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GachaCard
 * @notice ERC-721 NFT card minted exclusively by the GachaPool contract.
 *         Each token maps to a card definition living inside the pool.
 */
contract GachaCard is ERC721URIStorage, Ownable {
    // Only the GachaPool contract may mint / burn tokens
    address public gachaPool;

    uint256 private _nextTokenId;

    // tokenId => card ID in the pool (for lookup from frontend)
    mapping(uint256 => uint256) public tokenCardId;
    // tokenId => pool ID
    mapping(uint256 => uint256) public tokenPoolId;

    event CardMinted(address indexed to, uint256 indexed tokenId, uint256 indexed cardId, uint256 poolId);
    event CardBurned(uint256 indexed tokenId);

    modifier onlyPool() {
        require(msg.sender == gachaPool, "GachaCard: caller is not pool");
        _;
    }

    constructor() ERC721("MonGachaCard", "MGC") Ownable(msg.sender) {
        _nextTokenId = 1;
    }

    /// @notice Set the authorised GachaPool contract address (owner only, one-time-ish)
    function setGachaPool(address _pool) external onlyOwner {
        require(_pool != address(0), "GachaCard: zero address");
        gachaPool = _pool;
    }

    /// @notice Mint a new card NFT. Called by GachaPool.
    function mint(
        address to,
        uint256 cardId,
        uint256 poolId,
        string calldata tokenURI_
    ) external onlyPool returns (uint256 tokenId) {
        tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI_);
        tokenCardId[tokenId] = cardId;
        tokenPoolId[tokenId] = poolId;
        emit CardMinted(to, tokenId, cardId, poolId);
    }

    /// @notice Burn an NFT. Called by GachaPool when user sells back a card.
    function burn(uint256 tokenId) external onlyPool {
        _burn(tokenId);
        emit CardBurned(tokenId);
    }

    /// @notice Total tokens minted so far (1-indexed, so subtract 1 for count)
    function totalMinted() external view returns (uint256) {
        return _nextTokenId - 1;
    }
}
