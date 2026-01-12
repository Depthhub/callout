# 🚀 VOUCHEO - Vercel Deployment Checklist (Base Sepolia Testnet)

> **WARNING**: This application is configured for BASE SEPOLIA TESTNET ONLY.
> Do NOT deploy targeting mainnet without a complete security audit.

---

## Pre-Deployment Security Audit Results

### ✅ Issues Fixed

| Issue | Severity | Status |
|-------|----------|--------|
| App switched to mainnet in production | 🔴 CRITICAL | ✅ Fixed - Hardcoded to Base Sepolia |
| No .gitignore file | 🔴 CRITICAL | ✅ Fixed - Created comprehensive .gitignore |
| Hardcoded admin address fallback | 🔴 CRITICAL | ✅ Fixed - Requires explicit config |
| Unprotected webhook endpoint | 🟠 HIGH | ✅ Fixed - Added rate limiting & validation |
| Sensitive data logged to console | 🟠 HIGH | ✅ Fixed - Sanitized logging |
| No chain validation | 🟠 HIGH | ✅ Fixed - Added NetworkGuard component |
| No vercel.json | 🟠 HIGH | ✅ Fixed - Added security headers |
| No testnet indicator | 🟡 MEDIUM | ✅ Fixed - Added TestnetBanner |
| No error boundary | 🟡 MEDIUM | ✅ Fixed - Added ErrorBoundary component |

---

## Vercel Environment Variables

### Required Variables (All Environments)

```
NEXT_PUBLIC_MARKETS_ADDRESS=<your-deployed-contract-address>
NEXT_PUBLIC_USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
NEXT_PUBLIC_ADMIN_ADDRESS=<admin-wallet-address>
NEXT_PUBLIC_ONCHAINKIT_API_KEY=<your-onchainkit-api-key>
```

### Setting Up in Vercel Dashboard

1. Go to Project Settings → Environment Variables
2. Add each variable above
3. Set scope to: Production, Preview, Development
4. Click "Save"

⚠️ **IMPORTANT**: 
- `NEXT_PUBLIC_ADMIN_ADDRESS` MUST be set or admin panel will be inaccessible
- Use a TESTNET wallet for admin - never use a wallet with mainnet funds

---

## Deployment Steps

### 1. Pre-Flight Checks

- [ ] All environment variables configured in Vercel
- [ ] `.gitignore` is committed (check: `git status` shows no `.env` files)
- [ ] No secrets in codebase: `git log -p | grep -i "private_key\|secret\|api_key"` returns nothing sensitive
- [ ] Smart contract is deployed to Base Sepolia
- [ ] Contract address is set in `NEXT_PUBLIC_MARKETS_ADDRESS`

### 2. Deploy

```bash
# Option A: Connect GitHub repo to Vercel (recommended)
# Push to main branch, Vercel auto-deploys

# Option B: Manual deploy
cd webapp
npx vercel --prod
```

### 3. Post-Deployment Verification

- [ ] Visit deployed URL
- [ ] Verify "BASE SEPOLIA TESTNET" banner is visible
- [ ] Connect wallet and verify it prompts for Base Sepolia
- [ ] Check Network tab - no secrets in API responses
- [ ] Test webhook endpoint returns 429 after rate limit
- [ ] Verify admin page is inaccessible without correct wallet
- [ ] Test a bet flow end-to-end

---

## Security Headers Configured (vercel.json)

| Header | Value | Purpose |
|--------|-------|---------|
| X-Content-Type-Options | nosniff | Prevent MIME sniffing |
| X-Frame-Options | SAMEORIGIN | Clickjacking protection |
| X-XSS-Protection | 1; mode=block | XSS filter |
| Referrer-Policy | strict-origin-when-cross-origin | Privacy |
| Permissions-Policy | camera=(), microphone=(), geolocation=() | Disable unnecessary APIs |

---

## Monitoring Recommendations

### Vercel Analytics (Free Tier)
- Enable in Vercel Dashboard → Analytics
- Monitor for unusual traffic patterns

### Error Monitoring (Recommended)
- Add Sentry or similar for production error tracking
- Configure in `webapp/app/components/ErrorBoundary.tsx`

### Chain Monitoring
- Monitor contract events on BaseScan
- Set up alerts for unusual activity

---

## Known Limitations (Testnet)

1. **Demo Data**: Initial markets are hardcoded for demo purposes
2. **Local Storage**: User bets are stored in localStorage (not persistent across devices)
3. **No Real USDC**: Uses testnet USDC only
4. **Rate Limiting**: In-memory (resets on serverless cold start)

---

## Emergency Procedures

### If Secrets Are Exposed
1. Immediately rotate all exposed credentials
2. Regenerate API keys in Vercel dashboard
3. Redeploy with new secrets
4. Review access logs

### If Wrong Network Detected
1. The NetworkGuard component will block transactions
2. Users are prompted to switch to Base Sepolia
3. No mainnet transactions are possible with current config

---

## Final Checklist

- [x] Application locked to Base Sepolia testnet
- [x] No hardcoded secrets in codebase
- [x] Environment variables documented
- [x] Security headers configured
- [x] Rate limiting on API endpoints
- [x] Console logging sanitized
- [x] Error boundaries implemented
- [x] Network validation in place
- [x] Testnet banner visible
- [x] Admin access requires explicit configuration
- [ ] **DEPLOY WHEN ALL ABOVE ARE CHECKED**

---

## ✅ SAFE TO DEPLOY ON BASE TESTNET

This application has been audited and hardened for Base Sepolia testnet deployment.

**Audited**: January 12, 2026
**Auditor**: Web3 Infrastructure Security Review

---

## NOT Safe For

- ❌ Mainnet deployment (requires separate audit)
- ❌ Handling real user funds
- ❌ Production with real USDC

