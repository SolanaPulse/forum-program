pub mod constants;
pub mod errors;
pub mod events;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("9oH6wv4k3nr1Y3k2HSdeJ5TVFS2b7yLXvuVhy7NkpdnR");

#[program]
pub mod forum_program {

    use super::*;

    pub fn initialize_forum(ctx: Context<InitializeForum>) -> Result<()> {
        ctx.accounts.init(ctx.bumps)?;
        Ok(())
    }

    pub fn update_merkle_root(
        ctx: Context<UpdateMerkleRoot>,
        new_root: [u8; 32],
        content_count: u64,
    ) -> Result<()> {
        ctx.accounts.update_merkle_root(new_root, content_count)?;
        Ok(())
    }

    pub fn verify_content(
        ctx: Context<VerifyContent>,
        content: Vec<u8>,
        merkle_proof: Vec<u8>,
        index: u32,
    ) -> Result<()> {
        ctx.accounts.verify_content(content, merkle_proof, index)?;
        Ok(())
    }

    // helper fn to delete the created forum for testing
    pub fn delete_forum(ctx: Context<DeleteForum>) -> Result<()> {
        ctx.accounts.delete_forum()?;
        Ok(())
    }
}
