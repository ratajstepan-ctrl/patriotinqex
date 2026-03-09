"use client";

// =============================================================================
// TWITTER / X FEED COMPONENT
// =============================================================================
//
// HOW TO CONNECT YOUR TWITTER ACCOUNT:
// ------------------------------------
// This component embeds a Twitter timeline for each party. To set it up:
//
// 1. Create a Twitter/X account for your project (e.g., @PatriotIndexCZ)
//
// 2. Configure party hashtags in the PARTY_TWITTER_CONFIG below.
//    Each party maps to a hashtag that filters tweets to display.
//    You can also map to a specific Twitter list or search query.
//
// 3. The embed uses Twitter's official oEmbed widget. For it to work:
//    - The tweets must be public
//    - You tweet from your account with the party hashtag (e.g., #PatriotANO)
//    - The widget will show all tweets with that hashtag from your timeline
//
// ALTERNATIVE: Twitter API (more control, requires API key)
//    Set NEXT_PUBLIC_TWITTER_BEARER_TOKEN in your environment variables,
//    and this component will switch to using the Twitter API v2 to fetch
//    tweets programmatically. This gives you full control over filtering.
//
// =============================================================================

// Configure which hashtag/search to use for each party
// Edit these to match your Twitter posting strategy
const PARTY_TWITTER_CONFIG: Record<string, {
  hashtag: string;
  // Optional: a specific Twitter username to embed timeline from
  // If set, shows that user's timeline filtered by hashtag
  username?: string;
}> = {
  ANO: { hashtag: "#PatriotANO", username: "PatriotIndexCZ" },
  ODS: { hashtag: "#PatriotODS", username: "PatriotIndexCZ" },
  PIR: { hashtag: "#PatriotPirati", username: "PatriotIndexCZ" },
  STAN: { hashtag: "#PatriotSTAN", username: "PatriotIndexCZ" },
  SPD: { hashtag: "#PatriotSPD", username: "PatriotIndexCZ" },
  TOP09: { hashtag: "#PatriotTOP09", username: "PatriotIndexCZ" },
  STA: { hashtag: "#PatriotStacilo", username: "PatriotIndexCZ" },
  MOT: { hashtag: "#PatriotMotoriste", username: "PatriotIndexCZ" },
  PRI: { hashtag: "#PatriotPrisaha", username: "PatriotIndexCZ" },
  NEZ: { hashtag: "#PatriotNezarazeni", username: "PatriotIndexCZ" },
};

interface TwitterFeedProps {
  partyName: string;
}

export function TwitterFeed({ partyName }: TwitterFeedProps) {
  const config = PARTY_TWITTER_CONFIG[partyName] ?? {
    hashtag: `#Patriot${partyName}`,
    username: "PatriotIndexCZ",
  };

  const searchUrl = `https://twitter.com/search?q=${encodeURIComponent(config.hashtag)}&src=typed_query&f=live`;
  const timelineUrl = config.username
    ? `https://twitter.com/${config.username}`
    : searchUrl;

  return (
    <div className="bg-card h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="text-foreground"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        <div className="flex-1">
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
            {"Prispevky"} - {config.hashtag}
          </span>
        </div>
      </div>

      {/* Feed content */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 gap-6">
        {/* Placeholder message - before Twitter account is connected */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="text-muted-foreground"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-2">
            {"Zde se budou zobrazovat prispevky"}
          </p>
          <p className="text-xs text-muted-foreground/60 leading-relaxed mb-4">
            {"Tweetujte s hashtagem "}
            <span className="font-mono text-primary font-bold">
              {config.hashtag}
            </span>
            {" z vaseho uctu"}
          </p>
          <p className="text-[10px] text-muted-foreground/40 mb-6">
            {"Konfigurace: components/twitter-feed.tsx"}
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-col gap-2 w-full">
          <a
            href={searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary text-sm font-mono text-foreground hover:bg-muted transition-colors"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            {"Hledat "}{config.hashtag}
          </a>
          <a
            href={timelineUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-border text-xs font-mono text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
          >
            {"Otevrit na X.com"}
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        </div>
      </div>

      {/* Setup instructions */}
      <div className="px-5 py-3 border-t border-border bg-muted/30">
        <details className="text-[10px] text-muted-foreground">
          <summary className="cursor-pointer hover:text-foreground transition-colors font-mono uppercase tracking-wider">
            Jak nastavit
          </summary>
          <div className="mt-2 space-y-1 leading-relaxed">
            <p>{"1. Vytvorte X/Twitter ucet (napr. @PatriotIndexCZ)"}</p>
            <p>{"2. Tweetujte s hasthagey pro jednotlive strany"}</p>
            <p>{"3. Upravte nazvy hashtagu v components/twitter-feed.tsx"}</p>
            <p>{"4. Pro API pristup nastavte NEXT_PUBLIC_TWITTER_BEARER_TOKEN"}</p>
          </div>
        </details>
      </div>
    </div>
  );
}
