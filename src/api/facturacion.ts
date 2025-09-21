import { config } from "@src/helpers/config";
import { supabase } from "@src/service/supabaseClient";
import { apiCache } from "@src/services";
import axios, { AxiosResponse } from "axios";
import Cookies from "js-cookie";

export const getFacturas = async (forceRefresh = false) => {
  const cacheKey = 'facturas';
  
  // Intentar obtener desde cache primero (cache más corto para facturas)
  if (!forceRefresh) {
    const cachedFacturas = apiCache.get(cacheKey);
    if (cachedFacturas) {
      return cachedFacturas;
    }
  }

  try {
    const tokenFromCookie = Cookies.get("authToken");
    if (!tokenFromCookie) {
      return [];
    }
    
    const { data, error } = await supabase.auth.getUser(tokenFromCookie);

    if (error) {
      console.error("Error getting Facturas: ", error);
      return [];
    }

    const external =
      data.user.email === "test1@gmail.com" ||
      data.user.email === "julychaves@gmail.com";

    const response = await axios.get(
      `${config.apiUrl}api/jobs?external=${external}`,
    );

    // Cache por 2 minutos para facturas (datos más dinámicos)
    apiCache.set(cacheKey, response.data, 2 * 60 * 1000);

    return response.data;
  } catch (error) {
    console.error("Error getting Facturas: ", error);
    return [];
  }
};

export const createFactura = async (data: {
  userId: number;
  minBill: number;
  maxBill: number;
  billNumber: number;
  startDate: string;
  endDate: string;
}) => {
  try {
    const response = await axios.post(`${config.apiUrl}api/bill`, data);
    
    // Invalidar cache de facturas después de crear una nueva
    apiCache.clear('facturas');
    
    return response.data;
  } catch (error) {
    console.error("Error creating Factura: ", error);
    return [];
  }
};

export const retryFactura = async (
  jobId: number,
): Promise<
  AxiosResponse<{
    status: number;
    message: string;
  }>
> => {
  try {
    const response = await axios.post(`${config.apiUrl}api/bill/retry`, {
      jobId,
    });

    // Invalidar cache de facturas después de reintentar
    apiCache.clear('facturas');

    return response;
  } catch (error) {
    console.error("Error retrying job:", error);
    // Re-throw the error to be handled in the calling code
    throw error;
  }
};

export const pauseBilling = async (list: number[]) => {
  try {
    const tokenFromCookie = Cookies.get("authToken");
    if (!tokenFromCookie) {
      return null;
    }
    const response = await axios.post(
      `${config.apiUrl}api/jobs/fail`,
      {
        jobsId: list,
      },
      {
        headers: {
          Authorization: `Bearer ${tokenFromCookie}`,
        },
      },
    );

    // Invalidar cache de facturas después de pausar
    apiCache.clear('facturas');

    return response.data;
  } catch (error) {
    console.error("Error pausing billing:", error);
    // Re-throw the error to be handled in the calling code
    throw error;
  }
};

export const deleteFacturasFromUser = async (userId: number) => {
  try {
    const tokenFromCookie = Cookies.get("authToken");
    if (!tokenFromCookie) {
      return null;
    }
    const response = await axios.delete(`${config.apiUrl}api/jobs/${userId}`, {
      headers: {
        Authorization: `Bearer ${tokenFromCookie}`,
      },
    });

    // Invalidar cache de facturas después de eliminar
    apiCache.clear('facturas');

    return response.data;
  } catch (error) {
    console.error("Error deleting Facturas: ", error);
    return [];
  }
};
