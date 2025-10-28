import Article from "../models/Article.js";
import Source from "../models/Source.js";
import FactCheck from "../models/FactCheck.js";

const seedSources = async () => {
  const sources = [
    {
      name: "BBC News",
      domain: "bbc.com",
      reputation_score: 85,
      bias: "neutral"
    },
    {
      name: "CNN",
      domain: "cnn.com",
      reputation_score: 75,
      bias: "left"
    },
    {
      name: "Fox News",
      domain: "foxnews.com",
      reputation_score: 70,
      bias: "right"
    },
    {
      name: "Reuters",
      domain: "reuters.com",
      reputation_score: 90,
      bias: "neutral"
    },
    {
      name: "Associated Press",
      domain: "apnews.com",
      reputation_score: 88,
      bias: "neutral"
    }
  ];

  try {
    // Clear existing sources
    await Source.deleteMany({});
    
    // Insert new sources
    const createdSources = await Source.insertMany(sources);
    console.log(`✅ Seeded ${createdSources.length} sources`);
    return createdSources;
  } catch (error) {
    console.error("❌ Error seeding sources:", error);
    throw error;
  }
};

const seedArticles = async () => {
  const articles = [
    {
      headline: "Global Climate Summit Reaches Historic Agreement",
      source: "Reuters",
      summary: "World leaders agree on ambitious climate targets for 2030",
      reputation_score: 90,
      bias: "neutral",
      fact_check_status: "verified"
    },
    {
      headline: "Tech Industry Sees Major Breakthrough in AI Development",
      source: "BBC News",
      summary: "New AI model shows unprecedented capabilities in natural language processing",
      reputation_score: 85,
      bias: "neutral",
      fact_check_status: "verified"
    },
    {
      headline: "Economic Markets Show Strong Recovery Signs",
      source: "Associated Press",
      summary: "Stock markets reach new highs as economic indicators improve",
      reputation_score: 88,
      bias: "neutral",
      fact_check_status: "unverified"
    }
  ];

  try {
    // Clear existing articles
    await Article.deleteMany({});
    
    // Insert new articles
    const createdArticles = await Article.insertMany(articles);
    console.log(`✅ Seeded ${createdArticles.length} articles`);
    return createdArticles;
  } catch (error) {
    console.error("❌ Error seeding articles:", error);
    throw error;
  }
};

const seedFactChecks = async () => {
  const factChecks = [
    {
      claim: "Global temperatures have risen by 1.1°C since pre-industrial times",
      verdict: "true",
      source: "IPCC Report 2023",
      reference_url: "https://www.ipcc.ch/report/ar6/wg1/",
      date: new Date("2023-08-01")
    },
    {
      claim: "AI will replace 50% of jobs by 2025",
      verdict: "misleading",
      source: "MIT Technology Review",
      reference_url: "https://www.technologyreview.com/ai-jobs-analysis",
      date: new Date("2023-09-15")
    },
    {
      claim: "Stock market crash predicted for next month",
      verdict: "false",
      source: "Financial Times Analysis",
      reference_url: "https://www.ft.com/market-predictions",
      date: new Date("2023-10-01")
    }
  ];

  try {
    // Clear existing fact checks
    await FactCheck.deleteMany({});
    
    // Insert new fact checks
    const createdFactChecks = await FactCheck.insertMany(factChecks);
    console.log(`✅ Seeded ${createdFactChecks.length} fact checks`);
    return createdFactChecks;
  } catch (error) {
    console.error("❌ Error seeding fact checks:", error);
    throw error;
  }
};

const runSeed = async () => {
  try {
    console.log("🌱 Starting database seeding...");
    
    await seedSources();
    await seedArticles();
    await seedFactChecks();
    
    console.log("✅ Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Database seeding failed:", error);
    throw error;
  }
};

export { seedSources, seedArticles, seedFactChecks, runSeed };