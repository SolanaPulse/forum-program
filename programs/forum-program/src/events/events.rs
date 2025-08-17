use anchor_lang::prelude::*;


#[event]
pub struct MerkleRootUpdated {
    pub new_root: [u8; 32],
    pub content_count: u64,
    pub timestamp: i64,
    pub authority: Pubkey,
}

#[event]
pub struct ContentVerified {
    pub content_hash: [u8; 32],
    pub merkle_root: [u8; 32],
    pub index: u32,
    pub verified: bool,
    pub timestamp: i64,
}