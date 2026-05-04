# HaqQuran Security Specification

## Data Invariants
- A post must have a valid author (the current user).
- Likes and Comments must reference an existing post.
- User profiles can only be modified by the owner.
- Bookmarks are private to the user.

## The Dirty Dozen Payloads (Rejection Tests)
1. **Identity Spoofing**: Attempt to create a post with another user's `userId`.
2. **Privilege Escalation**: Attempt to set `isAdmin: true` on user profile creation.
3. **Ghost Fields**: Attempt to add `verified: true` to a post payload.
4. **Invalid Reference**: Attempt to bookmark an ayah that doesn't exist (relational check).
5. **ID Poisoning**: Attempt to use a 2KB string as a `postId`.
6. **Denial of Wallet**: Attempt to write a 1MB string into a `comment.content`.
7. **Bypassing Verification**: Attempt to write as a user with `email_verified: false`.
8. **Shadow Update**: Attempt to update `likesCount` directly instead of via transactional increment (if implemented).
9. **Relational Sync**: Attempt to add a comment to a non-existent post.
10. **Immutable Field Attack**: Attempt to change `createdAt` on an existing post.
11. **Terminal State Lock**: (If any terminal states exist, like 'soft-deleted').
12. **Blanket Read**: Attempt to list all users without specific queries (handled by rules).

## Test Runner
(A separate test file `firestore.rules.test.ts` will verify these)
