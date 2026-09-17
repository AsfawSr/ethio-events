'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MapPin,
  Image as ImageIcon,
  DollarSign,
  Plus,
  Trash2,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Building2,
  Layers,
  Users,
  UploadCloud,
  Loader2,
  Check,
  FileImage,
  X
} from 'lucide-react';
import { api } from '@/lib/api';
import { authStorage } from '@/lib/auth';
import { CreateEventRequest, CreateTicketTypeRequest, OrganizerSession } from '@/lib/types';

const PRESET_BANNERS = [
  {
    label: 'Concert & Music',
    url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop',
  },
  {
    label: 'Tech Conference',
    url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200&auto=format&fit=crop',
  },
  {
    label: 'Cultural & Festive',
    url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1200&auto=format&fit=crop',
  },
  {
    label: 'Sports & Run',
    url: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?q=80&w=1200&auto=format&fit=crop',
  },
];

const PRESET_VENUES = [
  { name: 'Millennium Hall', address: 'Bole Sub-City, Next to Medhanialem Church, Addis Ababa' },
  { name: 'Ethiopian Skylight Hotel', address: 'Airport Road, Bole, Addis Ababa' },
  { name: 'UNECA Conference Center', address: 'Menelik II Avenue, Addis Ababa' },
  { name: 'Ghion Hotel Garden', address: 'Ras Desta Damtew St, Addis Ababa' },
  { name: 'Friendship Park', address: 'Opposite to Grand Palace, Arada Sub-City, Addis Ababa' },
  { name: 'Entoto Park Amphitheatre', address: 'Entoto Natural Park, Addis Ababa' },
];

export default function CreateEventPage() {
  const router = useRouter();

  const [organizerSession, setOrganizerSession] = useState<OrganizerSession | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [bannerImageUrl, setBannerImageUrl] = useState(PRESET_BANNERS[0].url);
  const [organizerName, setOrganizerName] = useState('Addis Events Group');
  const [category, setCategory] = useState('MUSIC_CONCERT');
  const [neighborhood, setNeighborhood] = useState('BOLE');
  const [tags, setTags] = useState('');
  const [featured, setFeatured] = useState(false);

  useEffect(() => {
    const session = authStorage.getSession();
    if (session) {
      setOrganizerSession(session);
      if (session.organizationName) {
        setOrganizerName(session.organizationName);
      } else if (session.fullName) {
        setOrganizerName(session.fullName);
      }
    }
  }, []);

  // Dates (datetime-local format: YYYY-MM-DDTHH:mm)
  const defaultStart = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
  const defaultEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString().slice(0, 16);
  const [startDateTime, setStartDateTime] = useState(defaultStart);
  const [endDateTime, setEndDateTime] = useState(defaultEnd);

  // Ticket Tiers
  const [ticketTypes, setTicketTypes] = useState<CreateTicketTypeRequest[]>([
    {
      name: 'Regular Entrance',
      description: 'Standard access to general standing & arena area',
      price: 400,
      totalCapacity: 500,
      maxPerUser: 5,
    },
    {
      name: 'VIP Lounge',
      description: 'VIP elevated viewing deck with complimentary drinks',
      price: 1500,
      totalCapacity: 100,
      maxPerUser: 4,
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successEventSlug, setSuccessEventSlug] = useState<string | null>(null);

  // Media Upload State
  const [imageMode, setImageMode] = useState<'upload' | 'preset' | 'url'>('upload');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPEG, PNG, WebP, GIF, SVG).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds maximum 10MB limit.');
      return;
    }

    setUploadLoading(true);
    setUploadError(null);
    try {
      const res = await api.uploadImage(file);
      setBannerImageUrl(res.fileUrl || res.url || '');
      setUploadedFileName(file.name);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload image. Please try again or use a direct URL.');
    } finally {
      setUploadLoading(false);
    }
  };

  // Add Ticket Tier
  const handleAddTier = () => {
    setTicketTypes([
      ...ticketTypes,
      {
        name: `Tier ${ticketTypes.length + 1}`,
        description: 'Access pass',
        price: 500,
        totalCapacity: 200,
        maxPerUser: 5,
      },
    ]);
  };

  // Remove Ticket Tier
  const handleRemoveTier = (index: number) => {
    if (ticketTypes.length <= 1) {
      alert('You must have at least one ticket tier.');
      return;
    }
    setTicketTypes(ticketTypes.filter((_, i) => i !== index));
  };

  // Update Ticket Tier
  const handleTierChange = (index: number, field: keyof CreateTicketTypeRequest, value: any) => {
    const updated = [...ticketTypes];
    updated[index] = {
      ...updated[index],
      [field]: field === 'price' || field === 'totalCapacity' || field === 'maxPerUser' ? Number(value) : value,
    };
    setTicketTypes(updated);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Please enter an event title');
      return;
    }
    if (!venueName.trim() || !venueAddress.trim()) {
      setError('Please provide a venue name and address');
      return;
    }
    if (new Date(startDateTime) >= new Date(endDateTime)) {
      setError('Event start date and time must be earlier than the end date and time');
      return;
    }
    if (ticketTypes.length === 0) {
      setError('At least one ticket tier is required');
      return;
    }

    try {
      setLoading(true);

      const payload: CreateEventRequest = {
        title: title.trim(),
        description: description.trim() || 'Join us for this special event in Addis Ababa!',
        venueName: venueName.trim(),
        venueAddress: venueAddress.trim(),
        startTimeIsoUtc: new Date(startDateTime).toISOString(),
        endTimeIsoUtc: new Date(endDateTime).toISOString(),
        bannerImageUrl: bannerImageUrl.trim(),
        organizerName: organizerName.trim() || 'Addis Events Organizer',
        organizerId: organizerSession?.organizerId,
        category,
        neighborhood,
        featured,
        tags: tags.trim(),
        ticketTypes: ticketTypes.map((t) => ({
          name: t.name.trim(),
          description: t.description.trim(),
          price: Number(t.price) || 0,
          totalCapacity: Number(t.totalCapacity) || 50,
          maxPerUser: Number(t.maxPerUser) || 5,
        })),
      };

      const created = await api.createEvent(payload);
      setSuccessEventSlug(created.slug);

      // Smooth auto redirect
      setTimeout(() => {
        router.push(`/events/${created.slug}`);
      }, 1500);
    } catch (err: any) {
      console.error('Failed to create event:', err);
      setError(err.message || 'Failed to create event. Please check your inputs and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-amber-400 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Events
          </Link>
          <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400 border border-amber-500/20">
            Event Registration Portal
          </span>
        </div>

        {/* Organizer Account Status Notice */}
        {organizerSession ? (
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs sm:text-sm text-emerald-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              <span>
                Publishing as verified organizer:{' '}
                <strong className="text-white">
                  {organizerSession.organizationName || organizerSession.fullName}
                </strong>
              </span>
            </div>
            <Link
              href="/organizer"
              className="font-semibold text-amber-400 hover:text-amber-300 underline underline-offset-2 ml-2"
            >
              Organizer Dashboard
            </Link>
          </div>
        ) : (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs sm:text-sm text-amber-200">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400 flex-shrink-0" />
              <span>
                Want to track ticket sales and receive Telebirr/Bank payouts?
              </span>
            </div>
            <Link
              href="/organizer"
              className="font-bold text-black bg-amber-400 hover:bg-amber-300 px-3.5 py-1.5 rounded-lg transition w-fit"
            >
              Log in / Create Organizer Account
            </Link>
          </div>
        )}

        {/* Header */}
        <div className="mb-8 border-b border-white/10 pb-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl flex items-center gap-3">
            Register New Event
            <span className="text-amber-400 text-lg font-bold font-ethiopic">አዲስ መድረክ</span>
          </h1>
          <p className="mt-2 text-base text-slate-400">
            Publish your concert, conference, or cultural gathering in Addis Ababa with instant Telebirr & Chapa ticketing.
          </p>
        </div>

        {/* Success Banner */}
        {successEventSlug && (
          <div className="mb-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center animate-in fade-in zoom-in duration-300">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400 mb-3" />
            <h3 className="text-xl font-bold text-white">Event Registered Successfully!</h3>
            <p className="mt-1 text-sm text-emerald-300">
              Redirecting you to the live event ticket page...
            </p>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="mb-8 flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-300">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-rose-400 mt-0.5" />
            <div className="text-sm">
              <span className="font-semibold">Registration Error: </span>
              {error}
            </div>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* SECTION 1: Event Basics */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-2.5 border-b border-white/10 pb-4">
              <Sparkles className="h-5 w-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white">1. Event Information</h2>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Event Title <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Addis Tech Summit 2026 or Teddy Afro Live Concert"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Event Description & Schedule
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what attendees can expect, guest artists/speakers, entry requirements..."
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition"
              />
            </div>

            {/* Organizer Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Organizer / Host Name
              </label>
              <input
                type="text"
                value={organizerName}
                onChange={(e) => setOrganizerName(e.target.value)}
                placeholder="e.g. Habesha Promotions, Awaqi, Tech Addis"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition"
              />
            </div>

            {/* Category & Neighborhood Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Event Category <span className="text-amber-400">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-white focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition"
                >
                  <option value="MUSIC_CONCERT">🎵 Concerts & Live Music (ኮንሰርት እና ሙዚቃ)</option>
                  <option value="TECH_SUMMIT">💻 Tech, AI & Startups (ቴክኖሎጂ እና AI)</option>
                  <option value="CULTURE_FESTIVAL">☕ Culture, Buna & Food (ባህል እና ቡና)</option>
                  <option value="COMEDY_THEATRE">🎭 Comedy, Theatre & Jazz (ኮሜዲ እና ቴአትር)</option>
                  <option value="SPORTS_FITNESS">🏃 Sports, 10K & Marathon (ስፖርት እና ማራቶን)</option>
                  <option value="NIGHTLIFE_PARTY">🌙 Nightlife & DJ Sets (የምሽት ፕሮግራም)</option>
                  <option value="ART_EXHIBITION">🎨 Art & Photography Expo (ኪነ-ጥበብ እና ኤግዚቢሽን)</option>
                  <option value="BUSINESS_EXPO">💼 Business & Trade Expo (የንግድ ትርዒት)</option>
                  <option value="OTHER">🎟️ Special Events (ልዩ ዝግጅት)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Neighborhood / Sub-City <span className="text-amber-400">*</span>
                </label>
                <select
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-white focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition"
                >
                  <option value="BOLE">📍 Bole (ቦሌ)</option>
                  <option value="KAZANCHIS">📍 Kazanchis (ካዛንቺስ)</option>
                  <option value="SARBET">📍 Sarbet / Old Airport (ሳርቤት)</option>
                  <option value="PIASSA">📍 Piassa / Arada (ፒያሳ)</option>
                  <option value="MESKEL_SQUARE">📍 Meskel Square (መስቀል አደባባይ)</option>
                  <option value="MEXICO">📍 Mexico / Stadium (ሜክሲኮ)</option>
                  <option value="ENTOTO">📍 Entoto Hills (እንጦጦ)</option>
                  <option value="CMC">📍 CMC / Ayat (ሲኤምሲ)</option>
                  <option value="GERJI">📍 Gerji / Imperial (ገርጂ)</option>
                  <option value="BISHOFTU">📍 Bishoftu / Kuriftu (ቢሾፍቱ)</option>
                  <option value="HAWASSA">📍 Hawassa Lake (ሐዋሳ)</option>
                  <option value="OTHER">📍 Other Locations (ሌሎች)</option>
                </select>
              </div>
            </div>

            {/* Tags Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Event Tags & Keywords <span className="text-xs font-normal text-slate-400">(comma separated)</span>
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. Jazz, LiveBand, Buna, VIP, Networking"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition"
              />
            </div>

            {/* Banner Image Selection & Uploader */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="block text-sm font-semibold text-slate-300">
                  Event Poster / Banner <span className="text-amber-400">*</span>
                </label>

                {/* Mode Selector Tabs */}
                <div className="flex items-center gap-1 rounded-xl bg-slate-800/80 p-1 border border-slate-700 text-xs">
                  <button
                    type="button"
                    onClick={() => setImageMode('upload')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition ${
                      imageMode === 'upload'
                        ? 'bg-amber-400 text-black font-semibold shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <UploadCloud className="h-3.5 w-3.5" />
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageMode('preset')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition ${
                      imageMode === 'preset'
                        ? 'bg-amber-400 text-black font-semibold shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                    Curated Themes
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageMode('url')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition ${
                      imageMode === 'url'
                        ? 'bg-amber-400 text-black font-semibold shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Direct URL
                  </button>
                </div>
              </div>

              {/* Upload Mode: Drag and Drop Zone */}
              {imageMode === 'upload' && (
                <div className="space-y-3">
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleFileUpload(e.dataTransfer.files[0]);
                      }
                    }}
                    className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
                      isDragging
                        ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
                        : 'border-slate-700 bg-slate-800/40 hover:border-slate-500 hover:bg-slate-800/60'
                    }`}
                  >
                    <input
                      type="file"
                      id="event-poster-input"
                      accept="image/png, image/jpeg, image/webp, image/gif, image/svg+xml"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />

                    {uploadLoading ? (
                      <div className="flex flex-col items-center py-4">
                        <Loader2 className="h-10 w-10 animate-spin text-amber-400 mb-2" />
                        <span className="text-sm font-semibold text-white">Uploading event banner...</span>
                        <span className="text-xs text-slate-400 mt-1">Processing image and generating CDN URL</span>
                      </div>
                    ) : (
                      <label
                        htmlFor="event-poster-input"
                        className="flex flex-col items-center cursor-pointer w-full"
                      >
                        <div className="mb-3 rounded-full bg-amber-500/10 p-3 text-amber-400 border border-amber-500/20 group-hover:scale-110 transition">
                          <UploadCloud className="h-6 w-6" />
                        </div>
                        <span className="text-sm font-semibold text-white">
                          Click to upload or drag & drop event poster
                        </span>
                        <span className="text-xs text-slate-400 mt-1">
                          PNG, JPG, WEBP, GIF, SVG (Up to 10MB)
                        </span>
                      </label>
                    )}
                  </div>

                  {uploadError && (
                    <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                      <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-400" />
                      <span>{uploadError}</span>
                    </div>
                  )}

                  {uploadedFileName && (
                    <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 px-3 text-xs text-emerald-300">
                      <div className="flex items-center gap-2 truncate">
                        <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                        <span className="truncate">Uploaded: <strong>{uploadedFileName}</strong></span>
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                        Ready
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Preset Gallery Mode */}
              {imageMode === 'preset' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {PRESET_BANNERS.map((banner, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setBannerImageUrl(banner.url)}
                      className={`group relative overflow-hidden rounded-xl border text-left text-xs transition p-2 flex flex-col items-center gap-1.5 ${
                        bannerImageUrl === banner.url
                          ? 'border-amber-400 bg-amber-500/20 text-amber-300 shadow-md shadow-amber-500/10'
                          : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      <img
                        src={banner.url}
                        alt={banner.label}
                        className="h-16 w-full object-cover rounded-lg group-hover:scale-105 transition duration-300"
                      />
                      <span className="truncate w-full text-center font-semibold mt-1">{banner.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Direct URL Mode */}
              {imageMode === 'url' && (
                <div>
                  <input
                    type="url"
                    required
                    value={bannerImageUrl}
                    onChange={(e) => setBannerImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition text-sm"
                  />
                </div>
              )}

              {/* Live Image Preview Banner */}
              {bannerImageUrl && (
                <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-800/40 p-2">
                  <div className="relative h-32 w-full rounded-lg overflow-hidden bg-slate-950">
                    <img
                      src={bannerImageUrl}
                      alt="Banner Preview"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                    <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-xs text-white">
                      <span className="font-semibold drop-shadow">Live Banner Preview</span>
                      <span className="rounded bg-black/60 backdrop-blur px-2 py-0.5 text-[10px] text-amber-300 border border-amber-400/30">
                        Public Display
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: Venue & Location */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-2.5 border-b border-white/10 pb-4">
              <MapPin className="h-5 w-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white">2. Venue & Location in Addis Ababa</h2>
            </div>

            {/* Quick Pick Venues */}
            <div>
              <span className="text-xs text-slate-400 block mb-2 font-medium">Quick Pick Addis Venues:</span>
              <div className="flex flex-wrap gap-2">
                {PRESET_VENUES.map((v, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => {
                      setVenueName(v.name);
                      setVenueAddress(v.address);
                    }}
                    className="text-xs font-medium bg-slate-800 hover:bg-amber-500/20 border border-slate-700 hover:border-amber-400/50 text-slate-300 hover:text-amber-300 px-3 py-1.5 rounded-lg transition"
                  >
                    📍 {v.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Venue Name <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  placeholder="e.g. Millennium Hall or Skylight Hotel"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Physical Address / Sub-City <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={venueAddress}
                  onChange={(e) => setVenueAddress(e.target.value)}
                  placeholder="e.g. Bole Sub-City, Addis Ababa"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: Date & Time Schedule */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-2.5 border-b border-white/10 pb-4">
              <Calendar className="h-5 w-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white">3. Date & Time (Localized)</h2>
            </div>

            <p className="text-xs text-slate-400">
              Times are automatically converted to Ethiopian Ge'ez calendar and traditional 12-hour Addis day cycles (ጠዋት/ከሰዓት/ምሽት) for attendees.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Event Starts (Date & Time) <span className="text-amber-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={startDateTime}
                  onChange={(e) => setStartDateTime(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-white focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Event Ends (Date & Time) <span className="text-amber-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={endDateTime}
                  onChange={(e) => setEndDateTime(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-white focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: Ticket Tiers & Capacity */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <Layers className="h-5 w-5 text-amber-400" />
                <h2 className="text-lg font-bold text-white">4. Ticket Tiers & Capacity</h2>
              </div>
              <button
                type="button"
                onClick={handleAddTier}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-3 py-1.5 rounded-lg transition"
              >
                <Plus className="h-4 w-4" />
                Add Tier
              </button>
            </div>

            <div className="space-y-4">
              {ticketTypes.map((tier, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-slate-700/80 bg-slate-800/50 p-4 transition hover:border-slate-600 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-amber-300 flex items-center gap-1.5">
                      Tier #{index + 1}
                    </span>
                    {ticketTypes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTier(index)}
                        className="text-slate-400 hover:text-rose-400 transition p-1"
                        title="Remove tier"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Tier Name (e.g. Regular, VIP, Table)
                      </label>
                      <input
                        type="text"
                        required
                        value={tier.name}
                        onChange={(e) => handleTierChange(index, 'name', e.target.value)}
                        placeholder="e.g. Early Bird Pass"
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Price (ETB) - Use 0 for Free
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="10"
                        required
                        value={tier.price}
                        onChange={(e) => handleTierChange(index, 'price', e.target.value)}
                        placeholder="500"
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Tier Description / Perks
                      </label>
                      <input
                        type="text"
                        value={tier.description}
                        onChange={(e) => handleTierChange(index, 'description', e.target.value)}
                        placeholder="e.g. Free welcome drink + front row access"
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Capacity (Tickets Available)
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={tier.totalCapacity}
                        onChange={(e) => handleTierChange(index, 'totalCapacity', e.target.value)}
                        placeholder="200"
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-4">
            <Link
              href="/"
              className="w-full sm:w-auto text-center px-6 py-3.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition font-medium text-sm"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={loading || !!successEventSlug}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 px-8 py-3.5 text-base font-bold text-black shadow-glowGold hover:from-amber-300 hover:to-yellow-300 active:scale-95 disabled:opacity-50 transition"
            >
              {loading ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
                  <span>Publishing Event...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 text-black" />
                  <span>Publish & Register Event</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
