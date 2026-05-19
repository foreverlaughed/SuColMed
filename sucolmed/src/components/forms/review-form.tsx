"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { createReview } from "@/server/actions/review";
import { Star } from "lucide-react";

type ReviewFormProps = {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  onSuccess?: () => void;
};

export function ReviewForm({ appointmentId, patientId, doctorId, onSuccess }: ReviewFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  async function handleSubmit() {
    if (rating === 0) {
      setError("请选择评分");
      return;
    }

    setLoading(true);
    setError("");

    const result = await createReview({
      appointmentId,
      patientId,
      doctorId,
      rating,
      comment: comment || undefined,
    });

    setLoading(false);

    if (!result.success) {
      setError(result.error);
    } else {
      setOpen(false);
      onSuccess?.();
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" className="cursor-pointer">
          <Star className="mr-1 h-4 w-4" />
          评价
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>评价医生</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <div>
            <Label>评分</Label>
            <div className="mt-2 flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="cursor-pointer"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoverRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-slate-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="comment">评价内容（选填）</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="分享您的就诊体验..."
              className="mt-1"
              rows={4}
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={loading || rating === 0}
            className="w-full cursor-pointer"
          >
            {loading ? "提交中..." : "提交评价"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
