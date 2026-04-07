import { useEffect } from "react";

export const useUserLink = () => {
  useEffect(() => {
    const bootstrapUser = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/me', { 
          credentials: 'include' // Required to send cookies
        });

        if (response.status === 401) {
          // If not logged in, redirect the WHOLE browser to the login page
          window.location.href = 'http://localhost:3000/login';
          return;
        }

        if (response.status === 404) {
          await fetch('http://localhost:3000/api/me/link', {
            method: 'POST',
            credentials: 'include'
          });
          window.location.reload();
        }
      } catch (error) {
        console.error("Auth bridge failed. You might need to log in manually.", error);
      }
    };
    bootstrapUser();
  }, []);
};