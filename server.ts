import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import * as cheerio from "cheerio";
import dns from "dns";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Helper function to resolve relative URLs
function resolveUrl(base: string, relative: string): string {
  try {
    return new URL(relative, base).toString();
  } catch (e) {
    return relative;
  }
}

interface DeepClassConfigs {
  enabled: boolean;
  selectors: string[];
  penetrationDepth: number;
}

// Custom clean and parse scraper functionality
function parseHtmlContent(
  html: string, 
  baseUrl: string, 
  format: "markdown" | "text",
  deepClassConfigs?: DeepClassConfigs
) {
  const $ = cheerio.load(html);

  // Remove boilerplates upfront
  $("script, style, noscript, iframe, svg, canvas, header, footer, nav, aside, dialog, .header, .footer, .nav, .sidebar, .sidebar-wrapper, .menu, .ads, .ad-box, .banner-ad, #footer, #header, #navigation, #sidebar, form, input, button, select, textarea, .cookie-consent, #cookie-banner, .social-share, .comments-section, .related-posts").remove();

  // Look for target core containers to scrape from
  let $root: any = $("body");

  if (deepClassConfigs && deepClassConfigs.enabled && deepClassConfigs.selectors && deepClassConfigs.selectors.length > 0) {
    const matchedSelectors: string[] = [];
    deepClassConfigs.selectors.forEach(sel => {
      let s = sel.trim();
      if (!s) return;
      // Ensure valid class or utility identifier
      if (!s.startsWith(".") && !s.startsWith("#") && !/^[a-zA-Z]/.test(s)) {
        s = "." + s;
      }
      matchedSelectors.push(s);
    });

    if (matchedSelectors.length > 0) {
      const combinedSelector = matchedSelectors.join(", ");
      const found = $(combinedSelector);
      if (found.length > 0) {
        // Build a fresh isolated root using selected classes
        const $customRoot = cheerio.load("<div id='custom-root'></div>")("#custom-root");
        
        found.each((_, elem) => {
          const $clone = $(elem).clone();
          const maxDepth = deepClassConfigs.penetrationDepth || 5;
          
          // Prune nested element depths to respect specified class target penetration depth limits
          function pruneDepth($node: any, currentDepth: number) {
            if (currentDepth >= maxDepth) {
              $node.children().remove();
              return;
            }
            $node.children().each((_, child) => {
              pruneDepth($(child), currentDepth + 1);
            });
          }
          
          pruneDepth($clone, 1);
          $customRoot.append($clone);
        });
        
        $root = $customRoot;
      }
    }
  } else {
    // Normal fallback sequence
    const coreContainers = [
      "article",
      "main",
      "[role='main']",
      "#content",
      ".content",
      "#main-content",
      ".main-content",
      ".post-content",
      ".article-content",
      ".entry-content",
      ".post-body",
      ".story-body"
    ];

    for (const selector of coreContainers) {
      const found = $(selector);
      if (found.length > 0 && found.text().trim().length > 300) {
        $root = found.first();
        break;
      }
    }
  }

  const title = $("title").text().trim() || $("h1").first().text().trim() || "Scraped Document";
  
  // Elements parsed stats
  let linksCount = 0;
  let headersCount = 0;
  let imagesCount = 0;
  let paragraphsCount = 0;

  // Let's traverse the DOM tree sequentially to preserve reading order
  const elementsList: string[] = [];

  function traverse(node: any) {
    if (node.type === "text") {
      const text = node.data.trim();
      if (text) {
        // standalone text
      }
      return;
    }

    if (node.type !== "tag") return;

    const tagName = node.name.toLowerCase();

    // Skip nested boilerplates that might remain
    if (["script", "style", "nav", "footer", "header", "aside", "form"].includes(tagName)) return;

    // Handle distinct elements in structural order
    if (/^h[1-6]$/.test(tagName)) {
      headersCount++;
      const text = $(node).text().trim().replace(/\s+/g, " ");
      if (text) {
        if (format === "markdown") {
          const depth = parseInt(tagName.substring(1));
          const hashes = "#".repeat(depth);
          elementsList.push(`\n${hashes} ${text}\n`);
        } else {
          elementsList.push(`\n${text.toUpperCase()}\n${"=".repeat(Math.min(text.length, 40))}\n`);
        }
      }
      return; // done with children for block headers
    }

    if (tagName === "p") {
      paragraphsCount++;
      // Check for code inside or standard formatting
      const text = $(node).text().trim().replace(/\s+/g, " ");
      if (text) {
        // Extract embedded links if any in markdown
        if (format === "markdown") {
          // Process inner html specifically for link syntax or styled chunks
          let pText = "";
          $(node).contents().each((_, child) => {
            if (child.type === "text") {
              pText += child.data;
            } else if (child.type === "tag" && child.name.toLowerCase() === "a") {
              const href = $(child).attr("href") || "";
              const cleanHref = resolveUrl(baseUrl, href);
              const anchorText = $(child).text().trim();
              if (anchorText && cleanHref.startsWith("http")) {
                linksCount++;
                pText += ` [${anchorText}](${cleanHref}) `;
              } else {
                pText += anchorText;
              }
            } else if (child.type === "tag" && ["strong", "b"].includes(child.name.toLowerCase())) {
              pText += ` **${$(child).text().trim()}** `;
            } else if (child.type === "tag" && ["em", "i"].includes(child.name.toLowerCase())) {
              pText += ` *${$(child).text().trim()}* `;
            } else if (child.type === "tag" && child.name.toLowerCase() === "code") {
              pText += ` \`${$(child).text().trim()}\` `;
            } else {
              pText += $(child).text();
            }
          });
          pText = pText.trim().replace(/\s+/g, " ");
          elementsList.push(`\n${pText}\n`);
        } else {
          const textClean = $(node).text().trim().replace(/\s+/g, " ");
          elementsList.push(`\n${textClean}\n`);
        }
      }
      return;
    }

    if (tagName === "blockquote") {
      const text = $(node).text().trim().replace(/\s+/g, " ");
      if (text) {
        if (format === "markdown") {
          elementsList.push(`\n> ${text}\n`);
        } else {
          elementsList.push(`\n   "${text}"\n`);
        }
      }
      return;
    }

    if (tagName === "pre") {
      const text = $(node).text().trim();
      if (text) {
        if (format === "markdown") {
          elementsList.push(`\n\`\`\`\n${text}\n\`\`\`\n`);
        } else {
          elementsList.push(`\n[CODE BLOCK]\n${text}\n[END CODE BLOCK]\n`);
        }
      }
      return;
    }

    if (tagName === "ul" || tagName === "ol") {
      const isOrdered = tagName === "ol";
      const items: string[] = [];
      $(node).children("li").each((idx, li) => {
        const liText = $(li).text().trim().replace(/\s+/g, " ");
        if (liText) {
          if (format === "markdown") {
            items.push(isOrdered ? `${idx + 1}. ${liText}` : `* ${liText}`);
          } else {
            items.push(isOrdered ? `  ${idx + 1}) ${liText}` : `  • ${liText}`);
          }
        }
      });
      if (items.length > 0) {
        elementsList.push(`\n${items.join("\n")}\n`);
      }
      return;
    }

    if (tagName === "table") {
      const rows: string[][] = [];
      $(node).find("tr").each((_, tr) => {
        const cells: string[] = [];
        $(tr).find("th, td").each((_, td) => {
          cells.push($(td).text().trim().replace(/\s+/g, " "));
        });
        if (cells.length > 0) {
          rows.push(cells);
        }
      });

      if (rows.length > 0) {
        if (format === "markdown") {
          let tableMd = "\n";
          rows.forEach((row, ri) => {
            tableMd += `| ${row.join(" | ")} |\n`;
            if (ri === 0) {
              // Add divider line
              tableMd += `| ${row.map(() => "---").join(" | ")} |\n`;
            }
          });
          tableMd += "\n";
          elementsList.push(tableMd);
        } else {
          let tableText = "\n" + "=".repeat(40) + "\n";
          rows.forEach((row) => {
            tableText += `| ${row.join(" \t| ")} |\n`;
          });
          tableText += "=" + "=".repeat(39) + "\n";
          elementsList.push(tableText);
        }
      }
      return;
    }

    if (tagName === "img") {
      imagesCount++;
      const src = $(node).attr("src") || "";
      const alt = $(node).attr("alt") || "Embedded Image";
      const resolvedSrc = resolveUrl(baseUrl, src);
      if (resolvedSrc.startsWith("http")) {
        if (format === "markdown") {
          elementsList.push(`\n![${alt}](${resolvedSrc})\n`);
        } else {
          elementsList.push(`\n[Image: ${alt} (Source: ${resolvedSrc})]\n`);
        }
      }
      return;
    }

    // Default container handling (divs, sections, containers, span etc.) — walk internal children
    $(node).contents().each((_, child) => {
      traverse(child);
    });
  }

  // Kickstart sequential traversal on the isolated content root block
  $root.contents().each((_, node) => {
    traverse(node);
  });

  // Stitch them together and normalize sequential whitespace
  let fullOutput = elementsList.join("\n").trim();
  // Double-check to remove redundant blank line sequences
  fullOutput = fullOutput.replace(/\n{3,}/g, "\n\n");

  const wordCount = fullOutput.split(/\s+/).filter(Boolean).length;

  return {
    title,
    content: fullOutput || "Could not extract core content. Try scraping as Plain Text, or ensure this URL contains standard headers and paragraphs.",
    stats: {
      wordCount,
      headersCount,
      linksCount,
      imagesCount,
      paragraphsCount
    }
  };
}

// Robust endpoint to perform scraping
app.post("/api/scrape", async (req, res) => {
  const { url: targetUrl, format, deepClassConfigs } = req.body;

  if (!targetUrl) {
    return res.status(400).json({ error: "URL parameter is required." });
  }

  const chosenFormat = format === "markdown" ? "markdown" : "text";

  // Quick URL validation
  let validatedUrl = targetUrl.trim();
  if (!/^https?:\/\//i.test(validatedUrl)) {
    validatedUrl = "https://" + validatedUrl;
  }

  try {
    const parsedUrl = new URL(validatedUrl);
    if (!parsedUrl.hostname) {
      throw new Error("Invalid host");
    }

    // Fetch targets with client-mimic requests header configuration
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 seconds abort threshold

    const response = await fetch(validatedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Cache-Control": "max-age=0"
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Failed connection. Target responded with status ${response.status}.`
      });
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml") && !contentType.includes("text/plain")) {
      return res.status(400).json({
        error: "Target content is not HTML or standard text. It may be a PDF, bin, or file stream directly."
      });
    }

    const html = await response.text();
    const result = parseHtmlContent(html, validatedUrl, chosenFormat, deepClassConfigs);

    return res.json({
      success: true,
      url: validatedUrl,
      title: result.title,
      output: result.content,
      format: chosenFormat,
      metadata: result.stats
    });

  } catch (error: any) {
    console.error("Scraping error occurred:", error);
    let errorMsg = "Double-check your internet connectivity and host spelling.";
    if (error.name === "AbortError") {
      errorMsg = "Request timeout. Target took too long to respond (> 12 seconds).";
    } else if (error.code === "ENOTFOUND") {
      errorMsg = "The domain name could not be resolved. Please verify host accuracy.";
    } else if (error.message) {
      errorMsg = error.message;
    }
    return res.status(500).json({
      error: `Scraping error: ${errorMsg}`
    });
  }
});

// Configure Vite rendering & static index routing
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
