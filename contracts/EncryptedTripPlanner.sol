// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Encrypted Trip Planner
/// @notice Stores fully encrypted travel plans on-chain and aggregates encrypted travel insights per style.
contract EncryptedTripPlanner is SepoliaConfig {
    uint8 private constant _STYLE_COUNT = 4;

    enum TravelStyle {
        Adventure,
        Culture,
        Wellness,
        Family
    }

    struct TripCiphertext {
        bytes routeCiphertext;
        bytes scheduleCiphertext;
        uint64 createdAt;
        uint8 style;
        string title;
    }

    struct TripMetadata {
        string title;
        uint64 createdAt;
        uint8 style;
    }

    struct StyleInsight {
        uint8 style;
        euint32 encryptedTripCount;
        euint32 encryptedNightTotal;
    }

    mapping(address => TripCiphertext[]) private _userTrips;
    mapping(uint8 => euint32) private _styleTripCounts;
    mapping(uint8 => euint32) private _styleNightTotals;

    event TripStored(address indexed owner, uint256 indexed tripId, uint8 indexed style, string title);
    event TripOverwritten(address indexed owner, uint256 indexed tripId, uint8 indexed style);
    event StatsShared(uint8 indexed style, address indexed viewer);

    /// @notice Encrypts and saves a private trip plan, while updating encrypted style insights.
    /// @param routeCiphertext AES-GCM ciphertext with the route and experiences entered by the user.
    /// @param scheduleCiphertext AES-GCM ciphertext representing timed agenda items.
    /// @param title A short plaintext label that helps the owner distinguish trips.
    /// @param style The selected travel style bucket. Must be < 4.
    /// @param encryptedNights Client-side encrypted FHE value representing the duration in nights.
    /// @param nightsProof Input proof for the encrypted nights.
    /// @param encryptedUnit FHE encrypted value equal to 1 for incrementing encrypted counters.
    /// @param unitProof Input proof for the encrypted unit.
    /// @return tripId Index of the freshly stored trip for the caller wallet.
    function storeTrip(
        bytes calldata routeCiphertext,
        bytes calldata scheduleCiphertext,
        string calldata title,
        uint8 style,
        externalEuint32 encryptedNights,
        bytes calldata nightsProof,
        externalEuint32 encryptedUnit,
        bytes calldata unitProof
    ) external returns (uint256 tripId) {
        _validateTripPayload(routeCiphertext, scheduleCiphertext, title, style);

        TripCiphertext memory payload = TripCiphertext({
            routeCiphertext: routeCiphertext,
            scheduleCiphertext: scheduleCiphertext,
            createdAt: uint64(block.timestamp),
            style: style,
            title: title
        });

        _userTrips[msg.sender].push(payload);
        tripId = _userTrips[msg.sender].length - 1;

        _updateEncryptedStats(style, encryptedNights, nightsProof, encryptedUnit, unitProof, msg.sender);

        emit TripStored(msg.sender, tripId, style, title);
    }

    /// @notice Overwrites an existing trip ciphertext for the caller.
    /// @dev Does not update encrypted stats because the original submission already impacted aggregates.
    function overwriteTrip(
        uint256 tripId,
        bytes calldata routeCiphertext,
        bytes calldata scheduleCiphertext,
        string calldata title,
        uint8 style
    ) external {
        TripCiphertext storage trip = _getTripForWrite(msg.sender, tripId);
        _validateTripPayload(routeCiphertext, scheduleCiphertext, title, style);
        trip.routeCiphertext = routeCiphertext;
        trip.scheduleCiphertext = scheduleCiphertext;
        trip.createdAt = uint64(block.timestamp);
        trip.style = style;
        trip.title = title;

        emit TripOverwritten(msg.sender, tripId, style);
    }

    /// @notice Returns encrypted trip payload for the caller.
    function getMyTrip(uint256 tripId) external view returns (TripCiphertext memory) {
        return _getTripForRead(msg.sender, tripId);
    }

    /// @notice Lists lightweight metadata for all trips owned by the caller.
    function listMyTrips() external view returns (TripMetadata[] memory result) {
        TripCiphertext[] storage items = _userTrips[msg.sender];
        result = new TripMetadata[](items.length);
        for (uint256 i = 0; i < items.length; i++) {
            result[i] = TripMetadata({
                title: items[i].title,
                createdAt: items[i].createdAt,
                style: items[i].style
            });
        }
    }

    /// @notice Authorises the caller to decrypt encrypted stats for a specific travel style.
    function subscribeToStyleStats(uint8 style) external {
        _assertValidStyle(style);
        _authorizeStyleFor(style, msg.sender);
        emit StatsShared(style, msg.sender);
    }

    /// @notice Grants a delegate permission to decrypt the encrypted stats of a style.
    function shareStyleStats(uint8 style, address viewer) external {
        require(viewer != address(0), "viewer required");
        _assertValidStyle(style);
        _authorizeStyleFor(style, viewer);
        emit StatsShared(style, viewer);
    }

    /// @notice Returns encrypted style insights (trip count + nights) for the provided style index.
    function getStyleStats(uint8 style) external view returns (euint32 tripCount, euint32 totalNights) {
        _assertValidStyle(style);
        return (_styleTripCounts[style], _styleNightTotals[style]);
    }

    /// @notice Returns encrypted stats for every available travel style.
    function getAllStyleStats() external view returns (StyleInsight[] memory insights) {
        insights = new StyleInsight[](_STYLE_COUNT);
        for (uint8 i = 0; i < _STYLE_COUNT; i++) {
            insights[i] = StyleInsight({
                style: i,
                encryptedTripCount: _styleTripCounts[i],
                encryptedNightTotal: _styleNightTotals[i]
            });
        }
    }

    /// @notice Returns number of stored trips for the caller.
    function myTripCount() external view returns (uint256) {
        return _userTrips[msg.sender].length;
    }

    function _getTripForRead(address owner, uint256 tripId) private view returns (TripCiphertext memory) {
        require(tripId < _userTrips[owner].length, "invalid trip id");
        return _userTrips[owner][tripId];
    }

    function _getTripForWrite(address owner, uint256 tripId) private view returns (TripCiphertext storage) {
        require(tripId < _userTrips[owner].length, "invalid trip id");
        return _userTrips[owner][tripId];
    }

    function _updateEncryptedStats(
        uint8 style,
        externalEuint32 encryptedNights,
        bytes calldata nightsProof,
        externalEuint32 encryptedUnit,
        bytes calldata unitProof,
        address sender
    ) private {
        euint32 nightsValue = FHE.fromExternal(encryptedNights, nightsProof);
        euint32 unitValue = FHE.fromExternal(encryptedUnit, unitProof);

        _styleNightTotals[style] = FHE.add(_styleNightTotals[style], nightsValue);
        _styleTripCounts[style] = FHE.add(_styleTripCounts[style], unitValue);

        FHE.allowThis(_styleNightTotals[style]);
        FHE.allowThis(_styleTripCounts[style]);
        _authorizeStyleFor(style, sender);
    }

    function _authorizeStyleFor(uint8 style, address viewer) private {
        if (viewer == address(0)) {
            return;
        }
        FHE.allow(_styleNightTotals[style], viewer);
        FHE.allow(_styleTripCounts[style], viewer);
    }

    function _assertValidStyle(uint8 style) private pure {
        require(style < _STYLE_COUNT, "invalid style");
    }

    function _validateTripPayload(
        bytes calldata routeCiphertext,
        bytes calldata scheduleCiphertext,
        string calldata title,
        uint8 style
    ) private pure {
        _assertValidStyle(style);
        require(routeCiphertext.length > 0, "route cipher required");
        require(scheduleCiphertext.length > 0, "schedule cipher required");
        require(bytes(title).length >= 3, "title too short");
    }
}
