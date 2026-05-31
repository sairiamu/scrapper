import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid,
  AreaChart,
  Area,
  BarChart
} from "recharts";
import { 
  Globe, 
  FileText, 
  Check, 
  Download, 
  Clipboard, 
  RefreshCw, 
  AlertCircle, 
  Sparkles, 
  Moon, 
  Sun, 
  Activity, 
  FileCode, 
  Trash2, 
  ExternalLink,
  BookOpen,
  Hash,
  Link2,
  Image as ImageIcon,
  Layers,
  HelpCircle,
  Play,
  Pause,
  ListOrdered,
  ChevronRight,
  ShieldCheck,
  FileDown
} from "lucide-react";

interface ScrapeMetadata {
  wordCount: number;
  headersCount: number;
  linksCount: number;
  imagesCount: number;
  paragraphsCount: number;
}

interface ScrapeResponse {
  success: boolean;
  url: string;
  title: string;
  output: string;
  format: "markdown" | "text";
  metadata: ScrapeMetadata;
}

interface QueueItem {
  id: string;
  url: string;
  status: "pending" | "scraping" | "completed" | "failed";
  title?: string;
  error?: string;
  result?: ScrapeResponse;
}

const PRESETS = [
  { name: "Simple Sandbox", url: "https://example.com" },
  { name: "Hacker News", url: "https://news.ycombinator.com" },
  { name: "Wikipedia Scraping", url: "https://en.wikipedia.org/wiki/Web_scraping" }
];

const CustomTooltip = ({ active, payload, isDarkMode }: any) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    return (
      <div className={`p-4 rounded-2xl border text-xs font-mono shadow-2xl backdrop-blur-md transition-all duration-300 ${
        isDarkMode 
          ? "bg-black/95 border-[#8BB02D]/35 text-gray-200" 
          : "bg-white/95 border-[#8BB02D]/30 text-gray-800"
      }`}>
        <p className="font-bold font-sans text-xs mb-2 text-[#8BB02D] truncate max-w-[220px]" title={dataPoint.title}>
          {dataPoint.title}
        </p>
        <div className="space-y-1">
          <div className="flex justify-between gap-5">
            <span className="text-gray-500">Word Size:</span>
            <span className="font-extrabold text-[#8BB02D]">{dataPoint.wordCount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between gap-5">
            <span className="text-gray-500">Total Hyperlinks:</span>
            <span className="font-extrabold text-blue-400">{dataPoint.linksCount}</span>
          </div>
          <div className="flex justify-between gap-5">
            <span className="text-gray-500">Link Density:</span>
            <span className="font-extrabold text-[#34d399]">{dataPoint.linkDensity}%</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function App() {
  const [urlsString, setUrlsString] = useState<string>(
    "https://example.com\nhttps://news.ycombinator.com"
  );
  const [format, setFormat] = useState<"markdown" | "text">("markdown");
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [scrapeStep, setScrapeStep] = useState<string>("");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [wrapText, setWrapText] = useState<boolean>(true);
  const [analyticsMetric, setAnalyticsMetric] = useState<"wordCount" | "linkDensity" | "both">("both");
  const [deepScrapeEnabled, setDeepScrapeEnabled] = useState<boolean>(false);
  const [deepScrapeSelectors, setDeepScrapeSelectors] = useState<string>(".content, .post-body, .main-content");
  const [deepScrapeDepth, setDeepScrapeDepth] = useState<number>(3);

  // Queue state management pointers
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState<number>(-1);
  const [selectedQueueItemId, setSelectedQueueItemId] = useState<string | null>(null);

  // Cycle high fidelity parser sub-steps sequentially based on time ticker
  useEffect(() => {
    if (!isScraping) {
      setScrapeStep("");
      return;
    }

    const steps = [
      "Securing route handshake...",
      "Resolving remote DNS addresses...",
      "Streaming static DOM tree elements...",
      "Loading payload inside Cheerio server container...",
      "Filtering interactive banner structures and telemetry trackers...",
      "Scrubbing standard cookie dialog wrappers...",
      "Structuring content chronologically...",
      "Mapping semantic markup structures (headings, blockquotes)...",
      "Injecting hyperlink addresses...",
      "Double cleaning redundant spacing...",
      "Finalizing text compiler outputs..."
    ];

    let index = 0;
    setScrapeStep(steps[0]);

    const interval = setInterval(() => {
      index = (index + 1) % steps.length;
      setScrapeStep(steps[index]);
    }, 1100);

    return () => clearInterval(interval);
  }, [isScraping]);

  // Sequentially process targets in the queue
  const handleQueueScrape = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Parse target urls separated by newlines
    const parsedUrls = urlsString
      .split("\n")
      .map(line => line.trim())
      .filter(line => {
        // Quick basic format check
        return line.length > 3;
      });

    if (parsedUrls.length === 0) {
      return;
    }

    // Build fresh queue elements structure
    const initialQueue: QueueItem[] = parsedUrls.map((targetUrl, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      url: targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`,
      status: "pending"
    }));

    setQueue(initialQueue);
    setSelectedQueueItemId(null);
    setIsScraping(true);

    // sequential worker process
    for (let i = 0; i < initialQueue.length; i++) {
      setCurrentQueueIndex(i);
      
      setQueue(prev => 
        prev.map((item, idx) => idx === i ? { ...item, status: "scraping" } : item)
      );

      const currentItem = initialQueue[i];
      const targetEndpoint = currentItem.url;

      try {
        const response = await fetch("/api/scrape", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            url: targetEndpoint,
            format: format,
            deepClassConfigs: {
              enabled: deepScrapeEnabled,
              selectors: deepScrapeSelectors.split(",").map(s => s.trim()).filter(Boolean),
              penetrationDepth: deepScrapeDepth
            }
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }

        if (data.success) {
          setQueue(prev => 
            prev.map((item, idx) => 
              idx === i 
                ? { ...item, status: "completed", title: data.title, result: data } 
                : item
            )
          );
          // Auto select this newly parsed item as highlight preview selection
          setSelectedQueueItemId(currentItem.id);
        } else {
          throw new Error(data.error || "Parser failed to harvest webpage data.");
        }
      } catch (err: any) {
        const errMsg = err.message || "Failed to make scraping request. Ensure host resolves.";
        setQueue(prev => 
          prev.map((item, idx) => 
            idx === i ? { ...item, status: "failed", error: errMsg } : item
          )
        );
      }
    }

    setIsScraping(false);
    setCurrentQueueIndex(-1);
  };

  // Find currently selected element in queue
  const selectedQueueItem = queue.find(item => item.id === selectedQueueItemId);
  const activePreviewResult = selectedQueueItem?.result || null;
  const activePreviewError = selectedQueueItem?.error || null;

  // Single file download trigger
  const triggerDownloadForSingleResult = (resultData: ScrapeResponse) => {
    const fileExtension = resultData.format === "markdown" ? "md" : "txt";
    const mimeType = resultData.format === "markdown" ? "text/markdown" : "text/plain";
    
    const blob = new Blob([resultData.output], { type: `${mimeType};charset=utf-8` });
    const blobUrl = URL.createObjectURL(blob);
    
    const sanitizedTitle = resultData.title
      .toLowerCase()
      .replace(/[^a-z0-9]/gi, "-")
      .replace(/-+/g, "-")
      .substring(0, 50);

    const filename = `${sanitizedTitle || "scraped-page"}.${fileExtension}`;
    
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  };

  // Merge output elements from all successfully scraped pages inside the queue
  const triggerCombinedDownload = () => {
    const completedItems = queue.filter(item => item.status === "completed" && item.result);
    if (completedItems.length === 0) return;

    const fileExtension = format === "markdown" ? "md" : "txt";
    const mimeType = format === "markdown" ? "text/markdown" : "text/plain";

    let combinedText = "";
    
    completedItems.forEach((item, index) => {
      const res = item.result!;
      if (format === "markdown") {
        combinedText += `\n<!-- START OF EXTRACTED PAGE (${index + 1}/${completedItems.length}): ${res.title} -->\n`;
        combinedText += `# ${res.title}\n`;
        combinedText += `**Source URL**: [${res.url}](${res.url})\n`;
        combinedText += `**Word Count**: ${res.metadata.wordCount} words\n\n`;
        combinedText += res.output;
        combinedText += `\n\n---\n`;
      } else {
        combinedText += `\n=======================================================\n`;
        combinedText += `PAGE ${index + 1}/${completedItems.length}: ${res.title.toUpperCase()}\n`;
        combinedText += `Source URL: ${res.url}\n`;
        combinedText += `Word Count: ${res.metadata.wordCount} words\n`;
        combinedText += `=======================================================\n\n`;
        combinedText += res.output;
        combinedText += `\n\n`;
      }
    });

    const blob = new Blob([combinedText.trim()], { type: `${mimeType};charset=utf-8` });
    const blobUrl = URL.createObjectURL(blob);
    
    const filename = `consolidated-scrapes-${Date.now()}.${fileExtension}`;
    
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleCopyTrigger = () => {
    if (!activePreviewResult) return;
    copyToClipboard(activePreviewResult.output);
  };

  // Inject target to new line
  const handlePresetTrigger = (presetUrl: string) => {
    setUrlsString(prev => {
      const trimmed = prev.trim();
      if (!trimmed) return presetUrl;
      // Filter if already existing
      if (trimmed.includes(presetUrl)) return prev;
      return `${trimmed}\n${presetUrl}`;
    });
  };

  const clearQueueAndEditor = () => {
    setQueue([]);
    setSelectedQueueItemId(null);
    setCurrentQueueIndex(-1);
  };

  // Generate interactive analytics datasets:
  const getChartData = () => {
    const completedItems = queue.filter(item => item.status === "completed" && item.result);
    if (completedItems.length > 0) {
      return completedItems.map((item, idx) => {
        const res = item.result!;
        const wordCount = res.metadata.wordCount || 0;
        const linksCount = res.metadata.linksCount || 0;
        // Link density is the percentage of links relative to word count
        const linkDensity = wordCount > 0 ? parseFloat(((linksCount / wordCount) * 100).toFixed(2)) : 0;
        
        let label = "Page " + (idx + 1);
        try {
          const u = new URL(item.url);
          label = u.hostname.replace("www.", "");
        } catch {
          if (res.title) {
            label = res.title;
          }
        }
        if (label.length > 18) {
          label = label.substring(0, 15) + "...";
        }

        return {
          name: label,
          wordCount,
          linksCount,
          linkDensity,
          title: res.title || item.url
        };
      });
    }

    // Default/Demo dataset to keep dashboard from being an empty block
    return [
      { name: "example.com", wordCount: 450, linksCount: 4, linkDensity: 0.89, title: "Example Domain" },
      { name: "news.ycombinator.com", wordCount: 1650, linksCount: 92, linkDensity: 5.58, title: "Hacker News Feed" },
      { name: "wikipedia.org/wiki", wordCount: 3950, linksCount: 342, linkDensity: 8.66, title: "Web scraping - Wikipedia" }
    ];
  };

  const chartData = getChartData();
  const isDemoDataset = !queue.some(item => item.status === "completed");

  return (
    <div 
      className={`min-h-screen font-sans transition-colors duration-500 overflow-x-hidden ${
        isDarkMode 
          ? "theme-radial-dark text-gray-100" 
          : "bg-gradient-to-tr from-[#f9faf7] via-[#e2e8d3] to-[#ffffff] text-gray-800"
      }`}
    >
      {/* Decorative background blurs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div 
          className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full opacity-15 blur-[120px]" 
          style={{ background: "#8BB02D" }}
        />
        <div 
          className="absolute bottom-[-10%] right-[-5%] w-[45%] h-[45%] rounded-full opacity-[8%] blur-[140px]" 
          style={{ background: "#8BB02D" }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 md:py-12">
        
        {/* Navigation / Header */}
        <header className="flex justify-between items-center mb-10 h-20">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
              isDarkMode ? "bg-[#8BB02D]/10 border border-[#8BB02D]/30" : "bg-white border border-[#8BB02D]/20"
            } active:scale-95`}>
              <Layers className="w-5 h-5 text-[#8BB02D]" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-display font-bold tracking-tight">
                Scrape<span className="text-[#8BB02D]">Tactile</span>
              </h1>
              <p className="text-[10px] font-mono text-[#8BB02D] tracking-wider uppercase font-semibold">
                High-Performance Queue Extractor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex gap-6 text-xs font-mono font-bold uppercase tracking-wider text-gray-400">
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[#8BB02D]" /> SECURE Handshake</span>
              <span>•</span>
              <span className="text-[#8BB02D]">Region: Sandbox</span>
            </div>
            
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              id="theme-toggler"
              aria-label="Toggle theme mode"
              className={`w-11 h-11 rounded-xl flex items-center justify-center bounce-hover-btn border ${
                isDarkMode 
                  ? "clay-btn-dark border-[#8BB02D]/20 text-yellow-400" 
                  : "clay-btn-light border-[#8BB02D]/20 text-indigo-600"
              }`}
            >
              {isDarkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight mb-2">
            Sequential <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8BB02D] to-emerald-400">Web Scraping Queue</span>
          </h2>
          <p className={`text-xs md:text-sm max-w-2xl mx-auto leading-relaxed ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            Harvest textual payloads from multiple target websites consecutively in one batch session. 
            Inputs are cleaned, formatted into Markdown or plain text files, and aggregated for consolidated extraction downloads.
          </p>
        </div>

        {/* Controller and Input Bento Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-8">
          
          {/* URL Input Form Box */}
          <div className="lg:col-span-8">
            <div className={`p-6 md:p-8 rounded-[35px] border ${
              isDarkMode ? "glass-panel border-white/5" : "clay-card-light border-[#8BB02D]/10"
            }`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-display font-bold text-lg flex items-center gap-2">
                  <ListOrdered className="w-5 h-5 text-[#8BB02D]" />
                  Sequential Queued Targets
                </h3>
                {queue.length > 0 && (
                  <button
                    type="button"
                    onClick={clearQueueAndEditor}
                    className="text-[11px] font-mono text-red-400 hover:text-red-350 transition-colors uppercase font-bold flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Reset Queue
                  </button>
                )}
              </div>

              <form onSubmit={handleQueueScrape} className="space-y-6">
                
                {/* Textarea Multi-URLs */}
                <div className="space-y-2">
                  <label htmlFor="scraper-urls" className="text-xs font-semibold font-mono tracking-wider block text-gray-400">
                    TARGET URLS (ONE PER LINE)
                  </label>
                  <div className="relative">
                    <textarea
                      id="scraper-urls"
                      rows={6}
                      className={`w-full p-4 text-xs font-mono rounded-2xl outline-none transition-all border ${
                        isDarkMode 
                          ? "clay-input border-white/5 focus:border-[#8BB02D]/40 text-gray-200 placeholder-gray-600" 
                          : "clay-input-light border-transparent focus:border-[#8BB02D]/40 text-gray-900 placeholder-gray-400"
                      } scroller-custom whitespace-pre-wrap`}
                      placeholder="https://example.com&#10;https://news.ycombinator.com&#10;https://en.wikipedia.org/wiki/Web_scraping"
                      value={urlsString}
                      onChange={(e) => setUrlsString(e.target.value)}
                      disabled={isScraping}
                    />
                  </div>
                </div>

                {/* Preset Fast Injection Buttons */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-semibold tracking-wider block text-[#8BB02D]">
                    TARGET PRESETS & SANDBOX TARGETS (CLICK TO ADD ON NEW LINE):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => handlePresetTrigger(preset.url)}
                        disabled={isScraping}
                        className={`text-xs px-3 py-1.5 rounded-xl border transition-all bounce-hover-btn font-mono ${
                          isDarkMode
                            ? "bg-black/20 border-white/5 hover:border-[#8BB02D]/30 text-gray-300"
                            : "bg-white/40 border-[#8BB02D]/10 hover:border-[#8BB02D]/30 text-gray-700"
                        }`}
                      >
                        + {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Deep Selective Class Penetration Settings */}
                <div className={`p-5 rounded-2.5xl border transition-all duration-300 ${
                  deepScrapeEnabled 
                    ? isDarkMode 
                      ? "bg-[#8BB02D]/5 border-[#8BB02D]/30" 
                      : "bg-[#8BB02D]/5 border-[#8BB02D]/30 shadow-inner"
                    : isDarkMode 
                      ? "bg-black/25 border-white/5" 
                      : "bg-black/[0.02] border-[#8BB02D]/10"
                }`}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        deepScrapeEnabled ? "bg-[#8BB02D]/20 text-[#8BB02D]" : "bg-white/5 text-gray-400"
                      }`}>
                        <Sparkles className={`w-4.5 h-4.5 ${deepScrapeEnabled ? "animate-pulse text-[#8BB02D]" : ""}`} />
                      </div>
                      <div>
                        <h4 className="text-xs md:text-sm font-sans font-extrabold tracking-tight">
                          Deep Selective Class Penetration
                        </h4>
                        <p className="text-[10px] font-mono text-gray-400">
                          Extract selective styles/classes & set hierarchy depth limits
                        </p>
                      </div>
                    </div>

                    {/* High polish custom slider switch toggle */}
                    <button
                      type="button"
                      onClick={() => setDeepScrapeEnabled(!deepScrapeEnabled)}
                      disabled={isScraping}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${
                        deepScrapeEnabled ? "bg-[#8BB02D]" : "bg-gray-700"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black shadow ring-0 transition duration-300 ease-in-out ${
                          deepScrapeEnabled ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {deepScrapeEnabled && (
                    <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
                      
                      {/* CSS Selectors Input */}
                      <div className="space-y-1.5 animate-fadeIn">
                        <label className="text-[10px] font-mono tracking-widest text-[#8BB02D] uppercase font-bold block">
                          Target CSS Classes / HTML IDs (Comma-separated)
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            disabled={isScraping}
                            value={deepScrapeSelectors}
                            onChange={(e) => setDeepScrapeSelectors(e.target.value)}
                            placeholder="e.g. post-content, entry-body, .main-story, #article"
                            className={`w-full px-4 py-3 text-xs font-mono rounded-xl border outline-none transition-all ${
                              isDarkMode
                                ? "bg-black/40 border-white/5 text-white placeholder-gray-605 focus:border-[#8BB02D]/50"
                                : "bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#8BB02D]"
                            }`}
                          />
                        </div>
                        <p className="text-[9px] text-gray-500 font-mono leading-relaxed">
                          * The extractor isolates elements matching these specific classes during sequence loop.
                        </p>
                      </div>

                      {/* Depth Stepper / Slider */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="text-gray-400 uppercase font-black tracking-wider text-[#8BB02D]">Hierarchy Penetration Depth</span>
                          <span className="text-black bg-[#8BB02D] px-2 py-0.5 rounded-md font-black text-[10px]">
                            {deepScrapeDepth} LEVELS DEEP
                          </span>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="text-[9px] font-mono text-gray-500">Shallow (v1)</span>
                          <input
                            type="range"
                            min="1"
                            max="5"
                            step="1"
                            disabled={isScraping}
                            value={deepScrapeDepth}
                            onChange={(e) => setDeepScrapeDepth(parseInt(e.target.value))}
                            className="flex-1 accent-[#8BB02D] h-1.5 bg-black/40 rounded-lg cursor-pointer"
                          />
                          <span className="text-[9px] font-mono text-gray-500">Recursive (v5)</span>
                        </div>

                        <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 text-[9px] font-mono text-gray-450 leading-relaxed italic">
                          {deepScrapeDepth === 1 && "💡 LEVEL 1: direct root class elements only (absolutely zero nested child recursion)."}
                          {deepScrapeDepth === 2 && "💡 LEVEL 2: shallow penetration (inspects direct child classes and elements)."}
                          {deepScrapeDepth === 3 && "💡 LEVEL 3: standard article layout depth (optimally crawls headings and standard blocks)."}
                          {deepScrapeDepth === 4 && "💡 LEVEL 4: recursive paragraph formatting (probes deeper nested custom grid wrappers)."}
                          {deepScrapeDepth === 5 && "💡 LEVEL 5: maximum hierarchy penetration (inspects recursively into very deep custom tag structures)."}
                        </div>
                      </div>

                    </div>
                  )}
                </div>

                {/* Sub-form Config Switch Bar */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Target format toggle */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold font-mono tracking-wider block text-gray-400">
                      EXTRACTION PROTOCOL
                    </span>
                    <div className={`p-1 rounded-xl flex gap-1 ${
                      isDarkMode ? "bg-black/30" : "bg-black/5"
                    }`}>
                      <button
                        type="button"
                        onClick={() => setFormat("markdown")}
                        disabled={isScraping}
                        className={`flex-1 py-2.5 px-3 rounded-lg font-mono text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all bounce-hover-btn ${
                          format === "markdown"
                            ? "bg-[#8BB02D] text-black font-extrabold shadow-md shadow-[#8BB02D]/20"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        <FileCode className="w-3.5 h-3.5" />
                        Markdown (.md)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormat("text")}
                        disabled={isScraping}
                        className={`flex-1 py-2.5 px-3 rounded-lg font-mono text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all bounce-hover-btn ${
                          format === "text"
                            ? "bg-[#8BB02D] text-black font-extrabold shadow-md shadow-[#8BB02D]/20"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Plain Text (.txt)
                      </button>
                    </div>
                  </div>

                  {/* Micro Hint */}
                  <div className="flex flex-col justify-center p-3 rounded-xl bg-white/5 border border-white/5 text-[10px] leading-snug italic text-gray-400">
                    <p className="flex items-start gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 flex-shrink-0 text-[#8BB02D]" />
                      <span>
                        Queue runs sequentially. Markdown compiles headers, nested link nodes, block quotes, and code blocks beautifully in chronological order.
                      </span>
                    </p>
                  </div>

                </div>

                {/* Start Active Pipeline Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isScraping}
                    className={`w-full py-4 rounded-[21px] font-display font-black tracking-wider text-base uppercase flex items-center justify-center gap-2 transition-all bounce-hover-btn ${
                      isScraping 
                        ? "opacity-50 cursor-not-allowed bg-yellow-600/20 text-[#8BB02D] border border-[#8BB02D]/30" 
                        : "clay-button text-black"
                    }`}
                  >
                    {isScraping ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin text-black" />
                        <span>PROCESSING QUEUE ({currentQueueIndex + 1}/{queue.length}) ...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 text-black fill-black" />
                        <span>INITIALIZE SEQUENTIAL EXTRACTOR</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            </div>
          </div>

          {/* Right Bento Status Widget Frame */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Scrape Analytics Dashboard Card */}
            <div className={`p-5 md:p-6 rounded-[35px] border flex flex-col justify-between ${
              isDarkMode ? "glass-panel border-white/5" : "clay-card-light border-[#8BB02D]/10"
            }`}>
              
              <div className="pb-3 border-b border-white/10 mb-4 flex justify-between items-center">
                <div>
                  <h3 className="font-display font-bold text-base flex items-center gap-2 text-white">
                    <Activity className="w-4 h-4 text-[#8BB02D] animate-pulse" />
                    Ingest Analytics
                  </h3>
                  <p className="text-[10px] font-mono text-gray-400">
                    Distribution & link density ratios
                  </p>
                </div>

                {/* Live / Demo indicator pill */}
                {isDemoDataset ? (
                  <span className="text-[9px] font-mono font-bold bg-yellow-500/10 text-yellow-500 px-2.5 py-1 rounded-full border border-yellow-500/15">
                    DEMO DATA
                  </span>
                ) : (
                  <span className="text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    LIVE MODEL
                  </span>
                )}
              </div>

              {/* Toggle metric tabs bar */}
              <div className="flex gap-1 p-0.5 rounded-xl bg-black/25 mb-4 border border-white/5">
                <button
                  type="button"
                  onClick={() => setAnalyticsMetric("both")}
                  className={`flex-1 py-1.5 rounded-lg text-[9px] font-mono font-bold transition-all ${
                    analyticsMetric === "both"
                      ? "bg-[#8BB02D] text-black"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Dual Overview
                </button>
                <button
                  type="button"
                  onClick={() => setAnalyticsMetric("wordCount")}
                  className={`flex-1 py-1.5 rounded-lg text-[9px] font-mono font-bold transition-all ${
                    analyticsMetric === "wordCount"
                      ? "bg-[#8BB02D] text-black"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Words Chart
                </button>
                <button
                  type="button"
                  onClick={() => setAnalyticsMetric("linkDensity")}
                  className={`flex-1 py-1.5 rounded-lg text-[9px] font-mono font-bold transition-all ${
                    analyticsMetric === "linkDensity"
                      ? "bg-[#8BB02D] text-black"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Density %
                </button>
              </div>

              {/* Dynamic Interactive Recharts Body Container */}
              <div className="h-[210px] w-full relative mb-4">
                <ResponsiveContainer width="100%" height={210}>
                  <ComposedChart
                    data={chartData}
                    margin={{ top: 10, right: 0, left: -22, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(139,176,45,0.1)"} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: isDarkMode ? '#888' : '#666', fontSize: 9, fontFamily: 'monospace' }}
                      axisLine={{ stroke: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                      tickLine={false}
                    />
                    
                    {/* Left axis - Word count size */}
                    <YAxis 
                      yAxisId="left"
                      orientation="left"
                      tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}
                      tick={{ fill: '#8BB02D', fontSize: 9, fontFamily: 'monospace' }}
                      axisLine={{ stroke: 'rgba(139,176,45,0.2)' }}
                      tickLine={false}
                    />

                    {/* Right Axis - Links density */}
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      tickFormatter={(val) => `${val}%`}
                      tick={{ fill: '#34d399', fontSize: 9, fontFamily: 'monospace' }}
                      axisLine={{ stroke: 'rgba(52,211,153,0.2)' }}
                      tickLine={false}
                      domain={[0, 'auto']}
                    />

                    <Tooltip content={<CustomTooltip isDarkMode={isDarkMode} />} />
                    
                    {/* Render metrics conditionally based on tabs */}
                    {(analyticsMetric === "both" || analyticsMetric === "wordCount") && (
                      <Bar 
                        yAxisId="left" 
                        dataKey="wordCount" 
                        fill="#8BB02D" 
                        radius={[6, 6, 0, 0]} 
                        maxBarSize={28}
                        opacity={0.8}
                      />
                    )}

                    {(analyticsMetric === "both" || analyticsMetric === "linkDensity") && (
                      <Line 
                        yAxisId="right" 
                        type="monotone" 
                        dataKey="linkDensity" 
                        stroke="#34d399" 
                        strokeWidth={2.5}
                        dot={{ r: 4, strokeWidth: 1.5, fill: "#000" }}
                        activeDot={{ r: 6 }}
                      />
                    )}

                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Dynamic analytic insights panel */}
              <div className="bg-black/25 p-3 rounded-2xl border border-white/5 space-y-1.5 text-[10px] font-mono">
                <div className="flex justify-between">
                  <span className="text-gray-500">AVG WORD COUNT:</span>
                  <span className="text-white font-bold">
                    {Math.round(chartData.reduce((acc, curr) => acc + curr.wordCount, 0) / chartData.length).toLocaleString()} words
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">AVG LINK DENSITY:</span>
                  <span className="text-emerald-400 font-bold">
                    {(chartData.reduce((acc, curr) => acc + curr.linkDensity, 0) / chartData.length).toFixed(2)}% (links/words)
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">ENGINE STATUS:</span>
                  <span className={`font-bold ${isScraping ? "text-yellow-400 animate-pulse" : "text-emerald-400"}`}>
                    {isScraping ? "PARSING QUEUE..." : "STANDBY"}
                  </span>
                </div>
              </div>

              {/* Micro callout text */}
              {isDemoDataset && (
                <p className="text-[9px] text-[#8BB02D]/75 italic mt-2 text-center">
                  * Live stats synchronize once URLs compile.
                </p>
              )}

            </div>

            {/* Quick Summary of scraped results */}
            {queue.some(item => item.status === "completed") && (
              <div className={`p-4 rounded-3xl border ${
                isDarkMode ? "glass-panel border-white/5" : "clay-card-light border-[#8BB02D]/10"
              }`}>
                <h4 className="text-xs font-mono font-bold text-[#8BB02D] mb-3 uppercase tracking-wider flex items-center gap-1.5">
                  <FileDown className="w-4 h-4 text-[#8BB02D]" />
                  Session Aggregation
                </h4>
                <p className="text-[11px] text-gray-400 mb-3 leading-relaxed font-mono">
                  Merge all successfully parsed list targets into a single structured output payload document.
                </p>
                <button
                  type="button"
                  onClick={triggerCombinedDownload}
                  className="w-full py-2.5 rounded-xl font-mono text-xs font-black uppercase text-black bg-[#8BB02D] flex items-center justify-center gap-1.5 bounce-hover-btn"
                >
                  <Download className="w-3.5 h-3.5" /> Download Combined
                </button>
              </div>
            )}

          </div>

        </div>

        {/* Live Active Scraping Feedback Phase logs */}
        <AnimatePresence>
          {isScraping && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-8"
            >
              <div className={`p-6 rounded-[35px] border ${
                isDarkMode ? "glass-panel border-white/5 text-gray-200" : "clay-card-light border-[#8BB02D]/10 text-gray-800"
              }`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#8BB02D]/15 flex items-center justify-center">
                      <RefreshCw className="w-4 h-4 text-[#8BB02D] animate-spin" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold font-display">
                        Processing index #{currentQueueIndex + 1}: <code className="text-[#8BB02D] font-mono text-xs">{queue[currentQueueIndex]?.url}</code>
                      </h4>
                      <p className="text-[11px] font-mono text-gray-400 mt-0.5">
                        {scrapeStep}
                      </p>
                    </div>
                  </div>
                  
                  {/* Miniature progress track bar */}
                  <div className="w-full md:w-56 bg-black/30 p-0.5 rounded-full border border-white/5">
                    <div 
                      className="h-1.5 bg-[#8BB02D] rounded-full duration-1000 transition-all" 
                      style={{ width: `${((currentQueueIndex + 1) / queue.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Interactive Processing Queue Tracker (Bento Layout) */}
        {queue.length > 0 && (
          <div className="mb-8 space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#8BB02D]">
              Scraping Queue Progression Summary ({queue.filter(q => q.status === "completed").length}/{queue.length})
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {queue.map((item, index) => {
                const isActive = selectedQueueItemId === item.id;
                const isItemScraping = item.status === "scraping";
                const isItemCompleted = item.status === "completed";
                const isItemFailed = item.status === "failed";

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (isItemCompleted || isItemFailed) {
                        setSelectedQueueItemId(item.id);
                      }
                    }}
                    className={`p-4 rounded-2.5xl border transition-all cursor-pointer relative overflow-hidden ${
                      isActive 
                        ? "border-[#8BB02D]/80 bg-[#8BB02D]/10 text-white" 
                        : isDarkMode 
                          ? "glass-panel border-white/5 hover:border-white/10" 
                          : "clay-card-light border-[#8BB02D]/10 hover:border-[#8BB02D]/35"
                    }`}
                  >
                    {/* Badge row */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[9px] font-mono text-gray-500 font-bold">
                        INDEX #0{index + 1}
                      </span>
                      
                      {/* State Tags */}
                      {isItemCompleted && (
                        <span className="text-[9px] font-mono font-bold bg-[#8BB02D]/20 text-[#8BB02D] px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Check className="w-3 h-3" /> PARSED
                        </span>
                      )}
                      {isItemScraping && (
                        <span className="text-[9px] font-mono font-bold bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
                          <RefreshCw className="w-2.5 h-2.5 animate-spin" /> HARVESTING
                        </span>
                      )}
                      {isItemFailed && (
                        <span className="text-[9px] font-mono font-bold bg-red-500/20 text-red-400 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <AlertCircle className="w-2.5 h-2.5" /> FAILED
                        </span>
                      )}
                      {item.status === "pending" && (
                        <span className="text-[9px] font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                          QUEUED
                        </span>
                      )}
                    </div>

                    {/* URL text title */}
                    <p className={`text-xs font-mono truncate font-semibold mb-1 ${
                      isActive ? "text-[#8BB02D]" : "text-gray-300"
                    }`} title={item.url}>
                      {item.url}
                    </p>

                    {/* Extracted page title fallback */}
                    <h5 className="text-[11px] font-sans font-medium line-clamp-1 text-gray-400">
                      {item.title || "Waiting sequence handshake"}
                    </h5>

                    {/* Mini Stats trigger row for processed item */}
                    {isItemCompleted && item.result && (
                      <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between gap-2 text-[10px] font-mono text-gray-400">
                        <div className="flex gap-2">
                          <span className="flex items-center gap-1"><BookOpen className="w-3 h-3 text-[#8BB02D]" /> {item.result.metadata.wordCount} words</span>
                          <span className="flex items-center gap-1"><Link2 className="w-3 h-3 text-emerald-400" /> {item.result.metadata.linksCount} links</span>
                        </div>
                        
                        {/* Download standalone */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (item.result) triggerDownloadForSingleResult(item.result);
                          }}
                          className="p-1 rounded-md bg-white/5 hover:bg-white/10 text-white transition-all"
                          title="Download single scrape payload"
                        >
                          <Download className="w-3 h-3 hover:text-[#8BB02D]" />
                        </button>
                      </div>
                    )}

                    {/* Error preview notice inside queue bento card */}
                    {isItemFailed && (
                      <p className="mt-2 text-[10px] font-mono text-red-400 italic line-clamp-1">
                        {item.error}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected queue item preview container panel */}
        <AnimatePresence>
          {selectedQueueItemId && (selectedQueueItem?.result || selectedQueueItem?.error) && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="col-span-12 space-y-4"
            >
              
              {/* If successful parse result exists */}
              {activePreviewResult && (
                <div className="space-y-6">
                  
                  {/* Bento Grid Header stats specific to the selected item */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    
                    {/* Stat - Word Count */}
                    <div className={`p-4 rounded-2.5xl text-center border relative overflow-hidden transition-all ${
                      isDarkMode ? "glass-panel border-white/5" : "clay-card-light border-[#8BB02D]/10"
                    }`}>
                      <div className="text-[#8BB02D] mb-1.5 flex justify-center"><BookOpen className="w-5 h-5" /></div>
                      <span className="block text-xl md:text-2xl font-display font-bold tracking-tight">
                        {activePreviewResult.metadata.wordCount.toLocaleString()}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider font-mono text-gray-400">Word Count</span>
                    </div>

                    {/* Stat - Headings */}
                    <div className={`p-4 rounded-2.5xl text-center border relative overflow-hidden transition-all ${
                      isDarkMode ? "glass-panel border-white/5" : "clay-card-light border-[#8BB02D]/10"
                    }`}>
                      <div className="text-[#8BB02D] mb-1.5 flex justify-center"><Hash className="w-5 h-5" /></div>
                      <span className="block text-xl md:text-2xl font-display font-bold tracking-tight">
                        {activePreviewResult.metadata.headersCount}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider font-mono text-gray-400">Headers Count</span>
                    </div>

                    {/* Stat - Links */}
                    <div className={`p-4 rounded-2.5xl text-center border relative overflow-hidden transition-all ${
                      isDarkMode ? "glass-panel border-white/5" : "clay-card-light border-[#8BB02D]/10"
                    }`}>
                      <div className="text-[#8BB02D] mb-1.5 flex justify-center"><Link2 className="w-5 h-5" /></div>
                      <span className="block text-xl md:text-2xl font-display font-bold tracking-tight">
                        {activePreviewResult.metadata.linksCount}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider font-mono text-gray-400">Extracted Links</span>
                    </div>

                    {/* Stat - Images */}
                    <div className={`p-4 rounded-2.5xl text-center border relative overflow-hidden transition-all ${
                      isDarkMode ? "glass-panel border-white/5" : "clay-card-light border-[#8BB02D]/10"
                    }`}>
                      <div className="text-[#8BB02D] mb-1.5 flex justify-center"><ImageIcon className="w-5 h-5" /></div>
                      <span className="block text-xl md:text-2xl font-display font-bold tracking-tight">
                        {activePreviewResult.metadata.imagesCount}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider font-mono text-gray-400">Captured Images</span>
                    </div>

                    {/* Stat - Paragraphs */}
                    <div className="col-span-2 md:col-span-1 p-4 rounded-2.5xl text-center border relative overflow-hidden transition-all bg-gradient-to-br from-[#8BB02D]/15 to-transparent border-[#8BB02D]/25">
                      <div className="text-[#8BB02D] mb-1.5 flex justify-center"><FileText className="w-5 h-5" /></div>
                      <span className="block text-xl md:text-2xl font-display font-bold text-[#8BB02D] tracking-tight">
                        {activePreviewResult.metadata.paragraphsCount}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider font-mono text-[#8BB02D] font-bold">Paragraphs</span>
                    </div>

                  </div>

                  {/* Main Preview Console */}
                  <div className={`p-6 md:p-8 rounded-[35px] border relative ${
                    isDarkMode ? "glass-panel border-white/5" : "clay-card-light border-[#8BB02D]/10"
                  }`}>
                    
                    {/* Console Header Bar */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10 mb-6">
                      <div>
                        <span className="text-[10px] font-mono uppercase bg-[#8BB02D]/20 text-[#8BB02D] px-2.5 py-1 rounded-md font-bold tracking-wide mr-2 inline-block">
                          {activePreviewResult.format.toUpperCase()} PARSED OUTPUT PREVIEW
                        </span>
                        <h4 className="text-lg font-display font-bold truncate max-w-md mt-1" title={activePreviewResult.title}>
                          {activePreviewResult.title}
                        </h4>
                        <p className="text-xs text-gray-400 truncate flex items-center gap-1.5 mt-0.5" title={activePreviewResult.url}>
                          <Globe className="w-3.5 h-3.5 flex-shrink-0 text-[#8BB02D]" />
                          <span className="font-mono truncate">{activePreviewResult.url}</span>
                        </p>
                      </div>

                      {/* Line wrapping toggle and triggers */}
                      <div className="flex flex-wrap items-center gap-2">
                        
                        {/* Wrap text toggle */}
                        <button
                          onClick={() => setWrapText(!wrapText)}
                          className={`text-xs px-3.5 py-2 rounded-xl border transition-all bounce-hover-btn font-mono ${
                            wrapText
                              ? isDarkMode
                                ? "bg-white/10 border-white/20 text-white font-bold"
                                : "bg-black/10 border-black/10 text-black font-semibold"
                              : isDarkMode
                                ? "bg-transparent border-white/5 text-gray-550"
                                : "bg-transparent border-black/5 text-gray-400"
                          }`}
                        >
                          {wrapText ? "Wrapped Lines" : "Raw Lines"}
                        </button>

                        {/* Copy String */}
                        <button
                          onClick={handleCopyTrigger}
                          className={`text-xs px-4 py-2.5 rounded-xl border transition-all font-mono font-semibold flex items-center gap-2 bounce-hover-btn ${
                            isDarkMode
                              ? "clay-btn-dark border-white/5 text-white"
                              : "clay-btn-light border-[#8BB02D]/10 text-gray-800"
                          }`}
                        >
                          <Clipboard className="w-4 h-4" />
                          Copy Output
                        </button>

                        {/* Download standalone */}
                        <button
                          onClick={() => triggerDownloadForSingleResult(activePreviewResult)}
                          className="text-xs px-4 py-2.5 rounded-xl font-mono font-extrabold flex items-center gap-2 bounce-hover-btn clay-btn-lime"
                        >
                          <Download className="w-4 h-4 text-black" />
                          Download Standalone
                        </button>

                      </div>

                    </div>

                    {/* Code Container scrollable preview */}
                    <div className="relative">
                      <div className="absolute top-2 right-2 flex items-center opacity-45 pointer-events-none">
                        <span className="text-[10px] font-mono tracking-wider bg-black/40 px-2.5 py-1 rounded-md text-white">
                          LIVE CONSOLE VIEW
                        </span>
                      </div>

                      <pre className={`p-5 rounded-2xl overflow-auto max-h-[500px] text-xs font-mono scroller-custom border ${
                        isDarkMode 
                          ? "bg-black/55 text-gray-300 border-white/5" 
                          : "bg-[#f5f7f2] text-gray-800 border-[#8BB02D]/10"
                      } ${wrapText ? "whitespace-pre-wrap break-all" : "whitespace-pre overflow-x-auto"}`}>
                        {activePreviewResult.output}
                      </pre>
                    </div>

                  </div>

                </div>
              )}

              {/* If item failed parse with error response output */}
              {activePreviewError && (
                <div className={`p-6 rounded-3xl border-2 flex items-start gap-4 ${
                  isDarkMode 
                    ? "bg-red-500/10 border-red-500/30 text-red-100" 
                    : "bg-red-50/90 border-red-400/40 text-red-800"
                }`}>
                  <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-display font-bold text-base text-red-500">Queue Index Parser Halted</h4>
                    <p className="text-sm leading-relaxed opacity-85">Target url responded with error: {activePreviewError}</p>
                    <ul className="text-xs list-disc pl-4 space-y-1 mt-2 opacity-75">
                      <li>Resource hostname might block generic crawlers (such as Cloudflare browser barriers).</li>
                      <li>Domain DNS might be misconfigured, offline, or inaccessible.</li>
                    </ul>
                  </div>
                </div>
              )}

            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer info element panel */}
        <footer className="mt-20 text-center border-t border-white/5 pt-8 pb-4">
          <p className="text-xs text-gray-500 flex items-center justify-center gap-2">
            <span>ScrapeTactile Platform</span>
            <span>•</span>
            <span className="text-[#8BB02D] font-mono">UTC: 2026-05-31</span>
            <span>•</span>
            <a 
              href="https://github.com/cheeriojs/cheerio" 
              target="_blank" 
              rel="noreferrer"
              className="hover:text-white transition-colors underline flex items-center gap-0.5"
            >
              Cheerio Ingest <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </footer>

      </div>
    </div>
  );
}
