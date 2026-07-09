const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

require("dotenv").config();
const mongoose = require("mongoose");
const Passage = require("./models/Passage");
const data = require("./data.json");

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected for seeding");

  await Passage.deleteMany({});
  console.log("Cleared existing passages");

  const docs = [];
  for (const difficulty of ["easy", "medium", "hard"]) {
    data[difficulty].forEach(text => docs.push({ text, difficulty }));
  }

  await Passage.insertMany(docs);
  console.log(`Inserted ${docs.length} passages`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});