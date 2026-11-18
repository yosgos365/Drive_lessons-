# Security Specification: CloudDrive Firebase Hub

## 1. Data Invariants
- **Identity Isolation**: A user can only access, create, read, update, or delete their own profile (`/users/{userId}`) where `userId == request.auth.uid`.
- **Sub-Resource Ownership**: A user can only access workspace items under `/users/{userId}/items/{itemId}` where `userId == request.auth.uid` and item `userId == request.auth.uid`.
- **Immutable Fields**:
  - `createdAt` and `id` in both user profiles and items cannot be changed during updates.
  - `userId` on subcollection items cannot be modified to spoof another user.
- **Input Boundaries**:
  - `title` must be a string between 1 and 150 characters.
  - `content` must not exceed 20,000 characters.
  - `id` must be a valid alphanumeric/dash/underscore identifier <= 128 characters.
- **Email Verification**: User writes require authenticated users.

## 2. The Dirty Dozen Payloads (Designed to Fail)
1. **Unauthenticated Read**: Attempting to read `/users/user123` with `request.auth == null`.
2. **Cross-User Profile Spoof**: User `A` attempting to write to `/users/userB`.
3. **Ghost Field Injection**: Attempting to add an unapproved field `isSuperAdmin: true` to `/users/{userId}`.
4. **Item Ownership Hijacking**: User `A` creating an item under `/users/userA/items/item1` with `userId: "userB"`.
5. **Cross-Tenant Item Tampering**: User `B` attempting to update `/users/userA/items/item1`.
6. **Title Overflow Denial of Wallet**: Creating an item with `title` exceeding 150 characters (e.g. 5,000 chars).
7. **Content Bomb Attack**: Writing `content` greater than 20,000 characters.
8. **Invalid Enum Exploitation**: Writing an item with `type: "malicious_script"` instead of allowed enums.
9. **Category Injection**: Writing an item with `category: "hacked"` outside allowed category values.
10. **ID Path Variable Traversal/Poisoning**: Attempting to use a document ID with special punctuation or exceeding 128 chars.
11. **Immutable Field Mutate on Update**: Modifying `createdAt` to a different timestamp during an update.
12. **Blanket Collection Scrape**: Attempting a collectionGroup query or querying across all users without ownership predicate.
