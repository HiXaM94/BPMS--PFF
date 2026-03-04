/**
 * CacheService.js
 *
 * Client-side, Redis-compatible caching layer.
 * – In-memory Map with per-key TTL and auto-eviction.
 * – Real hit / miss counters so getStats() never fakes numbers.
 * – Channel-based invalidation (e.g. "users:*").
 * – getOrSet() pattern for wrapping any async fetcher.
 * – warmUp() pre-loads frequent queries after login.
 *
 * Usage in any component / service:
 *   import { cacheService } from '../services/CacheService';
 *   const data = await cacheService.getOrSet('hr:stats', fetchFn, 120);
 */

import { supabase } from './supabase';

/* ── Tiny event bus so other modules can listen to invalidations ── */
const bus = new EventTarget();

class CacheService {
  constructor() {
    this.store   = new Map();          // key → { value, expiresAt, timerId }
    this.hits    = 0;
    this.misses  = 0;
    this.defaultTTL = 300;             // 5 min
  }

  /* ─────────── Core CRUD ─────────── */

  set(key, value, ttlSeconds = this.defaultTTL) {
    // Clear any existing timer for this key
    const existing = this.store.get(key);
    if (existing?.timerId) clearTimeout(existing.timerId);

    const expiresAt = Date.now() + ttlSeconds * 1000;
    const timerId   = setTimeout(() => this.delete(key), ttlSeconds * 1000);

    this.store.set(key, { value, expiresAt, timerId });
    return true;
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) { this.misses++; return undefined; }

    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      this.misses++;
      return undefined;
    }

    this.hits++;
    return entry.value;
  }

  delete(key) {
    const entry = this.store.get(key);
    if (entry?.timerId) clearTimeout(entry.timerId);
    this.store.delete(key);
  }

  has(key) {
    const v = this.get(key);       // also validates TTL
    return v !== undefined;
  }

  clear() {
    for (const entry of this.store.values()) {
      if (entry.timerId) clearTimeout(entry.timerId);
    }
    this.store.clear();
    this.hits   = 0;
    this.misses = 0;
  }

  /* ─────────── High-level helpers ─────────── */

  /**
   * Read-through cache: returns cached value if present,
   * otherwise runs `fetchFn`, stores the result, and returns it.
   */
  async getOrSet(key, fetchFn, ttlSeconds = this.defaultTTL) {
    const cached = this.get(key);
    if (cached !== undefined) return cached;

    const fresh = await fetchFn();
    this.set(key, fresh, ttlSeconds);
    return fresh;
  }

  /** Alias – more readable when wrapping Supabase selects */
  cacheQuery(key, queryFn, ttl) {
    return this.getOrSet(key, queryFn, ttl);
  }

  /* ─────────── Pattern invalidation (Redis-like) ─────────── */

  /**
   * Delete every key that matches a regex pattern.
   * Example: invalidatePattern('^hr:') wipes all hr:* keys.
   */
  invalidatePattern(pattern) {
    const re  = new RegExp(pattern);
    let count = 0;
    for (const key of [...this.store.keys()]) {
      if (re.test(key)) { this.delete(key); count++; }
    }
    bus.dispatchEvent(new CustomEvent('invalidate', { detail: pattern }));
    return count;
  }

  /** Subscribe to invalidation events so a component can refetch */
  onInvalidate(handler) {
    const wrap = (e) => handler(e.detail);
    bus.addEventListener('invalidate', wrap);
    return () => bus.removeEventListener('invalidate', wrap);
  }

  /* ─────────── Stats ─────────── */

  getStats() {
    const total = this.hits + this.misses;
    return {
      entries : this.store.size,
      hits    : this.hits,
      misses  : this.misses,
      hitRate : total === 0 ? 0 : +(this.hits / total).toFixed(3),
    };
  }

  /* ─────────── Warm-up on login ─────────── */

  /**
   * Pre-populate frequently-used queries right after authentication.
   * Call this once from AuthContext after profile is fetched.
   */
  async warmUp(userId, entrepriseId) {
    if (!supabase || !userId) return;

    // These fire in parallel – each failure is independent
    const jobs = [];

    jobs.push(
      supabase.from('users').select('*').eq('id', userId).single()
        .then(({ data }) => { if (data) this.set(`user:${userId}`, data, 600); })
    );

    if (entrepriseId) {
      jobs.push(
        supabase.from('system_settings').select('*').eq('entreprise_id', entrepriseId)
          .then(({ data }) => { if (data) this.set(`settings:${entrepriseId}`, data, 300); })
      );
      jobs.push(
        supabase.from('users').select('id', { count: 'exact', head: true })
          .then(({ count }) => { if (count != null) this.set('users:count', count, 180); })
      );
      jobs.push(
        supabase.from('entreprises').select('id', { count: 'exact', head: true })
          .then(({ count }) => { if (count != null) this.set('entreprises:count', count, 180); })
      );
    }

    await Promise.allSettled(jobs);
  }
}

export const cacheService = new CacheService();
