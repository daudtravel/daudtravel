"use client";

import { useRouter } from "next/navigation";
import { Plus, Loader2, User, Trash } from "lucide-react";
import Image from "next/image";
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
import { driversAPI } from "@/src/services/drivers.service";

interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  photo?: string;
}

export function DriversList() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const locale = "ka";

  const { data, isLoading, error } = useQuery({
    queryKey: ["drivers", locale],
    queryFn: () => driversAPI.get(locale),
    staleTime: 1000 * 60 * 5,
  });
  const handleCreateDriver = () => {
    router.push("?drivers=createDriver");
  };

  const handleDeleteDriver = async (id: string) => {
    try {
      await driversAPI.delete(id);
      queryClient.invalidateQueries({
        queryKey: ["drivers", locale],
      });
    } catch (error) {
      console.error("Failed to delete driver:", error);
    }
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
        შეცდომა მონაცემების მიღებისას
      </div>
    );
  }

  const drivers: Driver[] = data?.data ?? [];

  return (
    <div className="container mx-auto px-4 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">მძღოლები</h1>
        <Button
          onClick={handleCreateDriver}
          className="flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          <span>მძღოლის დამატება</span>
        </Button>
      </div>

      {drivers.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg mb-4">მძღოლები არ მოიძებნა</p>
          <Button onClick={handleCreateDriver} variant="outline">
            დაამატე პირველი მძღოლი
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-gray-100 rounded-lg font-medium text-sm text-gray-600">
            <div className="col-span-1">სურათი</div>
            <div className="col-span-5">სახელი</div>
            <div className="col-span-4">გვარი</div>
            <div className="col-span-2">მოქმედებები</div>
          </div>

          {drivers.map((driver) => (
            <Card key={driver.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-1">
                    <div className="relative h-12 w-12 rounded-full overflow-hidden">
                      {driver.photo ? (
                        <Image
                          src={`${process.env.NEXT_PUBLIC_BASE_URL}${driver.photo}`}
                          alt={`${driver.firstName} ${driver.lastName}`}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                          <User className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="col-span-5 font-semibold">
                    {driver.firstName || "უცნობი"}
                  </div>

                  <div className="col-span-4 font-semibold">
                    {driver.lastName || "უცნობი"}
                  </div>

                  <div className="col-span-2 flex justify-end">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash className="h-4 w-4 text-red-600" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>მძღოლის წაშლა</AlertDialogTitle>
                          <AlertDialogDescription>
                            დარწმუნებული ხართ რომ გსურთ მძღოლის წაშლა?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>გაუქმება</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteDriver(driver.id)}
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
      )}
    </div>
  );
}

export default DriversList;
