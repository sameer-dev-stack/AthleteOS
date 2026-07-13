/**
 * Apify Scraper Dry Run Verification Script
 * Usage: node scratch/test-apify.js <APIFY_API_KEY>
 */

const APIFY_API_KEY = process.argv[2] || process.env.APIFY_API_KEY;

if (!APIFY_API_KEY) {
  console.error("Error: Please provide your Apify API key: node scratch/test-apify.js <YOUR_KEY>");
  process.exit(1);
}

async function runInstagramTest(username) {
  console.log(`\n--- Running Instagram Scraper Test for @${username} ---`);
  // instagram-scraper actor ID is apify/instagram-scraper
  const actorId = "apify/instagram-scraper";
  const url = `https://api.apify.com/v2/acts/${actorId.replace('/', '~')}/run-sync-get-dataset-items?token=${APIFY_API_KEY}`;
  
  const payload = {
    usernames: [username],
    resultsLimit: 5, // fetch last 5 posts to compute engagement
  };

  try {
    const startTime = Date.now();
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Response status: ${response.status} (${duration}s)`);

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Apify Instagram run failed: ${errText}`);
      return;
    }

    const items = await response.json();
    console.log(`Successfully retrieved ${items.length} items.`);

    if (items.length === 0) {
      console.log("No items returned. Account might be private, empty, or misspelled.");
      return;
    }

    const firstItem = items[0];
    console.log("Sample Item Fields:", Object.keys(firstItem));
    
    // Check owner info and metrics
    const owner = firstItem.owner;
    if (owner) {
      console.log("Owner Details parsed successfully:");
      console.log(`- Followers Count: ${owner.followersCount}`);
      console.log(`- Is Private: ${owner.isPrivate}`);
      console.log(`- Full Name: ${owner.fullName}`);
    } else {
      console.log("Warning: No 'owner' object found in post. Trying direct profile fields (if profile scraper)...");
      console.log(`- followersCount: ${firstItem.followersCount}`);
      console.log(`- isPrivate: ${firstItem.isPrivate}`);
    }

    // Engagement stats
    let totalLikes = 0;
    let totalComments = 0;
    items.forEach((item, index) => {
      console.log(`Post ${index + 1}: likes=${item.likesCount}, comments=${item.commentsCount}`);
      totalLikes += (item.likesCount || 0);
      totalComments += (item.commentsCount || 0);
    });

    const followers = owner ? owner.followersCount : firstItem.followersCount;
    if (followers > 0) {
      const avgER = (totalLikes + totalComments) / (items.length * followers);
      console.log(`Computed Instagram ER: ${(avgER * 100).toFixed(2)}%`);
    } else {
      console.log("Follower count is 0, cannot compute ER.");
    }
  } catch (error) {
    console.error("Instagram Test Error:", error);
  }
}

async function runTikTokTest(username) {
  console.log(`\n--- Running TikTok Scraper Test for @${username} ---`);
  // tiktok-profile-scraper actor ID is clockworks/tiktok-profile-scraper
  const actorId = "clockworks/tiktok-profile-scraper";
  const url = `https://api.apify.com/v2/acts/${actorId.replace('/', '~')}/run-sync-get-dataset-items?token=${APIFY_API_KEY}`;
  
  const payload = {
    profiles: [username],
    resultsPerPage: 5,
    profileScrapeSections: ["videos"],
    proxyConfiguration: {
      useApifyProxy: true,
      apifyProxyGroups: ["RESIDENTIAL"]
    }
  };

  try {
    const startTime = Date.now();
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Response status: ${response.status} (${duration}s)`);

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Apify TikTok run failed: ${errText}`);
      return;
    }

    const items = await response.json();
    console.log(`Successfully retrieved ${items.length} items.`);

    if (items.length === 0) {
      console.log("No items returned. Account might be private, empty, or misspelled.");
      return;
    }

    const firstItem = items[0];
    console.log("Sample Item Fields:", Object.keys(firstItem));

    const authorMeta = firstItem.authorMeta;
    if (authorMeta) {
      console.log("Author Meta details parsed successfully:");
      console.log(`- Followers (fans): ${authorMeta.fans}`);
      console.log(`- Is Private: ${authorMeta.private}`);
      console.log(`- Nick Name: ${authorMeta.nickName}`);
    } else {
      console.log("Warning: No 'authorMeta' object found in video item. Trying alternative field mappings...");
      console.log(`- fans: ${firstItem.fans || firstItem.followersCount}`);
      console.log(`- private: ${firstItem.private}`);
    }

    // Engagement stats
    let totalLikes = 0;
    let totalComments = 0;
    let totalShares = 0;
    let totalViews = 0;
    
    items.forEach((item, index) => {
      const stats = item.stats || {};
      console.log(`Video ${index + 1}: likes=${stats.diggCount || stats.likeCount}, comments=${stats.commentCount}, shares=${stats.shareCount}, views=${stats.playCount}`);
      totalLikes += (stats.diggCount || stats.likeCount || 0);
      totalComments += (stats.commentCount || 0);
      totalShares += (stats.shareCount || 0);
      totalViews += (stats.playCount || 0);
    });

    const fans = authorMeta ? authorMeta.fans : (firstItem.fans || 0);
    if (fans > 0) {
      const avgER = (totalLikes + totalComments + totalShares) / (items.length * fans);
      console.log(`Computed TikTok ER: ${(avgER * 100).toFixed(2)}%`);
    } else {
      console.log("Follower count (fans) is 0, cannot compute ER.");
    }
  } catch (error) {
    console.error("TikTok Test Error:", error);
  }
}

async function main() {
  // Run tests on a public sports handle
  await runInstagramTest("espn");
  await runTikTokTest("espn");
}

main();
