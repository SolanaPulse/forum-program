use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct ForumState {
    pub authority: Pubkey,
    pub merkle_root: [u8; 32],
    pub total_content_items: u64,
    pub last_updated: i64,
    pub bump: u8,
}
