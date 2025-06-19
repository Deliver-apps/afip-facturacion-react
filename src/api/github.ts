import { config } from "@src/helpers/config";
import axios from "axios";

export const triggerRedeploy = async (): Promise<{
  error: boolean;
  message: string;
}> => {
  try {
    // We'll create a unique filename so we don't need the existing file's SHA
    const fileName = `trigger-${Date.now()}.txt`;
    const commitMessage = "chore: Trigger redeploy from React";
    const fileContent = `Redeploy triggered at ${new Date().toISOString()}`;

    // GitHub API requires file content to be Base64 encoded
    const base64Content = btoa(fileContent);

    const url = `https://api.github.com/repos/Deliver-apps/afip-facturacion-react/contents/${fileName}`;
    const response = await axios.put(
      url,
      {
        message: commitMessage,
        content: base64Content,
      },
      {
        headers: {
          Authorization: `Bearer ${config.githubCarlos}`,
          // "Content-Type": "application/json",
          Accept: "application/vnd.github.v3+json",
        },
      },
    );

    console.log("GitHub commit response:", response.data);

    return {
      error: false,
      message: "Redeploy triggered",
    };
  } catch (error) {
    console.error("Error triggering redeploy:", error);

    return {
      error: true,
      message: "Error triggering redeploy",
    };
  }
};
