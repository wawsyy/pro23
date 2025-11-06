# Vercel Deployment Guide

This guide explains how to deploy the Encrypted Trip Planner to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub/GitLab/Bitbucket Repository**: Push your code to a Git repository
3. **WalletConnect Project ID** (recommended): Get one from [cloud.reown.com](https://cloud.reown.com)

## Deployment Steps

### 1. Prepare the Repository

Ensure the following files are committed to your repository:
- `frontend/` directory with all source code
- `deployments/sepolia/EncryptedTripPlanner.json` (contract deployment info)
- `deployments/localhost/EncryptedTripPlanner.json` (for local development)
- `vercel.json` (Vercel configuration)

### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your Git repository
4. Vercel will auto-detect Next.js

### 3. Configure Build Settings

Vercel should auto-detect the following from `vercel.json`:
- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Output Directory**: `.next`

If not auto-detected, manually set:
- **Framework Preset**: Next.js
- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Install Command**: `npm install`

### 4. Set Environment Variables

In Vercel project settings → Environment Variables, add:

```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

**Optional but recommended**: Get your own WalletConnect Project ID:
1. Visit [cloud.reown.com](https://cloud.reown.com)
2. Create a free account
3. Create a new project
4. Copy the Project ID
5. Add it as an environment variable in Vercel

### 5. Deploy

1. Click "Deploy"
2. Wait for the build to complete
3. Your app will be live at `https://your-project.vercel.app`

## Build Process

The build process runs:
1. `npm install` - Install dependencies
2. `npm run genabi` - Generate contract ABI and addresses (reads from `deployments/`)
3. `npm run build` - Build Next.js application

## Important Notes

### Contract Addresses

The application uses contract addresses from:
- **Sepolia Testnet**: `0x271cf992495f9d14e1C0B1aB6dCC8D801bb72C42`
- **Local Hardhat**: `0x5FbDB2315678afecb367f032d93F642f64180aa3`

These are hardcoded in `genabi.mjs` as fallbacks. If you redeploy contracts, update the addresses in:
- `deployments/sepolia/EncryptedTripPlanner.json`
- `deployments/localhost/EncryptedTripPlanner.json`

Or update the `FALLBACK_ADDRESSES` in `frontend/scripts/genabi.mjs`.

### ABI Generation

The `genabi` script requires deployment JSON files. For Vercel builds:
- Ensure `deployments/sepolia/EncryptedTripPlanner.json` is committed
- The script will use fallback addresses if files are missing
- If ABI generation fails, the build will fail

### Network Configuration

The app supports:
- **Sepolia Testnet** (production)
- **Hardhat Local** (development only, not available on Vercel)

Users can switch networks using RainbowKit.

## Troubleshooting

### Build Fails: "Unable to locate deployments directory"

**Solution**: Ensure `deployments/sepolia/EncryptedTripPlanner.json` is committed to your repository.

### Build Fails: "genabi script error"

**Solution**: 
1. Run `npm run genabi` locally to verify it works
2. Check that deployment JSON files are valid
3. Ensure the `frontend/abi/` directory exists

### WalletConnect Warnings in Console

**Solution**: 
- These are safe to ignore in development
- For production, set up your own WalletConnect Project ID
- The warnings don't affect functionality

### COOP/COEP Header Errors

**Solution**: The headers are already configured in `next.config.ts`. These errors should not occur on Vercel.

## Custom Domain

To use a custom domain:
1. Go to Vercel project settings → Domains
2. Add your domain
3. Follow DNS configuration instructions

## Environment-Specific Deployments

Vercel supports:
- **Production**: Main branch
- **Preview**: All other branches
- **Development**: Specific branches

Configure these in Vercel project settings.

## Monitoring

Monitor your deployment:
- **Build Logs**: Available in Vercel dashboard
- **Function Logs**: Check Vercel dashboard for serverless function logs
- **Analytics**: Enable in Vercel project settings

## Support

For issues:
1. Check Vercel build logs
2. Verify environment variables are set
3. Ensure all required files are committed
4. Test locally with `npm run build` first

