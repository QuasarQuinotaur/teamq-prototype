import { useEffect } from 'react';
import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/api`,
  withCredentials: true, // Equivalent to credentials: 'include'
});

export const useUserLink = () => {
  useEffect(() => {
    const bootstrapUser = async () => {
      try {
        const response = await api.get('/me');
        
        console.log("User verified:", response.data);
      } catch (error: any) {
        if (error.response) {
          const status = error.response.status;

          if (status === 401) {
            console.warn("Unauthorized. Redirecting to login...");
            window.location.href = `${import.meta.env.VITE_BACKEND_URL}/login`;
            return;
          }

          if (status === 404) {
            console.log("Employee record found but not linked. Linking now...");
            try {
              await api.post('/me/link');
              window.location.reload();
            } catch (linkError) {
              console.error("Failed to link account:", linkError);
            }
          }
        } else {
          console.error("Network error or CORS block:", error.message);
        }
      }
    };

    bootstrapUser();
  }, []);
};