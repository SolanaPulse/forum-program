import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ForumProgram } from "../target/types/forum_program";
import { expect } from "chai";
import crypto, { createHash } from "crypto";
import { HashingAlgorithm, MerkleTree } from "svm-merkle-tree";

function sha256(data: Buffer): Buffer {
  return createHash("sha256").update(data).digest();
}

describe("forum-program", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.forumProgram as Program<ForumProgram>;

  const provider = anchor.getProvider();

  let authority: anchor.web3.Keypair;
  let forumStatePda: anchor.web3.PublicKey;
  let forumStateBump: number;

  const log = async (signature: string): Promise<string> => {
    console.log(
      `Your transaction signature: https://explorer.solana.com/transaction/${signature}?cluster=custom&customUrl=${provider.connection.rpcEndpoint}`
    );
    return signature;
  };

  describe("initialize-forum", () => {
    let testMerkleRoot;
    let testContentCount;

    // fns need to run before test cases
    before(async () => {
      authority = anchor.web3.Keypair.fromSecretKey(
        new Uint8Array([
          166, 167, 137, 61, 66, 117, 232, 127, 124, 15, 227, 56, 54, 8, 41,
          133, 58, 69, 87, 231, 59, 212, 81, 142, 75, 1, 212, 196, 146, 188, 97,
          143, 244, 89, 48, 228, 194, 214, 63, 110, 148, 52, 224, 214, 169, 110,
          215, 99, 72, 132, 21, 210, 41, 128, 55, 33, 187, 141, 76, 29, 117,
          204, 126, 22,
        ])
      );

      // const sig = await provider.connection.requestAirdrop(
      //   authority.publicKey,
      //   2 * anchor.web3.LAMPORTS_PER_SOL
      // );

      // await provider.connection.confirmTransaction(sig);

      [forumStatePda, forumStateBump] =
        anchor.web3.PublicKey.findProgramAddressSync(
          [Buffer.from("forum0")],
          program.programId
        );

      const hash = crypto.createHash("sha256").update("test content").digest();

      testMerkleRoot = Array.from(hash);
      testContentCount = new anchor.BN(1);
    });

    it("should initialize forum successfully", async () => {
      const tx = await program.methods
        .initializeForum()
        .accountsPartial({
          forumState: forumStatePda,
          authority: authority.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      log(tx);

      const forumState = await program.account.forumState.fetch(forumStatePda);

      expect(forumState.authority.toString()).to.equal(
        authority.publicKey.toString()
      );
      expect(forumState.totalContentItems.toString()).to.equal("0");
      expect(forumState.merkleRoot).to.deep.equal(new Array(32).fill(0));
      expect(forumState.bump).to.equal(forumStateBump);
      expect(forumState.lastUpdated.toString()).to.not.equal("0");
    });

    it("should fail to initialize forum ", async () => {
      try {
        const tx = await program.methods
          .initializeForum()
          .accountsPartial({
            forumState: forumStatePda,
            authority: authority.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([authority])
          .rpc();

        log(tx);

        expect.fail("should have failed");
      } catch (e) {
        expect(e.message).to.include("already in use");
      }
    });
  });

  describe("Update merkle root", () => {
    let merkleRoot;
    const testContent: any[] = [
      {
        id: "123",
        title: "Test Post",
        content: "This is test content for verification",
        version: 1,
      },
    ];
    before(() => {
      let merkleTree;

      merkleTree = new MerkleTree(HashingAlgorithm.Keccak, 32);

      for (const content of testContent) {
        const contentBytes = new Uint8Array(
          Buffer.from(JSON.stringify(content), "utf8")
        );
        merkleTree.add_leaf(contentBytes);
      }

      merkleTree.merklize();

      merkleRoot = merkleTree.get_merkle_root();
    });

    it("should update the merkle root with valid data ", async () => {
      const tx = await program.methods
        .updateMerkleRoot(
          Array.from(merkleRoot),
          new anchor.BN(testContent.length)
        )
        .accountsPartial({
          forumState: forumStatePda,
          authority: authority.publicKey,
        })
        .signers([authority])
        .rpc();

      log(tx);

      const forumState = await program.account.forumState.fetch(forumStatePda);

      expect(forumState.merkleRoot).to.deep.equal(Array.from(merkleRoot));
      expect(forumState.totalContentItems.toString()).to.equal(
        testContent.length.toString()
      );
    });

    it("should update the merkle root with increased content count ", async () => {
      testContent.push({
        id: "123",
        title: "Test Post",
        content: "This is updated content for verification",
        version: 2,
      });

      const updatedContent = testContent;

      let newMerkleTree: MerkleTree = new MerkleTree(
        HashingAlgorithm.Keccak,
        32
      );

      for (const content of updatedContent) {
        const contentBytes = new Uint8Array(
          Buffer.from(JSON.stringify(content), "utf-8")
        );
        newMerkleTree.add_leaf(contentBytes);
      }

      newMerkleTree.merklize();

      let newMerkleRoot = newMerkleTree.get_merkle_root();

      const tx = await program.methods
        .updateMerkleRoot(
          Array.from(newMerkleRoot),
          new anchor.BN(updatedContent.length)
        )
        .accountsPartial({
          forumState: forumStatePda,
          authority: authority.publicKey,
        })
        .signers([authority])
        .rpc();

      log(tx);

      const forumState = await program.account.forumState.fetch(forumStatePda);

      expect(forumState.totalContentItems.toString()).to.equal(
        updatedContent.length.toString()
      );
    });

    it("should fail to update the merkle root with decreased content count ", async () => {
      let newMerkleRoot = Array.from(
        crypto.createHash("sha256").update("updated content").digest()
      );
      let newContentCount = new anchor.BN(1);

      try {
        const tx = await program.methods
          .updateMerkleRoot(newMerkleRoot, newContentCount)
          .accountsPartial({
            forumState: forumStatePda,
            authority: authority.publicKey,
          })
          .signers([authority])
          .rpc();

        log(tx);

        expect.fail("should have failed");
      } catch (e) {
        expect(e.message).to.include("InvalidContentCount");
      }
    });

    it("should fail to update the merkle root with wrong authority ", async () => {
      const wrongAuthority = anchor.web3.Keypair.fromSecretKey(
        new Uint8Array([
          46, 213, 100, 234, 216, 128, 75, 137, 111, 15, 238, 250, 151, 161, 74,
          76, 195, 239, 83, 152, 186, 16, 88, 191, 148, 137, 3, 208, 3, 38, 151,
          75, 227, 209, 209, 222, 203, 51, 130, 240, 107, 40, 140, 134, 71, 35,
          105, 170, 164, 45, 128, 60, 74, 224, 37, 120, 238, 78, 203, 19, 208,
          63, 85, 54,
        ])
      );

      // await provider.connection.requestAirdrop(
      //   wrongAuthority.publicKey,
      //   2 * anchor.web3.LAMPORTS_PER_SOL
      // );

      let newMerkleRoot = Array.from(
        crypto.createHash("sha256").update("updated content").digest()
      );
      let newContentCount = new anchor.BN(4);

      try {
        const tx = await program.methods
          .updateMerkleRoot(newMerkleRoot, newContentCount)
          .accountsPartial({
            forumState: forumStatePda,
            authority: wrongAuthority.publicKey,
          })
          .signers([wrongAuthority])
          .rpc();

        log(tx);

        expect.fail("should have failed");
      } catch (e) {
        expect(e.message).to.include("has one");
      }
    });
  });

  describe("content verification", () => {
    const testContent = ["Content 1", "Content 2", "Content 3", "Content 4"];

    let merkleTree: MerkleTree;

    before(async () => {
      merkleTree = new MerkleTree(HashingAlgorithm.Keccak, 32);

      for (const content of testContent) {
        const contentBytes = new Uint8Array(Buffer.from(content, "utf8"));
        merkleTree.add_leaf(contentBytes);
      }

      merkleTree.merklize();

      const merkleRoot = merkleTree.get_merkle_root();

      await program.methods
        .updateMerkleRoot(
          Array.from(merkleRoot),
          new anchor.BN(testContent.length)
        )
        .accountsPartial({
          forumState: forumStatePda,
          authority: authority.publicKey,
        })
        .signers([authority])
        .rpc();

      console.log("Merkle root updated successfully");
    });

    it("should verify with content hash", async () => {
      const index = 0;

      const merkleProof = merkleTree.merkle_proof_index(index);
      const proofBytes = merkleProof.get_pairing_hashes();

      const contentBytes = new Uint8Array(
        Buffer.from(testContent[index], "utf8")
      );

      const tx = await program.methods
        .verifyContent(
          Buffer.from(contentBytes),
          Buffer.from(proofBytes),
          index
        )
        .accountsPartial({
          forumState: forumStatePda,
        })
        .rpc();
      log(tx);
      expect(tx).to.be.a("string");
    });

    it("should verify other content also", async () => {
      const index = 1;

      const merkleProof = merkleTree.merkle_proof_index(index);
      const proofBytes = merkleProof.get_pairing_hashes();

      const contentBytes = new Uint8Array(
        Buffer.from(testContent[index], "utf8")
      );

      const tx = await program.methods
        .verifyContent(
          Buffer.from(contentBytes),
          Buffer.from(proofBytes),
          index
        )
        .accountsPartial({
          forumState: forumStatePda,
        })
        .rpc();

      log(tx);
      expect(tx).to.be.a("string");
    });

    // run last
    it("should cleanup all accounts", async () => {
      try {
        const tx = await program.methods
          .deleteForum()
          .accountsPartial({
            forumState: forumStatePda,
            authority: authority.publicKey,
          })
          .signers([authority])
          .rpc();

        console.log("Forum cleaned up successfully");
        log(tx);
      } catch (e) {
        console.log("Cleanup failed:", e.message);
      }
    });
  });
  
  // run first
  it("should cleanup all accounts", async () => {
    try {
      const tx = await program.methods
        .deleteForum()
        .accountsPartial({
          forumState: forumStatePda,
          authority: authority.publicKey,
        })
        .signers([authority])
        .rpc();

      console.log("Forum cleaned up successfully");
      log(tx);
    } catch (e) {
      console.log("Cleanup failed:", e.message);
    }
  });
});
