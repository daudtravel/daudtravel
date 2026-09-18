"use client";

import { useParams, useRouter } from "next/navigation";
import { Plus, Loader2, Trash, ExternalLink } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/src/components/ui/alert-dialog";
import { VideoListType } from "@/src/types/video.types";
import { videoApi } from "@/src/services/videos.service";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export function VideoList() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations("admin");

  const { data, isLoading, error } = useQuery({
    queryKey: ["videos", locale],
    queryFn: () => videoApi.get(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const videos = data?.data || [];

  const handleDeleteVideo = async (id: string) => {
    try {
      await videoApi.delete(id);
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      toast.success(t("videos.deleted"));
    } catch {
      toast.error(t("videos.deleteFailed"));
    }
  };

  const handleCreateVideo = () => {
    router.push("?videos=createVideo");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[400px] text-red-500">
        {t("videos.loadError")}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">{t("videos.title")}</h1>
        <Button onClick={handleCreateVideo} className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          <span>{t("videos.add")}</span>
        </Button>
      </div>

      {videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg mb-4">{t("videos.notFound")}</p>
          <Button onClick={handleCreateVideo} variant="outline">
            {t("videos.addFirst")}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-gray-100 rounded-lg font-medium text-sm text-gray-600">
            <div className="col-span-3">{t("videos.colTitle")}</div>
            <div className="col-span-3">{t("common.description")}</div>
            <div className="col-span-2">URL</div>
            <div className="col-span-2">{t("common.category")}</div>
            <div className="col-span-2">{t("common.actions")}</div>
          </div>

          <div className="space-y-4">
            {videos.map((video: VideoListType) => (
              <Card
                key={video.id}
                className="overflow-hidden hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-3">
                      <div className="font-semibold line-clamp-2">
                        {video.title || t("videos.untitled")}
                      </div>
                    </div>

                    <div className="col-span-3">
                      <div className="text-sm text-gray-600 line-clamp-3">
                        {video.description || t("videos.noDescription")}
                      </div>
                    </div>

                    <div className="col-span-2">
                      <a
                        href={video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1 truncate"
                      >
                        <span className="truncate">{t("videos.link")}</span>
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      </a>
                    </div>

                    <div className="col-span-2">
                      <div className="text-sm text-gray-600">
                        {video.category || "—"}
                      </div>
                    </div>

                    <div className="col-span-2 flex justify-end gap-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-600 hover:text-black"
                          >
                            <Trash className="h-4 w-4 text-red-700" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t("videos.deleteTitle")}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t("videos.deleteConfirm")}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteVideo(video.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              {t("common.delete")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoList;
