
import { useState, useEffect } from 'react';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, Loader2 } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { notifyTruckerOfNewReview, notifyShipperOfNewReview } from '@/utils/notifications';
import { posthog } from '@/utils/posthog';
import { trackEvent } from '@/utils/analytics';

interface ReviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  truckerId: string;
  shipperId: string;
  truckerName: string;
  shipperName?: string;
  reviewerRole?: 'shipper' | 'trucker';
  onSuccess?: () => void;
}

const ReviewDialog = ({ 
  isOpen, 
  onClose, 
  tripId, 
  truckerId, 
  shipperId, 
  truckerName,
  shipperName,
  reviewerRole = 'shipper',
  onSuccess 
}: ReviewDialogProps) => {
  const { getToken } = useClerkAuth();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setRating(0);
      setHover(0);
      setComment('');
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (rating === 0) {
      showError('Please select a rating');
      return;
    }

    setSubmitting(true);
    try {
      const supabaseToken = await getToken({ template: 'supabase' });
      if (!supabaseToken) throw new Error('No Supabase token');
      
      const supabase = createClerkSupabaseClient(supabaseToken);

      // Check for existing review to prevent duplicate submission
      const existingCheckField = reviewerRole === 'shipper' ? 'shipper_id' : 'trucker_id';
      const existingCheckValue = reviewerRole === 'shipper' ? shipperId : truckerId;
      const { data: existing, error: checkError } = await supabase
        .from('reviews')
        .select('id')
        .eq('trip_id', tripId)
        .eq('reviewer_role', reviewerRole)
        .eq(existingCheckField, existingCheckValue)
        .limit(1);
      if (checkError) throw checkError;
      if (existing?.length) {
        showError('You have already submitted a review for this trip.');
        onClose();
        return;
      }
      
      const { error } = await supabase
        .from('reviews')
        .insert({
          trip_id: tripId,
          trucker_id: truckerId,
          shipper_id: shipperId,
          reviewer_role: reviewerRole,
          rating,
          comment: comment.trim()
        });

      if (error) throw error;

      if (reviewerRole === 'shipper') {
        notifyTruckerOfNewReview({
          truckerId,
          shipperName: shipperName || 'A shipper',
          tripId,
          getToken: () => getToken({ template: 'supabase' }),
        });
      } else {
        notifyShipperOfNewReview({
          shipperId,
          truckerName: truckerName || 'A trucker',
          tripId,
          getToken: () => getToken({ template: 'supabase' }),
        });
      }

      trackEvent('review_submitted', {
        trip_id: tripId,
        reviewer_role: reviewerRole,
        rating,
        has_comment: Boolean(comment.trim()),
      });
      showSuccess('Review submitted! Thank you for your feedback.');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      posthog.captureException(err, { flow: 'submit_review', reviewer_role: reviewerRole });
      showError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {reviewerRole === 'shipper' ? `Rate ${truckerName}` : `Rate ${shipperName || 'the shipper'}`}
          </DialogTitle>
          <DialogDescription>
            {reviewerRole === 'shipper'
              ? `How was your trip with ${truckerName}? Your feedback helps the community.`
              : `How was your experience with ${shipperName || 'the shipper'}? Your feedback helps the community.`
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6 space-y-6">
          <div className="flex flex-col items-center space-y-2">
            <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Overall Rating</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="focus:outline-none transition-transform active:scale-90"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                  aria-label={`Rate ${star} out of 5`}
                >
                  <Star
                    className={`h-8 w-8 ${
                      (hover || rating) >= star
                        ? 'text-yellow-500 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Your Comments (Optional)</Label>
            <Textarea
              id="comment"
              placeholder="Tell us about the service, punctuality, etc."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="h-24 resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            className="bg-orange-600 hover:bg-orange-700"
            disabled={submitting || rating === 0}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : 'Submit Review'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewDialog;