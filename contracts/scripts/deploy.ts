import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// ── Card pool definitions ─────────────────────────────────────────────────────
// weight is out of 10000 (must sum to 10000 per pool)
// rarity: 0=Common 1=Uncommon 2=Rare 3=Epic 4=Legendary

const POKEMON_CARDS = [
  {
    name: "Charizard",
    rarity: 4,   // Legendary
    weight: 100, // 1%
    buybackEth: "0.5",
    uri: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png",
  },
  {
    name: "Pikachu EX",
    rarity: 3,   // Epic
    weight: 400, // 4%
    buybackEth: "0.2",
    uri: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png",
  },
  {
    name: "Gengar",
    rarity: 2,    // Rare
    weight: 1000, // 10%
    buybackEth: "0.05",
    uri: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/94.png",
  },
  {
    name: "Eevee",
    rarity: 1,    // Uncommon
    weight: 2500, // 25%
    buybackEth: "0.02",
    uri: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/133.png",
  },
  {
    name: "Bulbasaur",
    rarity: 0,    // Common
    weight: 6000, // 60%
    buybackEth: "0.005",
    uri: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png",
  },
];

const MONAD_CARDS = [
  {
    name: "Monad Genesis",
    rarity: 4,
    weight: 100,
    buybackEth: "0.25",
    uri: "https://placehold.co/400x560/200052/836EF9?text=Monad+Genesis",
  },
  {
    name: "Monad Validator",
    rarity: 3,
    weight: 400,
    buybackEth: "0.1",
    uri: "https://placehold.co/400x560/200052/836EF9?text=Monad+Validator",
  },
  {
    name: "Monad Purple",
    rarity: 2,
    weight: 1000,
    buybackEth: "0.025",
    uri: "https://placehold.co/400x560/200052/836EF9?text=Monad+Purple",
  },
  {
    name: "Monad Ice",
    rarity: 1,
    weight: 2500,
    buybackEth: "0.01",
    uri: "https://placehold.co/400x560/200052/A0C2F9?text=Monad+Ice",
  },
  {
    name: "Monad Common",
    rarity: 0,
    weight: 6000,
    buybackEth: "0.0025",
    uri: "https://placehold.co/400x560/0f0e17/836EF9?text=Monad+Common",
  },
];

// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "MON");

  // 1. Deploy GachaCard NFT contract
  console.log("\n[1/4] Deploying GachaCard...");
  const GachaCard = await ethers.getContractFactory("GachaCard");
  const card = await GachaCard.deploy();
  await card.waitForDeployment();
  const cardAddr = await card.getAddress();
  console.log("GachaCard deployed to:", cardAddr);

  // 2. Deploy GachaPool
  console.log("\n[2/4] Deploying GachaPool...");
  const GachaPool = await ethers.getContractFactory("GachaPool");
  const pool = await GachaPool.deploy(cardAddr);
  await pool.waitForDeployment();
  const poolAddr = await pool.getAddress();
  console.log("GachaPool deployed to:", poolAddr);

  // 3. Authorize GachaPool to mint/burn on GachaCard
  console.log("\n[3/4] Authorizing GachaPool on GachaCard...");
  let tx = await card.setGachaPool(poolAddr);
  await tx.wait();
  console.log("Authorization set.");

  // 4. Create pools and add cards
  console.log("\n[4/4] Setting up card pools...");

  // Pool 0: Pokemon Pack — 1 MON
  const pokemonPoolTx = await pool.createPool("Pokemon Pack", ethers.parseEther("1"));
  const pokemonReceipt = await pokemonPoolTx.wait();
  console.log("  Pokemon Pool created (ID 0)");

  for (const c of POKEMON_CARDS) {
    const t = await pool.addCard(
      0,
      c.name,
      c.rarity,
      c.weight,
      ethers.parseEther(c.buybackEth),
      c.uri
    );
    await t.wait();
    console.log(`    + ${c.name} (weight=${c.weight})`);
  }

  // Pool 1: Monad Genesis Pack — 0.5 MON
  const monadPoolTx = await pool.createPool("Monad Genesis Pack", ethers.parseEther("0.5"));
  await monadPoolTx.wait();
  console.log("  Monad Genesis Pool created (ID 1)");

  for (const c of MONAD_CARDS) {
    const t = await pool.addCard(
      1,
      c.name,
      c.rarity,
      c.weight,
      ethers.parseEther(c.buybackEth),
      c.uri
    );
    await t.wait();
    console.log(`    + ${c.name} (weight=${c.weight})`);
  }

  // Seed the contract with a buyback reserve (2 MON)
  console.log("\n  Seeding buyback reserve with 2 MON...");
  const seedTx = await pool.addFunds({ value: ethers.parseEther("2") });
  await seedTx.wait();
  console.log("  Reserve funded.");

  // 5. Write deployed addresses to a JSON file for the frontend
  const addresses = {
    gachaCard: cardAddr,
    gachaPool: poolAddr,
    network: "monadTestnet",
    chainId: 10143,
  };

  const outPath = path.resolve(__dirname, "../deployed.json");
  fs.writeFileSync(outPath, JSON.stringify(addresses, null, 2));
  console.log("\n✅ Deployment complete!");
  console.log("   GachaCard :", cardAddr);
  console.log("   GachaPool :", poolAddr);
  console.log("   Addresses saved to: deployed.json");
  console.log("\n   Explorer:");
  console.log(`   https://testnet.monadexplorer.com/address/${poolAddr}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
