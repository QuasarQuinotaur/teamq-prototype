import { useEffect, useState } from 'react';
import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/api`,
  withCredentials: true,
});

export const useUserLink = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [notRegistered, setNotRegistered] = useState(false);

  useEffect(() => {
    const bootstrapUser = async () => {
      try {
        const response = await api.get('/me');
        console.log("User verified:", response.data);
        setIsLoading(false);
      } catch (error: any) {
        if (error.response?.status === 404) {
          setNotRegistered(true);
          setIsLoading(false);
          return;
        }
        // Redirect to login for 401, network errors, or any other failure
        window.location.href = `${import.meta.env.VITE_BACKEND_URL}/api/login`;
      }
    };

    bootstrapUser();
  }, []);

  return { isLoading, notRegistered };
};