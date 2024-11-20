import { config } from "@src/helpers/config";
import { supabase } from "@src/service/supabaseClient";
import axios from "axios";
import Cookies from "js-cookie";

export const getUsers = async () => {
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
      `${config.apiUrl}api/users?external=${external}`,
    );
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("Error getting Users: ", error);
    return [];
  }
};
