# System Patterns: ClipForge

## General Development Patterns (Learned from Past Projects)

### Optimistic UI Pattern
Best for user-facing actions that need immediate feedback:

1. User performs action → Generate client-side ID
2. Update UI immediately (optimistic)
3. Send to backend/process in background
4. Receive confirmation with server ID
5. Update UI with final state
6. Handle rollback on failure

**Key Insight**: Users prefer instant feedback over perfect accuracy. Show action immediately, correct later if needed.

---

### Local-First Architecture Pattern
When building apps with offline support or performance requirements:

- **Local storage is source of truth for UI** (instant reads)
- **Server/backend is source of truth for sync** (persistent, consistent)
- **On reconnect**: Fetch missed data, merge intelligently
- **Conflict resolution**: Last-write-wins or operational transforms

**Benefits**: Instant UI updates, offline support, reduced server load

---

### Real-Time Sync Pattern
For collaborative or real-time features:

- **WebSocket/SSE connection** for bidirectional communication
- **Subscribe to resources** on app launch
- **Broadcast updates** to all connected clients
- **Clients update** local state + UI on receive
- **Heartbeat/ping** to detect dead connections

**Key Insight**: Real-time doesn't mean no persistence. Always persist state.

---

### Deduplication Pattern
Prevent duplicate data when receiving updates:

**3-Layer Defense**:
1. **Client ID Matching**: Track client-generated IDs to recognize own updates
2. **Server ID Checking**: Check server IDs before adding to cache
3. **Content Hashing**: Last resort - check content + timestamp uniqueness

**Critical**: Always deduplicate before adding to UI state or database.

---

### Multi-Platform Adapter Pattern
When building cross-platform apps (web, desktop, mobile):

**Pattern**: Create platform adapters with unified API
```
lib/platform/
├── storage.{native|web}.ts
├── notifications.{native|web}.ts
├── filesystem.{native|web}.ts
└── index.ts (exports platform-specific version)
```

**Benefits**:
- 95%+ code sharing
- Clean separation of platform-specific code
- Easy to test and maintain
- Conditional imports prevent bundling unused platform code

**Example**: `Platform.OS === 'web' ? import('web-impl') : import('native-impl')`

---

### Performance Optimization Patterns

#### Component Memoization
```typescript
// Expensive computations
const value = useMemo(() => expensiveCalc(data), [data]);

// Callbacks passed to children
const handler = useCallback(() => doSomething(), [deps]);

// Components that render frequently
const MemoizedComponent = React.memo(Component, arePropsEqual);
```

#### List Virtualization
For long lists (100+ items):
- Use windowing (only render visible items)
- Set appropriate `windowSize` and `initialNumToRender`
- Enable `removeClippedSubviews` on native platforms
- Implement pagination (load more on scroll)

**Impact**: 10,000 items → 50 rendered = 200x improvement

#### Cache Management
- Set appropriate `staleTime` and `cacheTime`
- Avoid excessive `invalidateQueries` calls
- Use `setQueryData` for immediate updates
- Batch cache updates when possible

---

### Database Best Practices

#### Migration Strategy
- Track migrations with version numbers
- Use `CREATE TABLE IF NOT EXISTS` for safety
- Add indexes for frequently queried columns
- Enable foreign key constraints
- Test migrations on production-like data

#### Query Optimization
- Use prepared statements (SQL injection protection)
- Batch queries when possible (N+1 problem)
- Add indexes for JOIN columns and WHERE clauses
- Monitor slow queries in production

---

### Media Processing Patterns

#### Compression Strategy
Before upload/storage:
1. Resize to max dimensions (e.g., 1024px width)
2. Compress with quality setting (70-80% JPEG)
3. Validate file size (enforce limits)
4. Generate thumbnails if needed

**Impact**: 5MB image → 200KB without visible quality loss

#### Lazy Loading
- Load thumbnails first, full quality on demand
- Use progressive image formats (JPEG progressive, WebP)
- Cache aggressively (images rarely change)
- Preload next/previous items in galleries

---

### State Management Patterns

**Separation of Concerns**:
- **Server State**: React Query, SWR, Apollo
  - Remote data, caching, background updates
- **App State**: Zustand, Redux, Context
  - UI toggles, current user, navigation state
- **Form State**: React Hook Form, Formik
  - Temporary input data, validation
- **URL State**: Router params/query
  - Shareable state, deep linking

**Key Insight**: Don't put server data in app state. Use specialized tools.

---

### Error Handling Patterns

#### Graceful Degradation
```typescript
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  console.error('Operation failed:', error);
  // Return fallback value or partial result
  return fallbackValue;
}
```

#### User-Facing Errors
- **Validation Errors**: 400 - Show inline, specific field errors
- **Auth Errors**: 401/403 - Redirect to login, clear tokens
- **Not Found**: 404 - Show helpful message, suggest alternatives
- **Rate Limit**: 429 - Show retry timer, queue requests
- **Server Errors**: 500 - Show generic message, log details

**Never show raw error messages to users.** Translate technical errors to user-friendly language.

---

### Testing Strategy Patterns

#### Testing Pyramid
1. **Unit Tests**: Pure functions, utilities, helpers
2. **Integration Tests**: Components with dependencies, API clients
3. **E2E Tests**: Critical user flows only

**Key Insight**: Test behavior, not implementation. Users don't care about internal state.

#### Manual Testing Scenarios
Always test:
1. Happy path (everything works)
2. Error path (network fails, invalid input)
3. Edge cases (empty state, max values, special characters)
4. Performance (large datasets, slow networks)
5. Cross-platform (if applicable)

---

### Deployment & Configuration Patterns

#### Environment Management
- **Development**: Verbose logging, hot reload, local services
- **Staging**: Production-like, test deployments, integration tests
- **Production**: Minimal logging, optimizations, monitoring

**Never commit secrets.** Use environment variables or secret managers.

#### Centralized Configuration
```typescript
// config.ts
export const config = {
  apiUrl: process.env.API_URL || 'http://localhost:3000',
  features: {
    enableBeta: process.env.ENABLE_BETA === 'true',
  },
  limits: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
  },
};
```

**Benefits**: Single source of truth, easy to audit, type-safe

---

### Build & Development Patterns

#### Dependency Management
- Lock versions for critical dependencies
- Use package manager lock files (package-lock.json, yarn.lock)
- Review dependencies before adding (size, maintenance, alternatives)
- Keep dependencies updated (security patches)

**Critical Dependencies**: Lock exact versions. Everything else: use ranges.

#### Development Workflow
1. **Feature branches**: One feature/fix per branch
2. **Small commits**: Atomic changes with clear messages
3. **Test before commit**: Prevent broken builds
4. **Review before merge**: Catch issues early
5. **Deploy often**: Small deployments = less risk

---

### Critical Learnings from Past Projects

1. **Deploy Early, Deploy Often**: Production reveals issues faster than local debugging
2. **Type Safety Saves Time**: TypeScript strict mode catches bugs before runtime
3. **Read Errors Completely**: Don't jump to conclusions, understand the root cause
4. **Consult Latest Docs**: Platforms evolve, documentation is source of truth
5. **Working State is Sacred**: Every commit should be deployable
6. **Know When to Stop**: Document blockers instead of spinning on impossible tasks
7. **Clean As You Go**: Delete scaffolding and temporary files when done
8. **Test on Real Hardware**: Don't wait until last minute to test packaged builds
9. **Performance Matters**: Users notice lag over 100ms, optimize early
10. **Start Simple**: Get basic flow working before adding complexity

---

### Platform-Specific Patterns

#### Electron Best Practices
- Use IPC for main ↔ renderer communication
- Enable context isolation for security
- Preload scripts for safe API exposure
- Package early, test often

#### Desktop App Performance
- Lazy load heavy dependencies
- Use native modules sparingly (affect portability)
- Monitor memory usage (prevent leaks)
- Optimize bundle size (affects startup time)

#### Video Processing
- Stream processing for large files (don't load entirely into memory)
- Show progress indicators (video operations are slow)
- Test encoding early (FFmpeg can be tricky)
- Validate output format compatibility

---

## Project-Specific Patterns

Will be documented as architectural decisions are made and patterns emerge during development.

### Architecture Decisions

To be documented.

### Data Flow

To be documented.

### Performance Optimizations

To be documented.

### Known Limitations

To be documented as discovered.
