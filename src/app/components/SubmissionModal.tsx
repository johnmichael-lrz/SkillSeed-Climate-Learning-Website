import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Loader2, Upload, Camera, CheckCircle, X, AlertTriangle, XCircle } from "lucide-react";
import { uploadProofPhoto, submitChallengeCompletion } from "../utils/challengeService";
import type { Challenge } from "../types/database";
import type { ModerationResult } from "../utils/moderationService";

interface SubmissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  challenge: Challenge;
  userId: string;
  onSuccess: () => void;
}

export function SubmissionModal({
  open,
  onOpenChange,
  challenge,
  userId,
  onSuccess,
}: SubmissionModalProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [moderating, setModerating] = useState(false);
  const [moderationResult, setModerationResult] = useState<ModerationResult | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [reflection, setReflection] = useState("");
  const [impactSummary, setImpactSummary] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    setError(null);
    setPhotoFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!photoFile) {
      setError("Please upload a photo of your completed challenge");
      return;
    }

    setLoading(true);
    setError(null);
    setModerationResult(null);

    try {
      // Upload photo to storage
      setUploading(true);
      const photoUrl = await uploadProofPhoto(photoFile, userId, challenge.id);
      setUploading(false);

      // Run moderation + submit
      setModerating(true);
      const { moderation } = await submitChallengeCompletion(
        challenge.id,
        userId,
        photoUrl,
        reflection || undefined,
        impactSummary || undefined,
        challenge.title,
        challenge.category,
      );
      setModerating(false);
      setModerationResult(moderation);

      // Only close and call onSuccess if approved
      if (moderation.status === 'approved') {
        setPhotoFile(null);
        setPhotoPreview(null);
        setReflection('');
        setImpactSummary('');
        onSuccess();
        onOpenChange(false);
      }
      // For flagged/rejected, stay open so user can see the outcome
    } catch (err) {
      console.error("Submission error:", err);
      setError("Failed to submit. Please try again.");
    } finally {
      setLoading(false);
      setUploading(false);
      setModerating(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setPhotoFile(null);
      setPhotoPreview(null);
      setReflection("");
      setImpactSummary("");
      setError(null);
      setModerationResult(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg bg-white border-gray-200 text-gray-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-[#0F3D2E]">
            <CheckCircle className="h-5 w-5 text-[#2F8F6B]" />
            Complete Challenge
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Submit proof of completing "{challenge.title}" to earn{" "}
            <span className="text-[#2F8F6B] font-semibold">
              {challenge.points_reward} points
            </span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Photo Upload Section */}
          <div className="space-y-2">
            <Label className="text-gray-700">
              Photo Proof <span className="text-red-500">*</span>
            </Label>
            
            {!photoPreview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-[#2F8F6B] hover:bg-[#E6F4EE] transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 bg-[#E6F4EE] rounded-full">
                    <Camera className="h-6 w-6 text-[#2F8F6B]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Click to upload your proof photo
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG, or WEBP (max 5MB)
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute top-2 right-2 p-1 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Reflection */}
          <div className="space-y-2">
            <Label htmlFor="reflection" className="text-gray-700">
              Reflection (optional)
            </Label>
            <Textarea
              id="reflection"
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="What did you learn? How did it feel?"
              className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 min-h-[80px]"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 text-right">
              {reflection.length}/500
            </p>
          </div>

          {/* Impact Summary */}
          <div className="space-y-2">
            <Label htmlFor="impact" className="text-gray-700">
              Impact Summary (optional)
            </Label>
            <Textarea
              id="impact"
              value={impactSummary}
              onChange={(e) => setImpactSummary(e.target.value)}
              placeholder="e.g., Recycled 5 lbs of plastic, planted 3 trees..."
              className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 min-h-[60px]"
              maxLength={200}
            />
            <p className="text-xs text-gray-500 text-right">
              {impactSummary.length}/200
            </p>
          </div>

          {/* Moderation Outcome Banner */}
          {moderationResult && (
            <div className={`p-4 rounded-lg border text-sm flex items-start gap-3 ${
              moderationResult.status === 'approved'
                ? 'bg-green-50 border-green-200 text-green-800'
                : moderationResult.status === 'flagged'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {moderationResult.status === 'approved' && <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-green-600" />}
              {moderationResult.status === 'flagged'  && <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />}
              {moderationResult.status === 'rejected' && <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />}
              <div>
                <p className="font-semibold">
                  {moderationResult.status === 'approved' && '✅ Post Approved'}
                  {moderationResult.status === 'flagged'  && '⚠️ Sent for Review'}
                  {moderationResult.status === 'rejected' && '❌ Post Rejected'}
                </p>
                <p className="mt-0.5 text-xs opacity-90">{moderationResult.reason}</p>
                {moderationResult.status === 'flagged' && (
                  <p className="mt-1 text-xs opacity-75">
                    Your post is under admin review. It will appear in the feed once approved.
                  </p>
                )}
                {moderationResult.status === 'rejected' && (
                  <p className="mt-1 text-xs opacity-75">
                    Please edit your reflection or impact summary and try again.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              {moderationResult && moderationResult.status !== 'approved' ? 'Close' : 'Cancel'}
            </Button>
            {/* Hide submit if already approved */}
            {(!moderationResult || moderationResult.status !== 'approved') && (
              <Button
                type="submit"
                disabled={loading || !photoFile}
                className="bg-[#0F3D2E] text-white hover:bg-[#2F8F6B]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {uploading ? "Uploading..." : moderating ? "Reviewing..." : "Submitting..."}
                  </>
                ) : moderationResult?.status === 'rejected' ? (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Resubmit
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Submit Completion
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}