# Changelog

## [v1.1.0]

### Added

- **Environment-based access control**: Accounts with `env` field now require `programCode` parameter during authentication
  - Validation happens at login stage (before sending SMS/email) to save resources
  - Program's `env` must match account's `env` for authentication to proceed
  - Returns `403` error if `programCode` is missing or environment doesn't match
- **New test command**: `npm run test:uuid` to run UUID strength test separately
- **Documentation**:
  - Created `CLAUDE.md` - comprehensive guide for Claude Code with architecture overview
  - Created `INTEGRATION.md` - detailed integration guide for web clients (English)
  - Both documents include authentication flow, data models, role system, and examples

### Changed

- **HTTP status codes**: Improved semantic correctness
  - Authentication errors now return `401 Unauthorized` instead of `400 Bad Request`
  - Account not found now returns `404 Not Found` instead of `400 Bad Request`
- **Test suite optimization**: UUID strength test excluded from default `npm test` run
  - Reduces test execution time from ~4s to ~2s
  - Can be run separately with `npm run test:uuid`
- **NPM scripts**: Renamed `npm run api` to `npm run dev` (more standard convention)

### Fixed

- Removed debug `console.warn` statements from auth flow

### Tests

- Added 3 comprehensive tests for environment-based access control:
  - Requires `programCode` for accounts with `env`
  - Allows authentication with valid `programCode` and matching `env`
  - Rejects authentication with wrong `env` in `programCode`
- Fixed test expectations to match correct HTTP status codes (401 for auth errors)
- All tests passing: 8 core tests + 1 optional UUID test

### Technical Details

**Files Modified:**
- `src/api/auth.js` - Added env validation in login() function
- `src/services/authorizing.js` - Changed error status from 400 to 401
- `test/testAuth.js` - Added env tests, updated status code expectations
- `test/testUUID.js` - Removed .skip() marker
- `package.json` - Added test:uuid script, updated test script to ignore UUID test
- `INTEGRATION.md` - Comprehensive integration documentation
- `CLAUDE.md` - Developer documentation for future AI assistants

**Breaking Changes:**
- Accounts with `env` field now **require** `programCode` parameter during login
- Client applications must include `programCode` in the initial `/auth` request for accounts with environment specified

**Migration Guide:**
For accounts with `env` field, update login requests:
```javascript
// Before
await fetch('/auth', {
  body: JSON.stringify({ mobileNumber: '+370612345678' })
})

// After (for accounts with env)
await fetch('/auth', {
  body: JSON.stringify({
    mobileNumber: '+370612345678',
    programCode: 'myapp'
  })
})
```
