import { createClient } from "@/lib/supabase/server";
import { Star, MessageSquare, ThumbsUp } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = { title: "SERVLO GROW — Google Reviews" };

const DEMO_REVIEWS = [
  { id: "d1", reviewer_name: "Sarah M", rating: 5, content: "Absolutely brilliant service. Arrived on time, finished early, cleaned up perfectly. Will definitely use again and would highly recommend to anyone!", platform: "google", review_date: "2026-05-01" },
  { id: "d2", reviewer_name: "James K", rating: 5, content: "Best tradie we've ever used. Quoted fairly, did exactly what was promised, and the quality of work is outstanding. Five stars without hesitation.", platform: "google", review_date: "2026-04-28" },
  { id: "d3", reviewer_name: "Linda T", rating: 4, content: "Very professional and tidy. Took a little longer than expected but the quality was great. Would use again.", platform: "facebook", review_date: "2026-04-20" },
  { id: "d4", reviewer_name: "Robert H", rating: 5, content: "Used for a large deck build. The team was incredible, great communication throughout, and the end result exceeded expectations. Highly recommended!", platform: "google", review_date: "2026-04-15" },
  { id: "d5", reviewer_name: "Patricia G", rating: 5, content: "Prompt, professional, and the price was fair. No surprises on the invoice. Exactly what you want from a trade business.", platform: "google", review_date: "2026-04-10" },
  { id: "d6", reviewer_name: "David W", rating: 3, content: "Work was done well but communication during the job could have been better. Had to chase for updates. End result was good.", platform: "facebook", review_date: "2026-04-05" },
  { id: "d7", reviewer_name: "Karen B", rating: 5, content: "Brilliant! Fixed an issue that two other tradies couldn't solve. Fast, efficient, and very reasonably priced. Saved the day!", platform: "google", review_date: "2026-03-28" },
  { id: "d8", reviewer_name: "Michael S", rating: 4, content: "Good quality work, turned up when they said they would. Minor cosmetic issue but they came back and fixed it straight away. Good attitude.", platform: "google", review_date: "2026-03-20" },
];

type Review = typeof DEMO_REVIEWS[number];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <Star key={s} size={14} fill={s <= rating ? "#F59E0B" : "none"} style={{ color: s <= rating ? "#F59E0B" : "#475569" }} />
      ))}
    </div>
  );
}

export default async function ReviewsPage() {
  let reviews: Review[] = DEMO_REVIEWS;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from("reviews").select("*").eq("owner_id", user.id).order("review_date", { ascending: false });
      if (data && data.length > 0) reviews = data as Review[];
    }
  } catch {}

  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const fiveStars = reviews.filter((r) => r.rating === 5).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Google Reviews</h1>
        <p className="text-slate-400 mt-1">Manage and respond to your business reviews</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
          <div className="text-3xl font-bold text-white">{avgRating.toFixed(1)}</div>
          <div className="mt-1 flex justify-center"><StarRating rating={Math.round(avgRating)} /></div>
          <div className="text-xs text-slate-500 mt-1">Average rating</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
          <div className="text-3xl font-bold text-white">{reviews.length}</div>
          <div className="text-xs text-slate-500 mt-1">Total reviews</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
          <div className="text-3xl font-bold" style={{ color: "#8B5CF6" }}>{fiveStars}</div>
          <div className="text-xs text-slate-500 mt-1">5-star reviews</div>
        </div>
      </div>

      {/* Reviews list */}
      <div className="space-y-3">
        {reviews.map((review) => (
          <div key={review.id} className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-sm">{review.reviewer_name}</span>
                  <span className="text-xs text-slate-500 capitalize">{review.platform}</span>
                </div>
                <div className="mt-1"><StarRating rating={review.rating} /></div>
              </div>
              <span className="text-xs text-slate-500">{new Date(review.review_date).toLocaleDateString("en-AU")}</span>
            </div>
            <p className="text-sm text-slate-300 mt-2">{review.content}</p>
            <div className="mt-3 flex items-center gap-2">
              <button className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-purple-400 transition-colors border border-white/10 rounded-lg px-3 py-1.5">
                <MessageSquare size={12} />AI Response
              </button>
              <button className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-green-400 transition-colors border border-white/10 rounded-lg px-3 py-1.5">
                <ThumbsUp size={12} />Mark Responded
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
