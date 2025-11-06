# Vercel Deployment Checklist

## Pre-Deployment Checklist

- [ ] **Contract Deployed**: Ensure `EncryptedTripPlanner` is deployed to Sepolia
  - Current Sepolia address: `0x271cf992495f9d14e1C0B1aB6dCC8D801bb72C42`
  - Verify in `deployments/sepolia/EncryptedTripPlanner.json`

- [ ] **Deployment Files Committed**: Ensure deployment JSON files are in repository
  - `deployments/sepolia/EncryptedTripPlanner.json` ✓
  - `deployments/localhost/EncryptedTripPlanner.json` ✓

- [ ] **ABI Generated**: Run `npm run genabi` locally to verify it works
  - Should create `frontend/abi/EncryptedTripPlannerABI.ts`
  - Should create `frontend/abi/EncryptedTripPlannerAddresses.ts`

- [ ] **Build Test**: Test build locally
  ```bash
  cd frontend
  npm install
  npm run build
  ```

- [ ] **Environment Variables**: Prepare WalletConnect Project ID
  - Optional but recommended: Get from https://cloud.reown.com
  - Will be set in Vercel dashboard

## Vercel Deployment Steps

1. **Connect Repository**
   - Go to vercel.com
   - Import Git repository
   - Vercel will auto-detect Next.js

2. **Configure Project**
   - **Root Directory**: `frontend` (auto-detected from `vercel.json`)
   - **Framework**: Next.js (auto-detected)

3. **Set Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add: `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` = `your_project_id`

4. **Deploy**
   - Click "Deploy"
   - Monitor build logs

## Post-Deployment Verification

- [ ] **Build Success**: Check Vercel build logs for errors
- [ ] **Site Loads**: Visit deployed URL
- [ ] **Wallet Connection**: Test RainbowKit wallet connection
- [ ] **Network Switch**: Verify Sepolia network works
- [ ] **Contract Interaction**: Test trip submission and decryption

## Quick Commands

```bash
# Test build locally
cd frontend
npm run build

# Generate ABI (if needed)
npm run genabi

# Check deployment files exist
ls deployments/sepolia/EncryptedTripPlanner.json
ls deployments/localhost/EncryptedTripPlanner.json
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails: "genabi error" | Ensure `deployments/` directory is committed |
| Build fails: "Cannot find module" | Run `npm install` in `frontend/` directory |
| WalletConnect warnings | Set `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` env var |
| Contract not found | Verify Sepolia address in `EncryptedTripPlannerAddresses.ts` |

