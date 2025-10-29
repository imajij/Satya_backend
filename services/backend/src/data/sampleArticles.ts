import { NewsArticle } from "../types/news.js";

export const sampleArticles: NewsArticle[] = [
  {
    id: "india-election-2024",
    headline: "Election Commission Announces Phased Voting for 2024 General Elections",
    summary: "The Election Commission of India has released a seven-phase schedule to ensure maximum voter participation across the country.",
    source: "The Hindu",
    category: "politics",
    reputationScore: 82,
    bias: "center",
    imageUrl: "https://images.example.com/election-commission.jpg",
    publishedAt: "2024-02-12T06:30:00.000Z"
  },
  {
    id: "startup-funding-rise",
    headline: "Indian Climate-Tech Startups Witness 45% Surge in Funding",
    summary: "Investments are flowing into cleantech ventures as the government expands incentives for renewable energy innovation.",
    source: "Economic Times",
    category: "economy",
    reputationScore: 75,
    bias: "center",
    imageUrl: "https://images.example.com/climate-startup.jpg",
    publishedAt: "2024-02-11T04:10:00.000Z"
  },
  {
    id: "ai-healthcare-policy",
    headline: "NITI Aayog Releases Draft Policy for Responsible AI in Healthcare",
    summary: "The draft recommends transparent AI models and periodic audits to ensure patient safety and compliance with data privacy norms.",
    source: "Indian Express",
    category: "health",
    reputationScore: 78,
    bias: "center",
    imageUrl: "https://images.example.com/ai-healthcare.jpg",
    publishedAt: "2024-02-07T09:45:00.000Z"
  },
  {
    id: "football-isl-finals",
    headline: "Mumbai City FC Clinches ISL Title After Dramatic Penalty Shootout",
    summary: "The defending champions retained their crown with a 5-4 penalty win in front of a packed Salt Lake Stadium.",
    source: "ESPN India",
    category: "sports",
    reputationScore: 70,
    bias: "center",
    imageUrl: "https://images.example.com/isl-finals.jpg",
    publishedAt: "2024-02-05T18:05:00.000Z"
  },
  {
    id: "tech-semiconductor-park",
    headline: "Tamil Nadu Unveils Semiconductor Park to Attract Global Chipmakers",
    summary: "The state government earmarked 500 acres for fabrication units with incentives aligned with India's Production Linked Incentive scheme.",
    source: "Mint",
    category: "technology",
    reputationScore: 80,
    bias: "center",
    imageUrl: "https://images.example.com/semiconductor-park.jpg",
    publishedAt: "2024-02-01T11:25:00.000Z"
  }
];
