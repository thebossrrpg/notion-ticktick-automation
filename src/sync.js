// Sync Notion Priority to TickTick
// This script is called by GitHub Actions when Make.com triggers it

const { Client } = require('@notionhq/client');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const axios = require('axios');

// Environment variables
const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;
const GOOGLE_SHEETS_CREDENTIALS = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS);
const TICKTICK_API_KEY = process.env.TICKTICK_API_KEY;

// TickTick List IDs
const TICKTICK_LISTS = {
  '0': process.env.TICKTICK_LIST_0,
  '1': process.env.TICKTICK_LIST_1,
  '2': process.env.TICKTICK_LIST_2,
  '3': process.env.TICKTICK_LIST_3,
  '4': process.env.TICKTICK_LIST_4,
  '5': process.env.TICKTICK_LIST_5
};

// Parse payload from Make.com
const payload = JSON.parse(process.env.PAYLOAD || '{}');

async function main() {
  try {
    console.log('Starting sync process...');
    console.log('Payload:', JSON.stringify(payload, null, 2));

    // Extract page ID from payload
    const pageId = payload.id || payload.page_id;
    if (!pageId) {
      throw new Error('No page ID found in payload');
    }

    // Initialize Notion client
    const notion = new Client({ auth: NOTION_API_KEY });

    // Get page from Notion
    console.log(`Fetching page ${pageId} from Notion...`);
    const page = await notion.pages.retrieve({ page_id: pageId });
    
    // Get current Priority value
    const currentPriority = page.properties.Priority?.select?.name;
    console.log(`Current Priority: ${currentPriority}`);

    if (!currentPriority) {
      console.log('No Priority value found, exiting');
      return;
    }

    // Initialize Google Sheets
    const doc = new GoogleSpreadsheet(GOOGLE_SHEET_ID);
    await doc.useServiceAccountAuth(GOOGLE_SHEETS_CREDENTIALS);
    await doc.loadInfo();
    
    const sheet = doc.sheetsByIndex[0]; // First sheet
    await sheet.loadHeaderRow();
    const rows = await sheet.getRows();

    // Find row for this page
    let existingRow = rows.find(row => row.PageID === pageId);
    let oldPriority = existingRow ? existingRow.Priority : null;

    console.log(`Old Priority from cache: ${oldPriority}`);

    // Check if Priority changed
    if (oldPriority === currentPriority) {
      console.log('Priority has not changed, no action needed');
      return;
    }

    console.log(`Priority changed from "${oldPriority}" to "${currentPriority}"`);

    // Get page title
    const titleProperty = page.properties.Name || page.properties.title || page.properties.Title;
    let pageTitle = 'Untitled';
    if (titleProperty) {
      if (titleProperty.title && titleProperty.title.length > 0) {
        pageTitle = titleProperty.title[0].plain_text;
      } else if (titleProperty.rich_text && titleProperty.rich_text.length > 0) {
        pageTitle = titleProperty.rich_text[0].plain_text;
      }
    }
    console.log(`Page title: ${pageTitle}`);

    // Create task in TickTick
    const listId = TICKTICK_LISTS[currentPriority];
    if (!listId) {
      console.log(`No TickTick list configured for Priority ${currentPriority}`);
    } else {
      console.log(`Creating task in TickTick list ${listId}...`);
      
      // Note: TickTick API endpoint needs to be verified
      // This is a placeholder - you'll need to check TickTick's actual API
      try {
        await axios.post('https://api.ticktick.com/open/v1/task', {
          title: pageTitle,
          projectId: listId,
          content: `From Notion - Priority ${currentPriority}`
        }, {
          headers: {
            'Authorization': `Bearer ${TICKTICK_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('Task created successfully in TickTick');
      } catch (error) {
        console.error('Error creating TickTick task:', error.response?.data || error.message);
        // Continue anyway to update cache
      }
    }

    // Update Google Sheets cache
    if (existingRow) {
      existingRow.Priority = currentPriority;
      await existingRow.save();
      console.log('Updated existing row in cache');
    } else {
      await sheet.addRow({ PageID: pageId, Priority: currentPriority });
      console.log('Added new row to cache');
    }

    console.log('Sync completed successfully!');
  } catch (error) {
    console.error('Error in sync process:', error);
    throw error;
  }
}

// Run main function
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
