import { useMemo } from "react";
import { useTransferData } from "./useTransferData";
import { useTransferById } from "./useTransfersById";

interface UseProcessedTransferOptions {
  id: string;
  locale?: string;
  fallbackLocale?: string;
}

export const useProcessedTransfer = ({
  id,
  locale,
  fallbackLocale = "ka",
}: UseProcessedTransferOptions) => {
  const {
    data: response,
    isLoading,
    isError,
    error,
  } = useTransferById(id, locale);

  const transfer = useMemo(() => response?.data, [response]);

  const processedData = useTransferData({
    transfer,
    locale,
    fallbackLocale,
  });

  return {
    isLoading,
    isError,
    error,
    ...processedData,
  };
};
