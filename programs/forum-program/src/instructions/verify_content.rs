use anchor_lang::prelude::*;
use crate::{errors::ForumError, events::ContentVerified, state::ForumState};
use svm_merkle_tree::{HashingAlgorithm, MerkleProof};

#[derive(Accounts)]
pub struct VerifyContent<'info> {
    #[account(
        seeds=[b"forum0"],
        bump = forum_state.bump
    )]
    pub forum_state: Account<'info, ForumState>,
}

impl<'info> VerifyContent<'info> {
    pub fn verify_content(
        &mut self,
        content_hash: Vec<u8>, 
        merkle_proof: Vec<u8>,
        index: u32,
    ) -> Result<()> {
        msg!("Flexible hash verification");
        msg!("Content hash: {:?}", content_hash);
        msg!("Content hash length: {}", content_hash.len());
        msg!("Proof length: {}", merkle_proof.len());
        msg!("Index: {}", index);
        
        require!(
            self.forum_state.merkle_root != [0u8; 32],
            ForumError::EmptyMerkleRoot
        );

        // Create merkle proof
        let proof = MerkleProof::new(
            HashingAlgorithm::Keccak,
            32,
            index,
            merkle_proof,
        );

        // Verify with the provided hash (whatever length it is)
        let computed_root = proof
            .merklize(&content_hash)
            .map_err(|e| {
                msg!("Merklize failed: {:?}", e);
                ForumError::InvalidMerkleProof
            })?;

        msg!("Computed root: {:?}", computed_root);
        msg!("Expected root: {:?}", self.forum_state.merkle_root);

        require!(
            computed_root.eq(&self.forum_state.merkle_root.to_vec()),
            ForumError::InvalidMerkleProof
        );

        // Create fixed-size content hash for event
        let mut event_hash = [0u8; 32];
        let copy_len = std::cmp::min(content_hash.len(), 32);
        event_hash[..copy_len].copy_from_slice(&content_hash[..copy_len]);

        emit!(ContentVerified {
            content_hash: event_hash,
            merkle_root: self.forum_state.merkle_root,
            index,
            verified: true,
            timestamp: Clock::get()?.unix_timestamp
        });

        Ok(())
    }
}