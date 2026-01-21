# Branch Protection Configuration

The `main` branch is protected with the following rules to ensure code quality and prevent accidental changes.

## 🛡️ Protection Rules

### ✅ Required Status Checks

All of these CI checks must pass before code can be merged:

| Check | Node Version | Purpose |
|-------|--------------|---------|
| **test (18.x)** | Node.js 18.x | Run full test suite |
| **test (20.x)** | Node.js 20.x | Run full test suite |
| **test (22.x)** | Node.js 22.x | Run full test suite |
| **lint** | Node.js 20.x | Type checking & build verification |

**Settings:**
- ✅ **Strict mode enabled**: Branch must be up to date with main before merging
- ✅ **All 4 checks must pass**: No exceptions

### 🚫 Prevented Actions

These actions are **blocked** on the main branch:

| Action | Status | Reason |
|--------|--------|--------|
| **Force Push** | ❌ Blocked | Prevents history rewriting |
| **Branch Deletion** | ❌ Blocked | Protects main branch |
| **Direct Push (without passing CI)** | ❌ Blocked | Ensures tests pass |

### ✅ Allowed Actions

These actions are **permitted**:

| Action | Status | Requirements |
|--------|--------|--------------|
| **Direct Push** | ✅ Allowed | Only if all status checks pass |
| **Merge** | ✅ Allowed | Only if all status checks pass & branch is up to date |
| **Fork Syncing** | ✅ Allowed | For contributors |

### 📜 Additional Rules

- **Linear History Required**: No merge commits, use rebase or squash
- **Admin Override**: Disabled (admins must follow same rules)
- **Conversation Resolution**: Not required
- **Branch Locking**: Not enabled

## 🔄 Workflow

### For Direct Commits to Main

1. Make changes locally
2. Commit with conventional commit format
3. Push to main
4. ✅ CI automatically runs
5. ✅ All 4 checks must pass
6. ✅ Changes are merged if tests pass
7. ❌ Push is rejected if any test fails

### For Pull Requests

1. Create feature branch
2. Make changes and commit
3. Push feature branch
4. Create PR to main
5. ✅ CI runs on PR
6. ✅ All 4 checks must pass
7. ✅ Branch must be up to date with main
8. ✅ Merge when all checks pass

## 🧪 Status Check Details

### Test Checks (3 checks)

Each test check runs:
```bash
npm ci          # Clean install
npm test        # Run vitest test suite
npm run build   # Verify TypeScript compiles
```

**Matrix Strategy:**
- Node.js 18.x (LTS)
- Node.js 20.x (LTS)
- Node.js 22.x (Current)

### Lint Check (1 check)

Runs on Node.js 20.x:
```bash
npm ci                    # Clean install
npm run build            # Type check via tsc
git diff --exit-code     # Verify no uncommitted changes from build
```

## 🎯 Why These Protections?

### Force Push Prevention
- ✅ Prevents accidental history rewriting
- ✅ Maintains clean git history
- ✅ Protects CI/CD integrity

### Deletion Prevention
- ✅ Prevents accidental main branch deletion
- ✅ Critical for production stability

### Required Status Checks
- ✅ Ensures all tests pass before merge
- ✅ Validates code across multiple Node.js versions
- ✅ Catches TypeScript errors early
- ✅ Prevents broken code in main branch

### Linear History
- ✅ Keeps git history clean and readable
- ✅ Makes bisecting bugs easier
- ✅ Simplifies code review

## 🔧 Modifying Protection Rules

To update these rules:

```bash
# View current protection
gh api repos/schwarztim/codex-mcp/branches/main/protection

# Update protection rules
gh api repos/schwarztim/codex-mcp/branches/main/protection -X PUT --input protection.json
```

See [GitHub API docs](https://docs.github.com/en/rest/branches/branch-protection) for more options.

## 📚 Related Documentation

- [CONTRIBUTING.md](../CONTRIBUTING.md) - Contributing guidelines
- [SECURITY.md](../SECURITY.md) - Security policy
- [CI Workflow](workflows/ci.yml) - CI/CD configuration

---

Last Updated: 2026-01-21
