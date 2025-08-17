use anchor_lang::prelude::*;

#[error_code]
pub enum ForumError {
   #[msg("Invalid Merkle proof provided")]
    InvalidMerkleProof,
    #[msg("Merkle root is empty")]
    EmptyMerkleRoot,
    #[msg("Invalid content count")]
    InvalidContentCount,
    #[msg("Unauthorized access")]
    Unauthorized,
}