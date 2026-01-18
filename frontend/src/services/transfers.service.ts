import {
  CreateTransferInput,
  TransferResponse,
  TransfersQueryParams,
  TransfersResponse,
  UpdateTransferInput,
} from "../types/transfers.types";
import { axiosInstance } from "../utlis/axiosInstance";

class TransfersService {
  private readonly BASE_PATH = "transfers";

  async getAll(params?: TransfersQueryParams): Promise<TransfersResponse> {
    const response = await axiosInstance.get<TransfersResponse>(
      this.BASE_PATH,
      {
        params,
      }
    );
    return response.data;
  }

  async getPublic(params?: TransfersQueryParams): Promise<TransfersResponse> {
    const response = await axiosInstance.get<TransfersResponse>(
      `${this.BASE_PATH}/public`,
      { params }
    );
    return response.data;
  }

  async getById(id: string, locale?: string): Promise<TransferResponse> {
    const response = await axiosInstance.get<TransferResponse>(
      `${this.BASE_PATH}/${id}`,
      {
        params: locale ? { locale } : undefined,
      }
    );
    return response.data;
  }

  async create(data: CreateTransferInput): Promise<TransferResponse> {
    const response = await axiosInstance.post<TransferResponse>(
      this.BASE_PATH,
      data
    );
    return response.data;
  }

  async update(
    id: string,
    data: UpdateTransferInput
  ): Promise<TransferResponse> {
    const response = await axiosInstance.put<TransferResponse>(
      `${this.BASE_PATH}/${id}`,
      data
    );
    return response.data;
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const response = await axiosInstance.delete<{
      success: boolean;
      message: string;
    }>(`${this.BASE_PATH}/${id}`);
    return response.data;
  }
}

export const transfersService = new TransfersService();
