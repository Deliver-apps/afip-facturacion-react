import { config } from "@src/helpers/config";
import axios from "axios";
import Cookies from "js-cookie";

interface UserFacturacion {
  id: number;
  username: string;
  real_name: string;
  password: string;
  external_client: boolean;
  category: string;
  created_at: string;
  minimum: number;
  maximum: number;
  updated_at: string;
}

export const createUserFacturacion = async (
  payload: Partial<UserFacturacion>,
) => {
  try {
    const tokenFromCookie = Cookies.get("authToken");
    if (!tokenFromCookie) {
      throw new Error("No token found in cookie");
    }
    const response = await axios.post(`${config.apiUrl}api/users`, payload, {
      headers: {
        Authorization: `Bearer ${tokenFromCookie}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error creating User: ", error);
    return null;
  }
};

export const deleteUserFacturacion = async (id: number) => {
  try {
    const tokenFromCookie = Cookies.get("authToken");
    if (!tokenFromCookie) {
      throw new Error("No token found in cookie");
    }
    const response = await axios.delete(`${config.apiUrl}api/users/${id}`, {
      headers: {
        Authorization: `Bearer ${tokenFromCookie}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting User: ", error);
    return null;
  }
};

export const updateUserFacturacion = async (
  id: number,
  payload: Partial<UserFacturacion>,
) => {
  try {
    const tokenFromCookie = Cookies.get("authToken");
    if (!tokenFromCookie) {
      throw new Error("No token found in cookie");
    }
    const response = await axios.put(
      `${config.apiUrl}api/users/${id}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${tokenFromCookie}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error updating User: ", error);
    return null;
  }
};

export const getUserFacturacion = async (id: number) => {
  try {
    const tokenFromCookie = Cookies.get("authToken");
    if (!tokenFromCookie) {
      throw new Error("No token found in cookie");
    }
    const response = await axios.get(`${config.apiUrl}api/users/${id}`, {
      headers: {
        Authorization: `Bearer ${tokenFromCookie}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error getting User: ", error);
    return null;
  }
};

export const scrapAfip = async (user: Partial<UserFacturacion>) => {
  try {
    const tokenFromCookie = Cookies.get("authToken");
    if (!tokenFromCookie) {
      throw new Error("No token found in cookie");
    }
    const response = await axios.post(
      `${config.apiScrapperUrl}api/scrapper`,
      {
        username: user.username,
      },
      {
        headers: {
          Authorization: `Bearer ${tokenFromCookie}`,
        },
      },
    );

    return response.data;
  } catch (error: unknown) {
    let message = "Unknown error";

    if (axios.isAxiosError(error)) {
      // error al llegar a tu API ─ intenta sacar el mensaje que envíes desde el backend
      message =
        error.response?.data?.message || // API devolvió JSON con { message }
        error.response?.data || // API devolvió texto plano
        error.message; // mensaje genérico de Axios
    } else if (error instanceof Error) {
      // otros errores JavaScript (cookies, lógica, etc.)
      message = "Error del servidor en ejecución";
    }

    console.error("Error scrapping:", message);
    return message;
  }
};

export const checkJobStatus = async (jobId: string) => {
  try {
    const tokenFromCookie = Cookies.get("authToken");
    if (!tokenFromCookie) {
      throw new Error("No token found in cookie");
    }
    const response = await axios.get(
      `${config.apiScrapperUrl}api/scrapper/status/${jobId}`,
      {
        headers: {
          Authorization: `Bearer ${tokenFromCookie}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    let message = "Unknown error";

    if (axios.isAxiosError(error)) {
      // error al llegar a tu API ─ intenta sacar el mensaje que envíes desde el backend
      message =
        error.response?.data?.message || // API devolvió JSON con { message }
        error.response?.data || // API devolvió texto plano
        error.message; // mensaje genérico de Axios
    } else if (error instanceof Error) {
      // otros errores JavaScript (cookies, lógica, etc.)
      message = error.message;
    }

    console.error("Error scrapping:", message);
    return message;
  }
};

export const generateCSR = async (user: Partial<UserFacturacion>) => {
  try {
    const tokenFromCookie = Cookies.get("authToken");
    if (!tokenFromCookie) {
      throw new Error("No token found in cookie");
    }
    const response = await axios.post(
      `${config.apiScrapperUrl}api/cert/generate`,
      {
        commonName: "Facturacion1",
        organization: `${user.real_name}`,
        country: "AR",
        serialNumber: `CUIT ${user.username}`,
      },
      {
        headers: {
          Authorization: `Bearer ${tokenFromCookie}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error generating CSR: ", error);
    return null;
  }
};
