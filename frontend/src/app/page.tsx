'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Calendar,
  MapPin,
  Search,
  Ticket,
  ShieldCheck,
  Zap,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
  TrendingUp,
  ArrowRight,
  Flame,
  Tag
} from 'lucide-react';
import { EventSummary, FilterMetadata } from '@/lib/types';
import { api } from '@/lib/api';
import EventCard from '@/components/EventCard';
import { useI18n } from '@/lib/i18n';

export default function HomePage() {
  const { t, language } = useI18n();

  const [events, setEvents] = useState<EventSummary[]>([]);
  const [featuredEvents, setFeaturedEvents] = useState<EventSummary[]>([]);
  const [filterMeta, setFilterMeta] = useState<FilterMetadata | null>(null);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('ALL');
  const [priceRange, setPriceRange] = useState<'ALL' | 'UNDER_500' | '500_2000' | 'ABOVE_2000'>('ALL');
  const [sortBy, setSortBy] = useState<'START_TIME_ASC' | 'PRICE_LOW_HIGH' | 'PRICE_HIGH_LOW' | 'FEATURED_FIRST'>('START_TIME_ASC');
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);

  // Hero Spotlight Carousel State
  const [activeSpotlightIdx, setActiveSpotlightIdx] = useState(0);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [allEvents, featEvents, meta] = await Promise.all([
          api.getEvents().catch(() => []),
          api.getFeaturedEvents().catch(() => []),
          api.getFilterMetadata().catch(() => null),
        ]);

        setEvents(allEvents);
        setFeaturedEvents(featEvents.length > 0 ? featEvents : allEvents.slice(0, 3));
        setFilterMeta(meta);
      } catch (e) {
        console.warn('Backend API connection fallback, using local seed mock:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Spotlight carousel automatic rotation
  useEffect(() => {
    if (featuredEvents.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSpotlightIdx((prev) => (prev + 1) % featuredEvents.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [featuredEvents.length]);

  // Dynamic filter application
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      // 1. Text Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesText =
          e.title.toLowerCase().includes(q) ||
          e.venueName.toLowerCase().includes(q) ||
          e.venueAddress.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          (e.tags && e.tags.some((tag) => tag.toLowerCase().includes(q)));
        if (!matchesText) return false;
      }

      // 2. Category Filter
      if (selectedCategory !== 'ALL') {
        if (e.category && e.category.toUpperCase() !== selectedCategory.toUpperCase()) {
          return false;
        }
      }

      // 3. Neighborhood Filter
      if (selectedNeighborhood !== 'ALL') {
        if (e.neighborhood && !e.neighborhood.toUpperCase().includes(selectedNeighborhood.toUpperCase())) {
          return false;
        }
      }

      // 4. Price Filter
      if (priceRange === 'UNDER_500' && e.minPrice > 500) return false;
      if (priceRange === '500_2000' && (e.minPrice < 500 || e.minPrice > 2000)) return false;
      if (priceRange === 'ABOVE_2000' && e.minPrice < 2000) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'PRICE_LOW_HIGH') return a.minPrice - b.minPrice;
      if (sortBy === 'PRICE_HIGH_LOW') return b.minPrice - a.minPrice;
      if (sortBy === 'FEATURED_FIRST') return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      return 0; // default START_TIME_ASC preserved from backend
    });
  }, [events, searchQuery, selectedCategory, selectedNeighborhood, priceRange, sortBy]);

  const activeFiltersCount =
    (selectedCategory !== 'ALL' ? 1 : 0) +
    (selectedNeighborhood !== 'ALL' ? 1 : 0) +
    (priceRange !== 'ALL' ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setSelectedNeighborhood('ALL');
    setPriceRange('ALL');
    setSortBy('START_TIME_ASC');
  };

  const currentSpotlight = featuredEvents[activeSpotlightIdx] || events[0];

  return (
    <div className="space-y-12 pb-24">
      {/* 1. Hero Spotlight Carousel Section */}
      <section className="relative overflow-hidden pt-8 pb-12 px-4 sm:px-6 lg:px-8 border-b border-white/10">
        {/* Background Radial Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-amber-500/15 via-emerald-500/10 to-sky-500/15 blur-3xl pointer-events-none rounded-full" />

        <div className="relative mx-auto max-w-6xl space-y-8">
          {/* Header Title & Tag */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-800/80 border border-amber-500/30 px-4 py-1.5 text-xs font-semibold text-amber-300 backdrop-blur-md shadow-glowGold/20 animate-fadeIn">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>
                {language === 'am'
                  ? 'የአዲስ አበባ ፈጣን የኢ-ቲኬት ስርዓት • ቴሌብር & ቻፓ'
                  : 'Addis Ababa’s Premier Event & Ticketing Platform'}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.15]">
              {t.heroTitle} <br />
              <span className="bg-gradient-to-r from-amber-400 via-amber-200 to-yellow-400 bg-clip-text text-transparent font-ethiopic">
                {t.heroHighlight}
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              {t.heroSubtitle}
            </p>
          </div>

          {/* Featured Spotlight Card */}
          {currentSpotlight && (
            <div className="relative rounded-3xl border border-amber-500/30 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 p-6 sm:p-8 shadow-2xl shadow-amber-500/10 overflow-hidden">
              <div className="absolute top-0 right-0 h-full w-1/2 opacity-20 pointer-events-none hidden md:block">
                <img
                  src={currentSpotlight.bannerImageUrl}
                  alt={currentSpotlight.title}
                  className="h-full w-full object-cover mask-gradient-left"
                />
              </div>

              <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* Spotlight Image Thumbnail (Mobile) */}
                <div className="md:hidden h-48 w-full rounded-2xl overflow-hidden border border-white/10">
                  <img
                    src={currentSpotlight.bannerImageUrl}
                    alt={currentSpotlight.title}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="md:col-span-8 space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 bg-amber-500 text-black text-[11px] font-black uppercase px-2.5 py-1 rounded-full shadow-glowGold">
                      <Flame className="h-3.5 w-3.5 text-black" />
                      {language === 'am' ? 'ተወዳጅ መድረክ' : 'Featured Spotlight'}
                    </span>
                    {currentSpotlight.category && (
                      <span className="text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                        {currentSpotlight.categoryEmoji || '🎟️'} {language === 'am' && currentSpotlight.categoryAmharic ? currentSpotlight.categoryAmharic : currentSpotlight.category}
                      </span>
                    )}
                    {currentSpotlight.neighborhood && (
                      <span className="text-xs font-semibold text-slate-300 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-amber-400" />
                        {language === 'am' && currentSpotlight.neighborhoodAmharic ? currentSpotlight.neighborhoodAmharic : currentSpotlight.neighborhood}
                      </span>
                    )}
                  </div>

                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">
                    {currentSpotlight.title}
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 max-w-2xl leading-relaxed">
                    {currentSpotlight.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
                    <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-xl border border-white/10">
                      <Calendar className="h-4 w-4 text-amber-400" />
                      <span className="font-bold text-amber-300">{currentSpotlight.startTime.ethiopianDateFormatted}</span>
                      <span className="text-slate-400">({currentSpotlight.startTime.ethiopianTimeFormatted})</span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-xl border border-white/10">
                      <MapPin className="h-4 w-4 text-amber-400" />
                      <span>{currentSpotlight.venueName}</span>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-4 flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between gap-4">
                  <div className="text-left md:text-right">
                    <span className="text-[11px] uppercase font-bold text-slate-400 block">
                      {t.fromPrice}
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-amber-400">
                      {currentSpotlight.minPrice > 0 ? (
                        <>
                          {currentSpotlight.minPrice.toLocaleString()} <span className="text-sm font-normal text-slate-400">ETB</span>
                        </>
                      ) : (
                        <span className="text-emerald-400">Free Admission</span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Link
                      href={`/events/${currentSpotlight.slug}`}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 px-6 py-3.5 text-sm font-black text-black shadow-glowGold hover:from-amber-300 hover:to-yellow-300 transition"
                    >
                      <span>{t.getTickets}</span>
                      <ArrowRight className="h-4 w-4 text-black" />
                    </Link>

                    {featuredEvents.length > 1 && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setActiveSpotlightIdx((prev) => (prev - 1 + featuredEvents.length) % featuredEvents.length)}
                          className="h-10 w-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center border border-slate-700 transition"
                          title="Previous featured"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setActiveSpotlightIdx((prev) => (prev + 1) % featuredEvents.length)}
                          className="h-10 w-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center border border-slate-700 transition"
                          title="Next featured"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Carousel Indicator Dots */}
              {featuredEvents.length > 1 && (
                <div className="flex items-center justify-center gap-1.5 pt-4">
                  {featuredEvents.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveSpotlightIdx(idx)}
                      className={`h-1.5 rounded-full transition-all ${
                        idx === activeSpotlightIdx ? 'w-6 bg-amber-400' : 'w-2 bg-slate-700 hover:bg-slate-600'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Search Bar & Filter Trigger */}
          <div className="mx-auto max-w-2xl">
            <div className="relative flex items-center">
              <Search className="absolute left-4 h-5 w-5 text-amber-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'am' ? 'በስም፣ በቦታ፣ በአዘጋጅ ወይም በታግ ይፈልጉ (ለምሳሌ ሮፍናን፣ ሚሌኒየም...)' : 'Search by artist, venue, tags (e.g. Rophnan, Millennium, Jazz, AI)...'}
                className="w-full rounded-2xl bg-slate-900/90 border border-white/15 pl-12 pr-24 py-4 text-white text-sm sm:text-base focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 shadow-2xl transition placeholder:text-slate-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-12 text-slate-400 hover:text-white p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowFiltersDrawer(!showFiltersDrawer)}
                className={`absolute right-3 p-2 rounded-xl border transition ${
                  showFiltersDrawer || activeFiltersCount > 0
                    ? 'bg-amber-500 text-black border-amber-400 font-bold'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
                title="Toggle Filters"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Trust Value Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-medium text-slate-400">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              <span>{language === 'am' ? 'የ10 ደቂቃ ቲኬት መጠበቂያ' : '10-Minute Atomic Hold'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-sky-400" />
              <span>{language === 'am' ? 'የቴሌብር ቀጥታ ክፍያ' : '1-Tap Telebirr Payment'}</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>{language === 'am' ? 'ኦፍላይን የሚሰራ የበር መቆጣጠሪያ' : 'Offline Cryptographic Gates'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Interactive Discovery & Filter Hub */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Category Filter Pills (Horizontal Scroll) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-amber-400" />
              <span>{language === 'am' ? 'የመድረክ ዓይነቶች' : 'Explore by Category'}</span>
            </h3>

            {activeFiltersCount > 0 && (
              <button
                onClick={resetAllFilters}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 transition flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                <span>{language === 'am' ? 'ሁሉንም አጽዳ' : 'Reset Filters'} ({activeFiltersCount})</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {filterMeta?.categories ? (
              filterMeta.categories.map((cat) => {
                const isSelected = selectedCategory === cat.code;
                const label = language === 'am' ? cat.amharicName : cat.englishName;
                return (
                  <button
                    key={cat.code}
                    onClick={() => setSelectedCategory(cat.code)}
                    className={`flex-shrink-0 px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
                      isSelected
                        ? 'bg-amber-500 text-black shadow-glowGold'
                        : 'bg-slate-900 border border-white/10 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span>{cat.iconEmoji}</span>
                    <span>{label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-black/30 text-black font-extrabold' : 'bg-slate-800 text-slate-400'}`}>
                      {cat.eventCount}
                    </span>
                  </button>
                );
              })
            ) : (
              ['ALL', 'MUSIC_CONCERT', 'TECH_SUMMIT', 'CULTURE_FESTIVAL', 'SPORTS_FITNESS', 'COMEDY_THEATRE'].map((code) => (
                <button
                  key={code}
                  onClick={() => setSelectedCategory(code)}
                  className={`flex-shrink-0 px-4 py-2 rounded-2xl text-xs font-bold transition ${
                    selectedCategory === code
                      ? 'bg-amber-500 text-black shadow-glowGold'
                      : 'bg-slate-900 border border-white/10 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {code}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Neighborhood / Sub-city Pills (Addis Ababa Locations) */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-sky-400" />
            <span>{language === 'am' ? 'አካባቢዎች (አዲስ አበባ)' : 'Neighborhoods & Sub-Cities'}</span>
          </h3>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {filterMeta?.neighborhoods ? (
              filterMeta.neighborhoods.map((nh) => {
                const isSelected = selectedNeighborhood === nh.code;
                const label = language === 'am' ? nh.amharicName : nh.englishName;
                return (
                  <button
                    key={nh.code}
                    onClick={() => setSelectedNeighborhood(nh.code)}
                    className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-sky-500 text-white shadow-sm font-bold'
                        : 'bg-slate-900/60 border border-white/5 text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span>📍</span>
                    <span>{label}</span>
                    {nh.eventCount > 0 && (
                      <span className="text-[10px] text-slate-400">({nh.eventCount})</span>
                    )}
                  </button>
                );
              })
            ) : null}
          </div>
        </div>

        {/* Filters Drawer (Price Range & Sorting) */}
        {showFiltersDrawer && (
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-fadeIn">
            {/* Price Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                {language === 'am' ? 'የቲኬት ዋጋ ክልል' : 'Ticket Price Range'}
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => setPriceRange('ALL')}
                  className={`p-2 rounded-xl border text-center transition font-semibold ${
                    priceRange === 'ALL' ? 'bg-amber-500 text-black border-amber-400' : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  All Prices
                </button>
                <button
                  onClick={() => setPriceRange('UNDER_500')}
                  className={`p-2 rounded-xl border text-center transition font-semibold ${
                    priceRange === 'UNDER_500' ? 'bg-amber-500 text-black border-amber-400' : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  Under 500 ETB
                </button>
                <button
                  onClick={() => setPriceRange('500_2000')}
                  className={`p-2 rounded-xl border text-center transition font-semibold ${
                    priceRange === '500_2000' ? 'bg-amber-500 text-black border-amber-400' : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  500 - 2,000 ETB
                </button>
                <button
                  onClick={() => setPriceRange('ABOVE_2000')}
                  className={`p-2 rounded-xl border text-center transition font-semibold ${
                    priceRange === 'ABOVE_2000' ? 'bg-amber-500 text-black border-amber-400' : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  VIP (2,000+ ETB)
                </button>
              </div>
            </div>

            {/* Sorting */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                {language === 'am' ? 'ቅደም ተከተል' : 'Sort Events By'}
              </label>
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-semibold focus:outline-none focus:border-amber-400"
              >
                <option value="START_TIME_ASC">Date: Earliest First (በቀን ቅደም ተከተል)</option>
                <option value="PRICE_LOW_HIGH">Price: Low to High (ከዝቅተኛ ዋጋ)</option>
                <option value="PRICE_HIGH_LOW">Price: High to Low (ከከፍተኛ ዋጋ)</option>
                <option value="FEATURED_FIRST">Featured Spotlight First (ተወዳጆች በመጀመሪያ)</option>
              </select>
            </div>

            {/* Reset Actions */}
            <div className="flex flex-col justify-end space-y-2">
              <button
                type="button"
                onClick={resetAllFilters}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-700 transition"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        )}

        {/* Results Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-white/10">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 font-ethiopic">
              {language === 'am' ? 'የተገኙ መድረኮች' : 'Available Events in Addis Ababa'} 📅
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {language === 'am'
                ? 'በኢትዮጵያ ዘመን አቆጣጠር (12 የሰዓት ዑደት) እና በፈረንጆች ቀን'
                : 'Showing verified events with instant Telebirr & Chapa checkout'}
            </p>
          </div>

          <div className="text-xs text-slate-400 bg-slate-900 px-3.5 py-2 rounded-xl border border-white/10 self-start sm:self-auto font-medium flex items-center gap-2">
            <span>{language === 'am' ? 'የተገኙ መድረኮች:' : 'Showing'}</span>
            <strong className="text-amber-400 font-bold">{filteredEvents.length}</strong>
            <span>{language === 'am' ? 'መድረኮች' : 'events'}</span>
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-96 rounded-3xl bg-slate-900 border border-white/5" />
            ))}
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 rounded-3xl bg-slate-900/40 border border-white/5 space-y-4">
            <Ticket className="mx-auto h-12 w-12 text-slate-600" />
            <div className="space-y-1">
              <p className="text-base font-bold text-white">
                {language === 'am' ? 'ምንም መድረክ አልተገኘም' : 'No matching events found'}
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {language === 'am'
                  ? 'የተመረጡትን ማጣሪያዎች ወይም የፍለጋ ቃላት በመቀየር እንደገና ይሞክሩ'
                  : 'Try adjusting your category, neighborhood, or price filters'}
              </p>
            </div>
            <button
              onClick={resetAllFilters}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 text-xs font-bold transition shadow-glowGold"
            >
              <X className="h-3.5 w-3.5" />
              <span>{language === 'am' ? 'ማጣሪያዎችን አጽዳ' : 'Clear All Filters'}</span>
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
