
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const EncryptedTripPlannerABI = {
  "abi": [
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint8",
          "name": "style",
          "type": "uint8"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "viewer",
          "type": "address"
        }
      ],
      "name": "StatsShared",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "tripId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "uint8",
          "name": "style",
          "type": "uint8"
        }
      ],
      "name": "TripOverwritten",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "tripId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "uint8",
          "name": "style",
          "type": "uint8"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "title",
          "type": "string"
        }
      ],
      "name": "TripStored",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "getAllStyleStats",
      "outputs": [
        {
          "components": [
            {
              "internalType": "uint8",
              "name": "style",
              "type": "uint8"
            },
            {
              "internalType": "euint32",
              "name": "encryptedTripCount",
              "type": "bytes32"
            },
            {
              "internalType": "euint32",
              "name": "encryptedNightTotal",
              "type": "bytes32"
            }
          ],
          "internalType": "struct EncryptedTripPlanner.StyleInsight[]",
          "name": "insights",
          "type": "tuple[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "tripId",
          "type": "uint256"
        }
      ],
      "name": "getMyTrip",
      "outputs": [
        {
          "components": [
            {
              "internalType": "bytes",
              "name": "routeCiphertext",
              "type": "bytes"
            },
            {
              "internalType": "bytes",
              "name": "scheduleCiphertext",
              "type": "bytes"
            },
            {
              "internalType": "uint64",
              "name": "createdAt",
              "type": "uint64"
            },
            {
              "internalType": "uint8",
              "name": "style",
              "type": "uint8"
            },
            {
              "internalType": "string",
              "name": "title",
              "type": "string"
            }
          ],
          "internalType": "struct EncryptedTripPlanner.TripCiphertext",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint8",
          "name": "style",
          "type": "uint8"
        }
      ],
      "name": "getStyleStats",
      "outputs": [
        {
          "internalType": "euint32",
          "name": "tripCount",
          "type": "bytes32"
        },
        {
          "internalType": "euint32",
          "name": "totalNights",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "listMyTrips",
      "outputs": [
        {
          "components": [
            {
              "internalType": "string",
              "name": "title",
              "type": "string"
            },
            {
              "internalType": "uint64",
              "name": "createdAt",
              "type": "uint64"
            },
            {
              "internalType": "uint8",
              "name": "style",
              "type": "uint8"
            }
          ],
          "internalType": "struct EncryptedTripPlanner.TripMetadata[]",
          "name": "result",
          "type": "tuple[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "myTripCount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "tripId",
          "type": "uint256"
        },
        {
          "internalType": "bytes",
          "name": "routeCiphertext",
          "type": "bytes"
        },
        {
          "internalType": "bytes",
          "name": "scheduleCiphertext",
          "type": "bytes"
        },
        {
          "internalType": "string",
          "name": "title",
          "type": "string"
        },
        {
          "internalType": "uint8",
          "name": "style",
          "type": "uint8"
        }
      ],
      "name": "overwriteTrip",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "protocolId",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint8",
          "name": "style",
          "type": "uint8"
        },
        {
          "internalType": "address",
          "name": "viewer",
          "type": "address"
        }
      ],
      "name": "shareStyleStats",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes",
          "name": "routeCiphertext",
          "type": "bytes"
        },
        {
          "internalType": "bytes",
          "name": "scheduleCiphertext",
          "type": "bytes"
        },
        {
          "internalType": "string",
          "name": "title",
          "type": "string"
        },
        {
          "internalType": "uint8",
          "name": "style",
          "type": "uint8"
        },
        {
          "internalType": "externalEuint32",
          "name": "encryptedNights",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "nightsProof",
          "type": "bytes"
        },
        {
          "internalType": "externalEuint32",
          "name": "encryptedUnit",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "unitProof",
          "type": "bytes"
        }
      ],
      "name": "storeTrip",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "tripId",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint8",
          "name": "style",
          "type": "uint8"
        }
      ],
      "name": "subscribeToStyleStats",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]
} as const;

