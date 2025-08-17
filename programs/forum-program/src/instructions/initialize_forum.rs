use anchor_lang::prelude::*;

use crate::state::ForumState;

#[derive(Accounts)]
pub struct InitializeForum<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + ForumState::INIT_SPACE,
        seeds = [b"forum0"],
        bump
    )]
    pub forum_state: Account<'info, ForumState>,

    pub system_program: Program<'info, System>,
}

impl<'info> InitializeForum<'info> {
    pub fn init(&mut self, bumps: InitializeForumBumps) -> Result<()> {
        self.forum_state.set_inner(ForumState {
            authority: self.authority.key(),
            merkle_root: [0u8; 32],
            total_content_items: 0,
            last_updated: Clock::get()?.unix_timestamp,
            bump: bumps.forum_state,
        });

        msg!("Forum program initialized successfully");
        Ok(())
    }
}
