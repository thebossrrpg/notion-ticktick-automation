// Sync Notion Priority to TickTick
// Simplified version using file-based cache

const { Client } = require('@notionhq/client');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Environment variables
const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;
const TICKTICK_USERNAME = process.env.TICKTICK_USERNAME;
const TICKTICK_PASSWORD = process.env.TICKTICK_PASSWORD;

// TickTick List IDs
const TICKTICK_LISTS = {
  '0': process.env.TICKTICK_LIST_PRIORITY_0,
  '1': process.env.TICKTICK_LIST_PRIORITY_1,
  '2': process.env.TICKTICK_LIST_PRIORITY_2,
  '3': process.env.TICKTICK_LIST_PRIORITY_3,
  '4': process.env.TICKTICK_LIST_PRIORITY_4,
  '5': process.env.TICKTICK_LIST_PRIORITY_5
};

const CACHE_FILE = path.join(__dirname, '..', 'cache.json');

// Initialize Notion client
const notion = new Client({ auth: NOTION_API_KEY });

// TickTick API authentication
let tickTickAccessToken = null;

async function authenticateTickTick() {
  try {
    const response = await axios.post('https://api.ticktick.com/api/v2/user/signon', {
      username: TICKTICK_USERNAME,
      password: TICKTICK_PASSWORD
    });
    tickTickAccessToken = response.data.token;
    console.log('TickTick authenticated successfully');
  } catch (error) {
    console.error('TickTick authentication failed:', error.response?.data || error.message);
    throw error;
  }
}

// Load cache from file
async function loadCache() {
  try {
    const data = await fs.readFile(CACHE_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist yet
    return {};
  }
}

// Save cache to file
async function saveCache(cache) {
  await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2));
}

// Get all pages from Notion database
async function getNotionPages() {
  try {
    const response = await notion.databases.query({
      database_id: NOTION_DATABASE_ID,
    });
    return response.results;
  } catch (error) {
    console.error('Error fetching Notion pages:', error.message);
    throw error;
  }
}

// Extract priority value from Notion page
function getPriority(page) {
  try {
    const priorityProperty = page.properties.Priority;
    if (!priorityProperty) return null;
    
    // Handle different property types
    if (priorityProperty.type === 'select' && priorityProperty.select) {
      return priorityProperty.select.name;
    }
    if (priorityProperty.type === 'number') {
      return String(priorityProperty.number);
    }
    return null;
  } catch (error) {
    return null;
  }
}

// Get page title
function getPageTitle(page) {
  try {
    const titleProperty = page.properties.Name || page.properties.Title || Object.values(page.properties).find(p => p.type === 'title');
    if (!titleProperty || !titleProperty.title || titleProperty.title.length === 0) {
      return 'Untitled';
    }
    return titleProperty.title.map(t => t.plain_text).join('');
  } catch (error) {
    return 'Untitled';
  }
}

// Create task in TickTick
async function createTickTickTask(title, listId) {
  try {
    const response = await axios.post(
      'https://api.ticktick.com/open/v1/task',
      {
        title: title,
        projectId: listId
      },
      {
        headers: {
          'Authorization': `Bearer ${tickTickAccessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log(`Task created in TickTick: ${title}`);
    return response.data;
  } catch (error) {
    console.error(`Error creating TickTick task: ${error.response?.data || error.message}`);
    throw error;
  }
}

async function main() {
  try {
    console.log('Starting sync process...');
    
    // Authenticate TickTick
    await authenticateTickTick();
    
    // Load cache
    const cache = await loadCache();
    console.log(`Loaded cache with ${Object.keys(cache).length} entries`);
    
    // Get all pages from Notion
    const pages = await getNotionPages();
    console.log(`Found ${pages.length} pages in Notion`);
    
    let changesDetected = 0;
    
    // Check each page for priority changes
    for (const page of pages) {
      const pageId = page.id;
      const currentPriority = getPriority(page);
      const previousPriority = cache[pageId];
      
      // Check if priority changed
      if (currentPriority !== null && currentPriority !== previousPriority) {
        console.log(`Priority changed for page ${pageId}: ${previousPriority} -> ${currentPriority}`);
        
        // Get list ID for this priority
        const listId = TICKTICK_LISTS[currentPriority];
        if (listId) {
          const title = getPageTitle(page);
          await createTickTickTask(title, listId);
          changesDetected++;
        } else {
          console.warn(`No list ID configured for priority: ${currentPriority}`);
        }
        
        // Update cache
        cache[pageId] = currentPriority;
      }
    }
    
    // Save updated cache
    await saveCache(cache);
    console.log(`Sync completed. ${changesDetected} tasks created.`);
    
  } catch (error) {
    console.error('Error in main process:', error);
    process.exit(1);
  }
}

main();
