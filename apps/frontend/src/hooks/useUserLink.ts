import { useEffect, useState } from 'react';
import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/api`,
  withCredentials: true,
});

export const useUserLink = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootstrapUser = async () => {
      try {
        const response = await api.get('/me');
        console.log("User verified:", response.data);
        setIsLoading(false);
      } catch (error: any) {
        if (error.response) {
          const status = error.response.status;

          if (status === 401) {
            window.location.href = `${import.meta.env.VITE_BACKEND_URL}/api/login`;
            return; // Don't set loading to false, we are leaving the page
          }
        }
        setIsLoading(false); 
      }
    };

    bootstrapUser();
  }, []);

  return { isLoading };
};