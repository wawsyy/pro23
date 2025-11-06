import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const CONTRACT_NAME = "EncryptedTripPlanner";

// Try multiple possible paths for the root directory
const possibleRoots = [
  path.resolve(".."),  // Standard: frontend/ -> root/
  path.resolve("../.."),  // If we're deeper
  path.resolve(process.cwd(), ".."),  // From current working directory
];

// Find the root directory that contains deployments
let dir = null;
for (const possibleRoot of possibleRoots) {
  const deploymentsPath = path.join(possibleRoot, "deployments");
  if (fs.existsSync(deploymentsPath)) {
    dir = possibleRoot;
    break;
  }
}

// Fallback to standard relative path
if (!dir) {
  dir = path.resolve("..");
}

const dirname = path.basename(dir);

// <root>/packages/site/components
const outdir = path.resolve("./abi");

if (!fs.existsSync(outdir)) {
  fs.mkdirSync(outdir, { recursive: true });
}

const line =
  "\n===================================================================\n";

if (!fs.existsSync(dir)) {
  console.error(
    `${line}Unable to locate ${rel}. Expecting <root>/packages/${dirname}${line}`
  );
  process.exit(1);
}

if (!fs.existsSync(outdir)) {
  console.error(`${line}Unable to locate ${outdir}.${line}`);
  process.exit(1);
}

const deploymentsDir = path.join(dir, "deployments");
// if (!fs.existsSync(deploymentsDir)) {
//   console.error(
//     `${line}Unable to locate 'deployments' directory.\n\n1. Goto '${dirname}' directory\n2. Run 'npx hardhat deploy --network ${chainName}'.${line}`
//   );
//   process.exit(1);
// }

function deployOnHardhatNode() {
  if (process.platform === "win32") {
    // Not supported on Windows
    return;
  }
  try {
    execSync(`./deploy-hardhat-node.sh`, {
      cwd: path.resolve("./scripts"),
      stdio: "inherit",
    });
  } catch (e) {
    console.error(`${line}Script execution failed: ${e}${line}`);
    process.exit(1);
  }
}

function resolveChainDirectory(chainName) {
  const preferred = path.join(deploymentsDir, chainName);
  if (fs.existsSync(preferred)) {
    return preferred;
  }
  if (chainName === "localhost") {
    const fallback = path.join(deploymentsDir, "hardhat");
    if (fs.existsSync(fallback)) {
      return fallback;
    }
  }
  return preferred;
}

function readDeployment(chainName, chainId, contractName, optional) {
  const chainDeploymentDir = resolveChainDirectory(chainName);
  if (!fs.existsSync(chainDeploymentDir) && chainId === 31337) {
    // Try to auto-deploy the contract on hardhat node!
    deployOnHardhatNode();
  }

  if (!fs.existsSync(chainDeploymentDir)) {
    if (optional) {
      // Only show warning for optional deployments (like sepolia)
      console.warn(
        `⚠️  Sepolia deployment not found at '${chainDeploymentDir}'. Using zero address. To deploy: npx hardhat deploy --network sepolia`
      );
    } else {
      console.error(
        `${line}Unable to locate '${chainDeploymentDir}' directory.\n\n1. Goto '${dirname}' directory\n2. Run 'npx hardhat deploy --network ${chainName}'.${line}`
      );
    }
    if (!optional) {
      process.exit(1);
    }
    return undefined;
  }

  const jsonString = fs.readFileSync(
    path.join(chainDeploymentDir, `${contractName}.json`),
    "utf-8"
  );

  const obj = JSON.parse(jsonString);
  obj.chainId = chainId;

  return obj;
}

// Auto deployed on Linux/Mac (will fail on windows)
let deployLocalhost = readDeployment("localhost", 31337, CONTRACT_NAME, false /* optional */);

// Sepolia is optional
let deploySepolia = readDeployment("sepolia", 11155111, CONTRACT_NAME, true /* optional */);

// Fallback for Vercel builds or when deployments are not available
// Use hardcoded addresses from previous deployments
const FALLBACK_ADDRESSES = {
  localhost: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  sepolia: "0x271cf992495f9d14e1C0B1aB6dCC8D801bb72C42"
};

// If localhost deployment is missing (e.g., in Vercel build), try to use a minimal ABI
if (!deployLocalhost) {
  console.warn(`⚠️  Localhost deployment not found. Using fallback for build.`);
  // Try to read from existing generated ABI file as fallback
  const existingABIPath = path.join(outdir, `${CONTRACT_NAME}ABI.ts`);
  if (fs.existsSync(existingABIPath)) {
    try {
      const existingContent = fs.readFileSync(existingABIPath, "utf-8");
      const abiMatch = existingContent.match(/export const \w+ABI = ({[\s\S]*?}) as const;/);
      if (abiMatch) {
        const parsed = JSON.parse(abiMatch[1]);
        deployLocalhost = { abi: parsed.abi, address: FALLBACK_ADDRESSES.localhost };
        console.log(`✅ Using existing ABI from ${existingABIPath}`);
      }
    } catch (e) {
      console.warn(`⚠️  Could not parse existing ABI: ${e.message}`);
    }
  }
  
  // If still no ABI, exit with error (this should not happen if deployments are committed)
  if (!deployLocalhost) {
    console.error(
      `${line}Unable to locate localhost deployment and no fallback ABI found.\n\nFor Vercel builds, ensure deployments are committed to the repository or run 'npm run genabi' locally first.${line}`
    );
    process.exit(1);
  }
}

if (!deploySepolia) {
  deploySepolia = { abi: deployLocalhost.abi, address: FALLBACK_ADDRESSES.sepolia };
  console.warn(`⚠️  Using fallback Sepolia address: ${FALLBACK_ADDRESSES.sepolia}`);
}

if (deployLocalhost && deploySepolia) {
  if (
    JSON.stringify(deployLocalhost.abi) !== JSON.stringify(deploySepolia.abi)
  ) {
    console.error(
      `${line}Deployments on localhost and Sepolia differ. Cant use the same abi on both networks. Consider re-deploying the contracts on both networks.${line}`
    );
    process.exit(1);
  }
}


const tsCode = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${CONTRACT_NAME}ABI = ${JSON.stringify({ abi: deployLocalhost.abi }, null, 2)} as const;
\n`;
const tsAddresses = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${CONTRACT_NAME}Addresses = { 
  "11155111": { address: "${deploySepolia.address}", chainId: 11155111, chainName: "sepolia" },
  "31337": { address: "${deployLocalhost.address}", chainId: 31337, chainName: "hardhat" },
};
`;

console.log(`Generated ${path.join(outdir, `${CONTRACT_NAME}ABI.ts`)}`);
console.log(`Generated ${path.join(outdir, `${CONTRACT_NAME}Addresses.ts`)}`);
console.log(tsAddresses);

fs.writeFileSync(path.join(outdir, `${CONTRACT_NAME}ABI.ts`), tsCode, "utf-8");
fs.writeFileSync(
  path.join(outdir, `${CONTRACT_NAME}Addresses.ts`),
  tsAddresses,
  "utf-8"
);
