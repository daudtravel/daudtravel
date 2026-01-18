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

export function VideoList() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useParams();
  const locale = params.locale as string;

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
    } catch (error) {
      console.error("Failed to delete video:", error);
      alert("ვიდეოს წაშლა ვერ მოხერხდა");
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
        შეცდომა ვიდეოების ჩატვირთვისას
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">ვიდეოები</h1>
        <Button onClick={handleCreateVideo} className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          <span>ვიდეოს დამატება</span>
        </Button>
      </div>

      {videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg mb-4">ვიდეოები არ მოიძებნა</p>
          <Button onClick={handleCreateVideo} variant="outline">
            დაამატე პირველი ვიდეო
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-gray-100 rounded-lg font-medium text-sm text-gray-600">
            <div className="col-span-3">სათაური</div>
            <div className="col-span-3">აღწერა</div>
            <div className="col-span-2">URL</div>
            <div className="col-span-2">კატეგორია</div>
            <div className="col-span-2">მოქმედებები</div>
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
                        {video.title || "უსათაურო"}
                      </div>
                    </div>

                    <div className="col-span-3">
                      <div className="text-sm text-gray-600 line-clamp-3">
                        {video.description || "აღწერა არ არის"}
                      </div>
                    </div>

                    <div className="col-span-2">
                      <a
                        href={video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1 truncate"
                      >
                        <span className="truncate">ბმული</span>
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
                            <AlertDialogTitle>ვიდეოს წაშლა</AlertDialogTitle>
                            <AlertDialogDescription>
                              დარწმუნებული ხართ რომ გსურთ ვიდეოს წაშლა? ეს
                              მოქმედება ვერ გაუქმდება.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>გაუქმება</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteVideo(video.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              წაშლა
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
