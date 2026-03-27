import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Loader2, Trophy } from "lucide-react";
import type { CreateChallengeInput, ChallengeDifficulty } from "../types/database";

const CATEGORIES = [
  "Waste Reduction",
  "Solar Energy",
  "Urban Greening",
  "Water Conservation",
  "Energy Efficiency",
  "Mixed",
] as const;

const DIFFICULTIES: ChallengeDifficulty[] = ["Beginner", "Intermediate", "Advanced"];

// Points range enforced per difficulty level
const POINTS_RANGE: Record<ChallengeDifficulty, { min: number; max: number; default: number }> = {
  Beginner:     { min: 50,  max: 200,  default: 100 },
  Intermediate: { min: 201, max: 500,  default: 300 },
  Advanced:     { min: 501, max: 1000, default: 750 },
};

function getPointsRange(difficulty: ChallengeDifficulty) {
  return POINTS_RANGE[difficulty] ?? POINTS_RANGE["Beginner"];
}

interface CreateChallengeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateChallengeInput) => Promise<void>;
}

export function CreateChallengeModal({
  open,
  onOpenChange,
  onSubmit,
}: CreateChallengeModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateChallengeInput>({
    title: "",
    description: "",
    category: "",
    difficulty: "Beginner",
    points_reward: 100,
    deadline: "",
    banner_url: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CreateChallengeInput, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateChallengeInput, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }
    if (!formData.category) {
      newErrors.category = "Category is required";
    }
    if (!formData.deadline) {
      newErrors.deadline = "Deadline is required";
    }

    // Validate points against difficulty range
    const { min, max } = getPointsRange(formData.difficulty as ChallengeDifficulty);
    if (formData.points_reward < min || formData.points_reward > max) {
      newErrors.points_reward = `${formData.difficulty} challenges must be between ${min}–${max} points`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      await onSubmit(formData);
      // Reset form on success
      setFormData({
        title: "",
        description: "",
        category: "",
        difficulty: "Beginner",
        points_reward: 100,
        deadline: "",
        banner_url: "",
      });
      setErrors({});
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating challenge:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    field: keyof CreateChallengeInput,
    value: string | number
  ) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // When difficulty changes, reset points_reward to the new difficulty's default
      if (field === "difficulty") {
        const { default: defaultPts } = getPointsRange(value as ChallengeDifficulty);
        updated.points_reward = defaultPts;
      }
      return updated;
    });
    // Clear error when user edits the field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    // Also clear points error when difficulty changes (points will be reset)
    if (field === "difficulty" && errors.points_reward) {
      setErrors((prev) => ({ ...prev, points_reward: undefined }));
    }
  };

  // Get minimum date (today) for deadline
  const today = new Date().toISOString().split("T")[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#E6F4EE] flex items-center justify-center">
              <Trophy className="w-5 h-5 text-[#2F8F6B]" />
            </div>
            <div>
              <DialogTitle className="text-[#0F3D2E] font-[Manrope]">
                Create Challenge
              </DialogTitle>
              <DialogDescription>
                Launch a new climate action challenge for the community
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-[#0F3D2E] font-medium">
              Challenge Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g., 30-Day Zero Waste Challenge"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              className={errors.title ? "border-red-500" : ""}
            />
            {errors.title && (
              <p className="text-red-500 text-xs">{errors.title}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-[#0F3D2E] font-medium">
              Category <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleChange("category", value)}
            >
              <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-red-500 text-xs">{errors.category}</p>
            )}
          </div>

          {/* Difficulty */}
          <div className="space-y-2">
            <Label htmlFor="difficulty" className="text-[#0F3D2E] font-medium">
              Difficulty
            </Label>
            <Select
              value={formData.difficulty}
              onValueChange={(value) =>
                handleChange("difficulty", value as ChallengeDifficulty)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIFFICULTIES.map((diff) => (
                  <SelectItem key={diff} value={diff}>
                    {diff}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-[#0F3D2E] font-medium">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Describe the challenge, its goals, and how participants can take part..."
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={4}
              className={errors.description ? "border-red-500" : ""}
            />
            {errors.description && (
              <p className="text-red-500 text-xs">{errors.description}</p>
            )}
          </div>

          {/* Deadline & Points */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deadline" className="text-[#0F3D2E] font-medium">
                Deadline <span className="text-red-500">*</span>
              </Label>
              <Input
                id="deadline"
                type="date"
                min={today}
                value={formData.deadline}
                onChange={(e) => handleChange("deadline", e.target.value)}
                className={errors.deadline ? "border-red-500" : ""}
              />
              {errors.deadline && (
                <p className="text-red-500 text-xs">{errors.deadline}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="points" className="text-[#0F3D2E] font-medium">
                Points Reward
              </Label>
              <Input
                id="points"
                type="number"
                min={getPointsRange(formData.difficulty as ChallengeDifficulty).min}
                max={getPointsRange(formData.difficulty as ChallengeDifficulty).max}
                value={formData.points_reward}
                onChange={(e) =>
                  handleChange("points_reward", parseInt(e.target.value) || getPointsRange(formData.difficulty as ChallengeDifficulty).default)
                }
                className={errors.points_reward ? "border-red-500" : ""}
              />
              <p className="text-xs text-gray-400">
                {formData.difficulty}: {getPointsRange(formData.difficulty as ChallengeDifficulty).min}–{getPointsRange(formData.difficulty as ChallengeDifficulty).max} pts
              </p>
              {errors.points_reward && (
                <p className="text-red-500 text-xs">{errors.points_reward}</p>
              )}
            </div>
          </div>

          {/* Banner URL (optional) */}
          <div className="space-y-2">
            <Label htmlFor="banner_url" className="text-[#0F3D2E] font-medium">
              Banner Image URL{" "}
              <span className="text-gray-400 text-xs">(optional)</span>
            </Label>
            <Input
              id="banner_url"
              type="url"
              placeholder="https://..."
              value={formData.banner_url}
              onChange={(e) => handleChange("banner_url", e.target.value)}
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#0F3D2E] hover:bg-[#2F8F6B] text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Challenge"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}