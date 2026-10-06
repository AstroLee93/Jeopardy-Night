/**
 * ==============================================================================
 * Wikidata Structured-Data Image Pipeline
 * ==============================================================================
 * 3-Step Production Pipeline for 10/10 Accurate Canonical Images:
 *
 * Step 1 – Resolve topic string to Wikidata Entity ID (Q-ID) via Action API (wbsearchentities)
 * Step 2 – Fetch canonical image claim (P18 primary image, or P154 official logo fallback)
 * Step 3 – Construct clean, high-resolution Wikimedia Commons FilePath URL
 *
 * Features:
 * - 100% structured data (zero HTML scraping)
 * - In-memory caching for Q-ID -> filename and Topic -> Q-ID mapping
 * - Proper URL encoding of Wikimedia filenames
 * - Graceful null handling when no image claim exists
 * ==============================================================================
 */

export interface WikidataEntity {
  id: string;
  label?: string;
  description?: string;
}

export interface WikidataImageClaim {
  filename: string;
  property: 'P18' | 'P154';
}

export interface WikidataImageResult {
  url: string;
  filename: string;
  entityId: string;
  entityLabel?: string;
  entityDescription?: string;
  property: 'P18' | 'P154';
  source: 'Wikidata';
}

interface WbSearchEntitiesResponse {
  search?: Array<{
    id: string;
    label?: string;
    description?: string;
    match?: {
      type?: string;
      text?: string;
    };
  }>;
  success?: number;
}

interface WbGetClaimsResponse {
  claims?: {
    P18?: Array<{
      mainsnak?: {
        snaktype?: string;
        datavalue?: {
          value?: string;
          type?: string;
        };
      };
    }>;
    P154?: Array<{
      mainsnak?: {
        snaktype?: string;
        datavalue?: {
          value?: string;
          type?: string;
        };
      };
    }>;
  };
}

export interface ImageLookupOptions {
  width?: number;
  allowLogos?: boolean;
}

export class WikidataImageService {
  // Cache topic string -> WikidataImageResult (or null if not found)
  private topicCache = new Map<string, WikidataImageResult | null>();

  // Cache Q-ID -> { filename, property } (or null if no image claim)
  private entityClaimCache = new Map<string, WikidataImageClaim | null>();

  // Cache topic string -> WikidataEntity
  private entitySearchCache = new Map<string, WikidataEntity | null>();

  private readonly userAgent: string;
  private readonly defaultWidth: number;
  private readonly timeoutMs: number;

  constructor(options?: { userAgent?: string; defaultWidth?: number; timeoutMs?: number }) {
    this.userAgent =
      options?.userAgent ||
      'FamilyJeopardyApp/2.0 (alexcauthen93@gmail.com; Jeopardy Trivia Game; https://aistudio.google.com)';
    this.defaultWidth = options?.defaultWidth || 800;
    this.timeoutMs = options?.timeoutMs || 4000;
  }

  /**
   * Helper to normalize search queries (strip surrounding quotes, collapse whitespace)
   */
  private normalizeTopic(rawTopic: string): string {
    return rawTopic
      .trim()
      .replace(/^["'`]|["'`]$/g, '')
      .replace(/\s+/g, ' ');
  }

  /**
   * Step 1 – Resolve any topic string to a Wikidata Entity ID (Q-ID)
   * GET https://www.wikidata.org/w/api.php?action=wbsearchentities&search={user_topic}&language=en&format=json&limit=1
   */
  public async resolveEntityId(topic: string): Promise<WikidataEntity | null> {
    const cleanTopic = this.normalizeTopic(topic);
    if (!cleanTopic) return null;

    const cacheKey = cleanTopic.toLowerCase();
    if (this.entitySearchCache.has(cacheKey)) {
      return this.entitySearchCache.get(cacheKey) || null;
    }

    try {
      const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(
        cleanTopic
      )}&language=en&format=json&limit=3`;

      const res = await fetch(url, {
        headers: { 'User-Agent': this.userAgent },
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      if (!res.ok) {
        console.warn(`[Wikidata] wbsearchentities HTTP ${res.status} for "${cleanTopic}"`);
        this.entitySearchCache.set(cacheKey, null);
        return null;
      }

      const data = (await res.json()) as WbSearchEntitiesResponse;
      const searchResults = data?.search;

      if (!searchResults || searchResults.length === 0) {
        this.entitySearchCache.set(cacheKey, null);
        return null;
      }

      // Check if an exact label match exists among top candidates; otherwise take top result
      const exactMatch = searchResults.find(
        (item) => item.label?.toLowerCase() === cleanTopic.toLowerCase()
      );
      const chosen = exactMatch || searchResults[0];

      if (!chosen?.id) {
        this.entitySearchCache.set(cacheKey, null);
        return null;
      }

      const entity: WikidataEntity = {
        id: chosen.id,
        label: chosen.label,
        description: chosen.description,
      };

      this.entitySearchCache.set(cacheKey, entity);
      return entity;
    } catch (err) {
      console.warn(`[Wikidata] Error resolving entity for "${cleanTopic}":`, (err as Error)?.message || err);
      return null;
    }
  }

  /**
   * Step 2 – Fetch canonical image claim
   * GET https://www.wikidata.org/w/api.php?action=wbgetclaims&entity={Q-ID}&property=P18
   *
   * Rules for fair Jeopardy trivia gameplay:
   * - By default, allowLogos is FALSE. Logos (P154) and title graphics spell out the answer
   *   in plaintext, ruining game fairness.
   * - When allowLogos is false, P18 images that appear to be wordmark logos, title cards, or covers
   *   are rejected to protect gameplay integrity.
   */
  public async fetchImageClaim(entityId: string, options?: ImageLookupOptions): Promise<WikidataImageClaim | null> {
    if (!entityId || !entityId.startsWith('Q')) return null;

    const allowLogos = options?.allowLogos === true;
    const cacheKey = `${entityId}__logos_${allowLogos}`;

    if (this.entityClaimCache.has(cacheKey)) {
      return this.entityClaimCache.get(cacheKey) || null;
    }

    try {
      // 1. Check primary image (P18)
      const p18Url = `https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=${encodeURIComponent(
        entityId
      )}&property=P18&format=json`;

      const p18Res = await fetch(p18Url, {
        headers: { 'User-Agent': this.userAgent },
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      if (p18Res.ok) {
        const p18Data = (await p18Res.json()) as WbGetClaimsResponse;
        const p18Value = p18Data?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;

        if (p18Value && typeof p18Value === 'string') {
          const isSpoilerGraphic = !allowLogos && /(logo|wordmark|title_screen|title_card|title\.png|title\.jpg|title\.svg|dvd_cover|poster|cover\.jpg)/i.test(p18Value);
          if (!isSpoilerGraphic) {
            const claim: WikidataImageClaim = {
              filename: p18Value.trim(),
              property: 'P18',
            };
            this.entityClaimCache.set(cacheKey, claim);
            return claim;
          }
        }
      }

      // 2. Only fall back to official logo (P154) if explicitly allowed (logos spell out names in text)
      if (allowLogos) {
        const p154Url = `https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=${encodeURIComponent(
          entityId
        )}&property=P154&format=json`;

        const p154Res = await fetch(p154Url, {
          headers: { 'User-Agent': this.userAgent },
          signal: AbortSignal.timeout(this.timeoutMs),
        });

        if (p154Res.ok) {
          const p154Data = (await p154Res.json()) as WbGetClaimsResponse;
          const p154Value = p154Data?.claims?.P154?.[0]?.mainsnak?.datavalue?.value;

          if (p154Value && typeof p154Value === 'string') {
            const claim: WikidataImageClaim = {
              filename: p154Value.trim(),
              property: 'P154',
            };
            this.entityClaimCache.set(cacheKey, claim);
            return claim;
          }
        }
      }

      // No non-spoiling claim found
      this.entityClaimCache.set(cacheKey, null);
      return null;
    } catch (err) {
      console.warn(`[Wikidata] Error fetching claims for ${entityId}:`, (err as Error)?.message || err);
      return null;
    }
  }

  /**
   * Step 3 – Construct the clean high-resolution image URL
   * https://commons.wikimedia.org/wiki/Special:FilePath/{filename}?width={desired_width}
   */
  public getCanonicalImageUrl(filename: string, width: number = this.defaultWidth): string {
    // Replace any leading 'File:' namespace prefix if present
    const cleanFilename = filename.replace(/^File:/i, '').trim();
    // Encode filename with standard encodeURIComponent
    const encoded = encodeURIComponent(cleanFilename);
    return `https://commons.wikimedia.org/wiki/Special:FilePath/${encoded}?width=${width}`;
  }

  /**
   * Full 3-Step Pipeline:
   * Topic string -> Q-ID -> Canonical Claim (P18 / P154) -> Special:FilePath URL
   */
  public async getImageForTopic(
    topic: string,
    optionsOrWidth?: number | ImageLookupOptions
  ): Promise<WikidataImageResult | null> {
    const cleanTopic = this.normalizeTopic(topic);
    if (!cleanTopic) return null;

    const width = typeof optionsOrWidth === 'number' ? optionsOrWidth : optionsOrWidth?.width || this.defaultWidth;
    const allowLogos = typeof optionsOrWidth === 'object' ? optionsOrWidth.allowLogos === true : false;

    const cacheKey = `${cleanTopic.toLowerCase()}__${width}__logos_${allowLogos}`;
    if (this.topicCache.has(cacheKey)) {
      return this.topicCache.get(cacheKey) || null;
    }

    // Step 1: Resolve topic to Q-ID
    const entity = await this.resolveEntityId(cleanTopic);
    if (!entity?.id) {
      this.topicCache.set(cacheKey, null);
      return null;
    }

    // Step 2: Fetch image claim (filtered against spoiler logos)
    const claim = await this.fetchImageClaim(entity.id, { allowLogos });
    if (!claim?.filename) {
      this.topicCache.set(cacheKey, null);
      return null;
    }

    // Step 3: Construct canonical Special:FilePath URL
    const url = this.getCanonicalImageUrl(claim.filename, width);

    const result: WikidataImageResult = {
      url,
      filename: claim.filename,
      entityId: entity.id,
      entityLabel: entity.label,
      entityDescription: entity.description,
      property: claim.property,
      source: 'Wikidata',
    };

    this.topicCache.set(cacheKey, result);
    return result;
  }

  /**
   * Clear all caches (useful for testing or memory release)
   */
  public clearCache(): void {
    this.topicCache.clear();
    this.entityClaimCache.clear();
    this.entitySearchCache.clear();
  }
}

// Export singleton instance
export const wikidataImageService = new WikidataImageService();
