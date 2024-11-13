import { config } from "@src/helpers/config";
import axios from "axios";

export const getUsers = async () => {
  try {
    const response = await axios.get(`${config.apiUrl}api/users`);

    return response.data;
  } catch (error) {
    console.error("Error getting Users: ", error);
    return [];
  }
};
