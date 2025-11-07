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

// Check if we're in Vercel build environment
const isVercel = process.env.VERCEL === "1" || process.env.VERCEL_ENV;

if (!fs.existsSync(dir)) {
  console.error(
    `${line}Unable to locate root directory. Expecting <root>/${dirname}${line}`
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
  // Skip in Vercel build environment or Windows
  if (isVercel || process.platform === "win32") {
    return;
  }
  
  // Check if script exists before trying to execute
  const scriptPath = path.resolve("./scripts/deploy-hardhat-node.sh");
  if (!fs.existsSync(scriptPath)) {
    console.warn(`⚠️  deploy-hardhat-node.sh not found. Skipping auto-deployment.`);
    return;
  }
  
  try {
    execSync(`./deploy-hardhat-node.sh`, {
      cwd: path.resolve("./scripts"),
      stdio: "inherit",
    });
  } catch (e) {
    console.warn(`⚠️  Script execution failed: ${e.message}. Continuing with fallback.`);
    // Don't exit in build environments
    if (!isVercel) {
      console.error(`${line}Script execution failed: ${e}${line}`);
      process.exit(1);
    }
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
  if (!fs.existsSync(chainDeploymentDir) && chainId === 31337 && !isVercel) {
    // Try to auto-deploy the contract on hardhat node! (skip in Vercel)
    deployOnHardhatNode();
  }

  if (!fs.existsSync(chainDeploymentDir)) {
    if (optional) {
      // Only show warning for optional deployments (like sepolia)
      console.warn(
        `⚠️  ${chainName} deployment not found at '${chainDeploymentDir}'. Will use fallback.`
      );
    } else {
      // In Vercel, treat localhost as optional and use fallback
      if (isVercel) {
        console.warn(
          `⚠️  Localhost deployment not found at '${chainDeploymentDir}'. Using fallback for Vercel build.`
        );
      } else {
        console.error(
          `${line}Unable to locate '${chainDeploymentDir}' directory.\n\n1. Goto '${dirname}' directory\n2. Run 'npx hardhat deploy --network ${chainName}'.${line}`
        );
      }
    }
    // In Vercel or if optional, don't exit - use fallback
    if (!optional && !isVercel) {
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

// Fallback for Vercel builds or when deployments are not available
// Use hardcoded addresses from previous deployments
const FALLBACK_ADDRESSES = {
  localhost: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  sepolia: "0x271cf992495f9d14e1C0B1aB6dCC8D801bb72C42"
};

// Try to read Sepolia first (more likely to exist in Vercel)
let deploySepolia = readDeployment("sepolia", 11155111, CONTRACT_NAME, true /* optional */);
// Try localhost (may not exist in Vercel)
let deployLocalhost = readDeployment("localhost", 31337, CONTRACT_NAME, isVercel /* optional in Vercel */);

// If localhost deployment is missing (e.g., in Vercel build), use Sepolia ABI or fallback
if (!deployLocalhost) {
  console.warn(`⚠️  Localhost deployment not found. Using fallback for build.`);
  
  // First, try to use Sepolia deployment if available (same ABI)
  if (deploySepolia) {
    deployLocalhost = { 
      abi: deploySepolia.abi, 
      address: FALLBACK_ADDRESSES.localhost,
      chainId: 31337
    };
    console.log(`✅ Using Sepolia ABI for localhost fallback`);
  } else {
    // Try to read from existing generated ABI file as fallback
    const existingABIPath = path.join(outdir, `${CONTRACT_NAME}ABI.ts`);
    if (fs.existsSync(existingABIPath)) {
      try {
        const existingContent = fs.readFileSync(existingABIPath, "utf-8");
        const abiMatch = existingContent.match(/export const \w+ABI = ({[\s\S]*?}) as const;/);
        if (abiMatch) {
          const parsed = JSON.parse(abiMatch[1]);
          deployLocalhost = { 
            abi: parsed.abi, 
            address: FALLBACK_ADDRESSES.localhost,
            chainId: 31337
          };
          console.log(`✅ Using existing ABI from ${existingABIPath}`);
        }
      } catch (e) {
        console.warn(`⚠️  Could not parse existing ABI: ${e.message}`);
      }
    }
    
    // If still no ABI, try to read from sepolia deployment file directly
    if (!deployLocalhost) {
      const sepoliaDeploymentPath = path.join(deploymentsDir, "sepolia", `${CONTRACT_NAME}.json`);
      if (fs.existsSync(sepoliaDeploymentPath)) {
        try {
          const sepoliaContent = fs.readFileSync(sepoliaDeploymentPath, "utf-8");
          const sepoliaObj = JSON.parse(sepoliaContent);
          deployLocalhost = { 
            abi: sepoliaObj.abi, 
            address: FALLBACK_ADDRESSES.localhost,
            chainId: 31337
          };
          deploySepolia = { 
            abi: sepoliaObj.abi, 
            address: sepoliaObj.address || FALLBACK_ADDRESSES.sepolia,
            chainId: 11155111
          };
          console.log(`✅ Using ABI from sepolia deployment file`);
        } catch (e) {
          console.warn(`⚠️  Could not read sepolia deployment: ${e.message}`);
        }
      }
    }
    
    // Last resort: exit with error (should not happen if deployments are committed)
    if (!deployLocalhost) {
      console.error(
        `${line}Unable to locate localhost deployment and no fallback ABI found.\n\nFor Vercel builds, ensure deployments/sepolia/${CONTRACT_NAME}.json is committed to the repository.${line}`
      );
      process.exit(1);
    }
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
