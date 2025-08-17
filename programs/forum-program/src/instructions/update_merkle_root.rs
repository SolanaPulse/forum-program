use crate::{errors::ForumError, events::MerkleRootUpdated, forum::ForumState};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct UpdateMerkleRoot<'info> {
    #[account(
        mut,
        has_one = authority,
        seeds = [b"forum0"],
        bump = forum_state.bump
    )]
    pub forum_state: Account<'info, ForumState>,
    pub authority: Signer<'info>,
}

impl<'info> UpdateMerkleRoot<'info> {
    pub fn update_merkle_root(&mut self, new_root: [u8; 32], content_count: u64) -> Result<()> {
        require!(
            content_count >= self.forum_state.total_content_items,
            ForumError::InvalidContentCount
        );

        self.forum_state.merkle_root = new_root;
        self.forum_state.total_content_items = content_count;
        self.forum_state.last_updated = Clock::get()?.unix_timestamp;

        emit!(MerkleRootUpdated {
            new_root,
            content_count,
            timestamp: self.forum_state.last_updated,
            authority: self.forum_state.authority
        });

        msg!("Merkle root updated to {:?}", new_root);

        Ok(())
    }
}
