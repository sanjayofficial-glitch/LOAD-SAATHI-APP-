
import { useState } from 'react';
import { Star, ThumbsUp, MessageSquare, User, Clock, Filter, ChevronDown } from 'lucide-react';
import SeoMeta from "@/components/SeoMeta";

interface Review {
  id: number;
  reviewer: string;
  role: 'Shipper' | 'Trucker';
  avatar: string;
  rating: number;
  comment: string;
  date: string;
  likes: number;
  tripInfo: string;
}

const reviews: Review[] = [
  { id: 1, reviewer: 'Rajesh Kumar', role: 'Trucker', avatar: 'RK', rating: 5, comment: 'Excellent shipper! Loading was smooth, payment released immediately after delivery. Highly recommended for FTL loads.', date: '2 days ago', likes: 12, tripInfo: 'Mumbai → Delhi · FTL · 18T' },
  { id: 2, reviewer: 'Suresh Patel', role: 'Trucker', avatar: 'SP', rating: 5, comment: 'Very professional handling. Clear communication about pickup time and location. Will definitely work with again.', date: '5 days ago', likes: 8, tripInfo: 'Bangalore → Hyderabad · PTL · 12T' },
  { id: 3, reviewer: 'Amit Singh', role: 'Trucker', avatar: 'AS', rating: 4, comment: 'Good experience overall. Payment was on time. Only minor delay at the loading bay.', date: '1 week ago', likes: 5, tripInfo: 'Chennai → Kolkata · FTL · 22T' },
  { id: 4, reviewer: 'Priya Sharma', role: 'Shipper', avatar: 'PS', rating: 5, comment: 'Rajesh is the most reliable trucker on this platform. On-time delivery, careful with cargo, great communication throughout.', date: '3 days ago', likes: 15, tripInfo: 'Delhi → Mumbai · FTL · 16T' },
  { id: 5, reviewer: 'Vikram Joshi', role: 'Shipper', avatar: 'VJ', rating: 4, comment: 'Good trucker, delivered on time. Cargo was in excellent condition. Would recommend.', date: '6 days ago', likes: 3, tripInfo: 'Pune → Ahmedabad · LTL · 9T' },
  { id: 6, reviewer: 'Deepak Verma', role: 'Trucker', avatar: 'DV', rating: 3, comment: 'Average experience. Loading took longer than expected. Payment was processed but had to follow up.', date: '2 weeks ago', likes: 2, tripInfo: 'Delhi → Jaipur · FTL · 15T' },
  { id: 7, reviewer: 'Ananya Gupta', role: 'Shipper', avatar: 'AG', rating: 5, comment: 'Excellent service! Truck arrived early, driver was very helpful with loading. Will book again.', date: '4 days ago', likes: 10, tripInfo: 'Hyderabad → Bangalore · LTL · 8T' },
  { id: 8, reviewer: 'Manoj Tiwari', role: 'Trucker', avatar: 'MT', rating: 4, comment: 'Good shipper, clear instructions. Slight delay in documentation but overall smooth.', date: '1 week ago', likes: 4, tripInfo: 'Bangalore → Chennai · FTL · 10T' },
];

const ratingBuckets = [
  { stars: 5, count: 4, percentage: 50 },
  { stars: 4, count: 3, percentage: 37.5 },
  { stars: 3, count: 1, percentage: 12.5 },
  { stars: 2, count: 0, percentage: 0 },
  { stars: 1, count: 0, percentage: 0 },
];

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const cls = size === 'md' ? 'h-5 w-5' : 'h-3.5 w-3.5';
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${cls} ${
            star <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/30'
          }`}
        />
      ))}
    </div>
  );
}

export default function ReviewsPreview() {
  const [roleFilter, setRoleFilter] = useState<'all' | 'Shipper' | 'Trucker'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'highest' | 'lowest'>('recent');

  const filtered = reviews
    .filter(r => roleFilter === 'all' || r.role === roleFilter)
    .sort((a, b) => {
      if (sortBy === 'recent') return 0;
      if (sortBy === 'highest') return b.rating - a.rating;
      return a.rating - b.rating;
    });

  const avgRating = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);

  return (
    <>
      <SeoMeta title="Reviews Preview — LoadSaathi App Screens" description="Preview LoadSaathi's bidirectional review system: shippers rate truckers and truckers rate shippers for complete transparency." canonical="/screens/reviews" />
      <div className="min-h-screen bg-background">
        <div className="relative overflow-hidden border-b border-border bg-gradient-to-b from-yellow-500/5 via-transparent to-transparent">
          <div className="absolute top-0 left-1/2 w-[600px] h-[600px] rounded-full opacity-[0.06] pointer-events-none"
            style={{ background: 'radial-gradient(circle, #eab308 0%, transparent 70%)', filter: 'blur(60px)' }} />
          <div className="max-w-[1440px] mx-auto px-6 sm:px-12 py-16 sm:py-20 relative z-10">
            <h1 className="text-4xl sm:text-5xl font-black text-foreground mb-4">App Preview: Reviews</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Transparent, bidirectional review system — shippers rate truckers and truckers rate shippers.
          </p>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 sm:px-12 py-12">
        <div className="glass-card rounded-xl border-border overflow-hidden shadow-2xl">
          <div className="h-11 border-b border-border bg-card/80 flex items-center px-5 gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse" />
            <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">REVIEW_SYSTEM</span>
            <div className="flex-grow" />
            <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
          </div>

          <div className="p-6 bg-background/50 dark:bg-[#050816]/50">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Overall Rating Sidebar */}
              <div className="lg:col-span-1">
                <div className="glass-card p-5 rounded-xl border-border text-center">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3">Overall Rating</div>
                  <div className="text-5xl font-black text-foreground mb-1">{avgRating}</div>
                  <div className="flex justify-center mb-3">
                    <StarRating rating={Math.round(parseFloat(avgRating))} size="md" />
                  </div>
                  <div className="text-xs text-muted-foreground mb-5">{reviews.length} reviews</div>

                  <div className="space-y-2 mb-6">
                    {ratingBuckets.map((bucket) => (
                      <div key={bucket.stars} className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground w-4">{bucket.stars}</span>
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        <div className="flex-grow h-1.5 bg-border rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-500 rounded-full transition-all"
                            style={{ width: `${bucket.percentage}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground w-6 text-right">{bucket.count}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-border pt-4">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-muted-foreground">Shippers Reviewed</span>
                      <span className="font-bold text-foreground">3</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Truckers Reviewed</span>
                      <span className="font-bold text-foreground">5</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reviews List */}
              <div className="lg:col-span-3">
                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 mb-5">
                  <div className="flex gap-1 bg-muted/50 rounded-lg p-0.5">
                    {(['all', 'Shipper', 'Trucker'] as const).map((role) => (
                      <button
                        key={role}
                        onClick={() => setRoleFilter(role)}
                        className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${
                          roleFilter === role
                            ? 'bg-yellow-500/20 text-yellow-500'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {role === 'all' ? 'All Reviews' : role}
                      </button>
                    ))}
                  </div>
                  <div className="flex-grow" />
                  <div className="relative">
                    <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                    <select
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value as 'recent' | 'highest' | 'lowest')}
                      className="pl-8 pr-6 py-1.5 bg-card border border-border rounded-lg text-xs text-foreground appearance-none focus:outline-none focus:border-yellow-500/50"
                    >
                      <option value="recent">Most Recent</option>
                      <option value="highest">Highest Rated</option>
                      <option value="lowest">Lowest Rated</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                {/* Review Cards */}
                <div className="space-y-4">
                  {filtered.map((review) => (
                    <div key={review.id} className="glass-card p-5 rounded-xl border-border hover:border-yellow-500/20 transition-all">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                          {review.avatar}
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                            <div>
                              <span className="text-sm font-bold text-foreground">{review.reviewer}</span>
                              <span className={`ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                review.role === 'Shipper'
                                  ? 'bg-blue-500/10 text-blue-400'
                                  : 'bg-orange-500/10 text-orange-400'
                              }`}>
                                {review.role}
                              </span>
                            </div>
                            <StarRating rating={review.rating} />
                          </div>
                          <p className="text-sm text-foreground/80 mb-3 leading-relaxed">{review.comment}</p>
                          <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {review.tripInfo}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {review.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <ThumbsUp className="h-3 w-3" />
                              {review.likes}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
