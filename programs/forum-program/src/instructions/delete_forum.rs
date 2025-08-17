use anchor_lang::prelude::*;

use crate::ForumState;

#[derive(Accounts)]
pub struct DeleteForum<'info> {
    #[account(
        mut,
        close = authority,
        has_one = authority,
        seeds = [b"forum0"],
        bump = forum_state.bump
    )]
    pub forum_state: Account<'info, ForumState>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

impl<'info> DeleteForum<'info> {
    pub fn delete_forum(&mut self) -> Result<()> {
        msg!("Forum deleted successfully");
        Ok(())
    }
}
