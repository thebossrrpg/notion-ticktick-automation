// Sync Notion Priority to TickTick
// Uses file-based cache + priority comparison + rate limiting (MAX_PER_RUN + delay)

const { Client } = require("@notionhq/client");
const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");

// Environment variables
const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

// ATENÇÃO: nome da env precisa bater com o secret no GitHub
// Ex.: env: TICKTICKACCESSTOKEN: ${{ secrets.TICKTICKACCESSTOKEN }}
const TICKTICK_ACCESS_TOKEN = process.env.TICKTICKACCESSTOKEN;

// TickTick List IDs
const TICKTICK_LISTS = {
  "0": process.env.TICKTICK_LIST_PRIORITY_0,
  "1": process.env.TICKTICK_LIST_PRIORITY_1,
  "2": process.env.TICKTICK_LIST_PRIORITY_2,
  "3": process.env.TICKTICK_LIST_PRIORITY_3,
  "4": process.env.TICKTICK_LIST_PRIORITY_4,
  "5": process.env.TICKTICK_LIST_PRIORITY_5,
};

const CACHE_FILE = path.join(__dirname, "..", "cache.json");

// Rate limit settings
const MAX_PER_RUN = 90; // máximo de tasks criadas por execução
const DELAY_BETWEEN_TASKS_MS = 3000; // 3 segundos entre tasks

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function appendFailedTaskLog(line) {
  const logPath = path.join(__dirname, "..", "failed-tasks.log");
  try {
    await fs.appendFile(logPath, line + "\n", "utf8");
  } catch (e) {
    console.error("Error writing failed-tasks.log:", e.message);
  }
}

// Initialize Notion client
const notion = new Client({ auth: NOTION_API_KEY });

// Load cache from file
async function loadCache() {
  try {
    const data = await fs.readFile(CACHE_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist yet or invalid JSON
    return {};
  }
}

// Save cache to file
async function saveCache(cache) {
  await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2));
}

// Get all pages from Notion database (with pagination)
async function getNotionPages() {
  const allResults = [];
  let cursor = undefined;

  try {
    while (true) {
      const response = await notion.databases.query({
        database_id: NOTION_DATABASE_ID,
        start_cursor: cursor,
      });

      allResults.push(...response.results);

      if (!response.has_more) {
        break;
      }

      cursor = response.next_cursor;
    }

    return allResults;
  } catch (error) {
    console.error("Error fetching Notion pages:", error.message);
    throw error;
  }
}

// Extract priority value from Notion page
function getPriority(page) {
  try {
    const priorityProperty = page.properties.Priority;
    if (!priorityProperty) return null;

    // Handle different property types
    if (priorityProperty.type === "select" && priorityProperty.select) {
      return priorityProperty.select.name;
    }

    if (priorityProperty.type === "number") {
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
    const titleProperty =
      page.properties.Name ||
      page.properties.Title ||
      Object.values(page.properties).find((p) => p.type === "title");

    if (
      !titleProperty ||
      !titleProperty.title ||
      titleProperty.title.length === 0
    ) {
      return "Untitled";
    }

    return titleProperty.title.map((t) => t.plain_text).join("");
  } catch (error) {
    return "Untitled";
  }
}

// Get URL property
function getPageUrlProperty(page) {
  try {
    const urlProperty =
      page.properties.URL || page.properties.Url || page.properties.Link;

    if (!urlProperty) return null;

    if (urlProperty.type === "url") {
      return urlProperty.url;
    }

    // Fallback se for texto simples
    if (
      urlProperty.type === "rich_text" &&
      urlProperty.rich_text.length > 0
    ) {
      return urlProperty.rich_text.map((t) => t.plain_text).join("");
    }

    return null;
  } catch (error) {
    return null;
  }
}

// Sanitize title: mantém só alfanuméricos (incluindo acentos) e espaço
function sanitizeTitle(rawTitle) {
  if (!rawTitle) return "Sem titulo";

  // Remove tudo que não for letra, número, acento ou espaço
  const onlyBasic = rawTitle.replace(/[^0-9A-Za-zÀ-ÿ ]+/g, " ");
  const collapsed = onlyBasic.replace(/\s+/g, " ").trim();

  // Garante que não fica gigante
  return collapsed.slice(0, 200);
}

// Cria task no TickTick; recebe título final pronto e ID da página
async function createTickTickTask(finalTitle, listId, pageId) {
  try {
    const response = await axios.post(
      "https://api.ticktick.com/open/v1/task",
      {
        title: finalTitle,
        projectId: listId,
      },
      {
        headers: {
          Authorization: `Bearer ${TICKTICK_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`Task created in TickTick: ${finalTitle}`);
    return response.data;
  } catch (error) {
    const errData = error.response?.data || {};
    console.error(
      `Error creating TickTick task: ${
        Object.keys(errData).length ? JSON.stringify(errData) : error.message
      }`
    );

    // Loga 500 em arquivo com pageId + título + listId
    if (error.response?.status === 500) {
      const logLine = `[${new Date().toISOString()}] pageId=${pageId} title="${finalTitle}" listId=${listId}`;
      await appendFailedTaskLog(logLine);
    }

    throw error;
  }
}

async function main() {
  try {
    console.log("Starting sync process...");

    if (!TICKTICK_ACCESS_TOKEN) {
      console.error("TICKTICK_ACCESS_TOKEN is not set. Aborting.");
      process.exit(1);
    }

    // Load cache
    const cache = await loadCache();
    console.log(`Loaded cache with ${Object.keys(cache).length} entries`);

    // Get all pages from Notion
    const pages = await getNotionPages();
    console.log(`Found ${pages.length} pages in Notion`);

    let changesDetected = 0;
    let createdThisRun = 0;

    // Check each page for priority changes
    for (const page of pages) {
      const pageId = page.id;

      const currentPriorityRaw = getPriority(page);
      const currentPriority =
        typeof currentPriorityRaw === "string"
          ? currentPriorityRaw.trim()
          : currentPriorityRaw;

      const previousPriority = cache[pageId];

      // DEBUG: ver o que está vindo
      console.log(
        "DEBUG priority",
        pageId,
        "current:",
        JSON.stringify(currentPriority),
        "previous:",
        JSON.stringify(previousPriority)
      );

      // Skip if no priority set
      if (currentPriority === null) {
        continue;
      }

      // Limite por execução
      if (createdThisRun >= MAX_PER_RUN) {
        console.log(
          "Reached MAX_PER_RUN, stopping new TickTick tasks for this run."
        );
        break;
      }

      // Criar tarefa sempre que a prioridade atual for diferente da registrada no cache
      if (currentPriority !== previousPriority) {
        console.log(
          `Priority changed for page ${pageId}: ${previousPriority} -> ${currentPriority}`
        );

        // Get list ID for this priority
        const listId = TICKTICK_LISTS[currentPriority];

        if (listId) {
          const baseTitle = getPageTitle(page);
          const urlProp = getPageUrlProperty(page);

          const cleanBase = sanitizeTitle(baseTitle);
          const finalTitle = urlProp
            ? `[${cleanBase}] (${urlProp})`
            : cleanBase;

          try {
            await createTickTickTask(finalTitle, listId, pageId);
            createdThisRun++;
            changesDetected++;
          } catch (error) {
            console.error(
              `TickTick returned error for page ${pageId} (priority ${currentPriority}). Skipping and continuing.`
            );
          }

          // Delay entre tasks para suavizar chamadas
          if (createdThisRun < MAX_PER_RUN) {
            console.log(
              `Waiting ${DELAY_BETWEEN_TASKS_MS / 1000} seconds before next task...`
            );
            await delay(DELAY_BETWEEN_TASKS_MS);
          }
        } else {
          console.warn(
            `No list ID configured for priority: ${currentPriority}`
          );
        }

        // Update cache
        cache[pageId] = currentPriority;
      }
    }

    // Save updated cache
    await saveCache(cache);

    console.log(
      `Sync completed. ${changesDetected} tasks created, ${createdThisRun} in this run.`
    );
  } catch (error) {
    console.error("Error in main process:", error);
    process.exit(1);
  }
}

main();
