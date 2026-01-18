// src/components/videos/CreateVideo.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Label } from "@/src/components/ui/label";
import axios from "axios";
import { videoApi } from "@/src/services/videos.service";

export default function CreateVideo() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    url: "",
    category: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (!formData.url.trim()) {
        setErrorMessage("URL სავალდებულოა");
        setIsSubmitting(false);
        return;
      }

      try {
        new URL(formData.url);
      } catch {
        setErrorMessage("გთხოვთ შეიყვანოთ სწორი URL");
        setIsSubmitting(false);
        return;
      }

      const submitData = {
        url: formData.url.trim(),
        ...(formData.title.trim() && { title: formData.title.trim() }),
        ...(formData.description.trim() && {
          description: formData.description.trim(),
        }),
        ...(formData.category.trim() && { category: formData.category.trim() }),
      };

      await videoApi.post(submitData);

      setSuccessMessage("ვიდეო წარმატებით დაემატა");
      await queryClient.invalidateQueries({ queryKey: ["videos"] });

      setTimeout(() => {
        router.push("?videos=all");
      }, 1500);
    } catch (error) {
      console.error("Failed to create video:", error);
      if (axios.isAxiosError(error) && error.response) {
        setErrorMessage(
          error.response.data.message || "ვიდეოს დამატება ვერ მოხერხდა"
        );
      } else {
        setErrorMessage("მოხდა მოულოდნელი შეცდომა");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("?videos=all");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">ვიდეოს დამატება</CardTitle>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="url">
                URL <span className="text-red-500">*</span>
              </Label>
              <Input
                id="url"
                name="url"
                type="url"
                value={formData.url}
                onChange={handleChange}
                placeholder="https://www.youtube.com/watch?v=..."
                required
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500">
                შეიყვანეთ YouTube ან სხვა ვიდეო პლატფორმის ბმული
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">სათაური</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="შეიყვანეთ ვიდეოს სათაური (არასავალდებულო)"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">აღწერა</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="შეიყვანეთ ვიდეოს აღწერა (არასავალდებულო)"
                rows={4}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">კატეგორია</Label>
              <Input
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="მაგ: ტრანსფერები, ტურები, ზოგადი (არასავალდებულო)"
                disabled={isSubmitting}
              />
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                გაუქმება
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    მიმდინარეობს...
                  </>
                ) : (
                  "შენახვა"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
