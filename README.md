# Forum Program

This program manages a forum system with Merkle tree-based content verification, allowing administrators to initialize, update, verify content, and delete forums.

***Instructions***

#### initialize_forum()

- Initializes a new forum with empty state.
- Only the authority can initialize the forum.
- Creates a forum state account with initial Merkle root and content count.

#### Usage
- Call `initialize_forum()` function.
- Authority must sign the transaction.
- Forum state is created with zero content items and empty Merkle root.

#### update_merkle_root()

- Updates the forum's Merkle root with new content data.
- Only the forum authority can perform this operation.
- Validates that new content count is not less than current count.

#### Usage
- Call `update_merkle_root()` function.
- Pass new Merkle root (32 bytes) and updated content count.
- Emits MerkleRootUpdated event with timestamp and authority info.

#### verify_content()

- Verifies content authenticity using Merkle proof verification.
- Anyone can verify content against the current Merkle root.
- Uses Keccak hashing algorithm for proof verification.

#### Usage
- Call `verify_content()` function.
- Pass content hash, Merkle proof, and content index.
- Returns verification result and emits ContentVerified event.

#### delete_forum()

- Permanently deletes the forum and returns lamports to authority.
- Only the forum authority can delete the forum.
- Closes the forum state account completely.

#### Usage
- Call `delete_forum()` function.
- Authority must sign the transaction.
- All forum data is permanently removed and lamports returned.

programId - 9oH6wv4k3nr1Y3k2HSdeJ5TVFS2b7yLXvuVhy7NkpdnR

update authority and wrong authority keypair with account have some devnet SOL to pass the test cases if it fails.

