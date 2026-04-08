import { Link } from 'react-router-dom';
import {
  NavigationMenuLink,
} from "@/components/ui/navigation-menu"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/DropdownMenu"
import { Avatar, AvatarFallback } from "@/elements/avatar"
import { useState, useEffect } from 'react';

import axios from 'axios';

function Navbar() {
    const [employee, setEmployee] = useState<{ firstName: string; lastName: string } | null>(null);

    const api = axios.create({
        baseURL: `${import.meta.env.VITE_BACKEND_URL}/api`,
        withCredentials: true,
    });

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await api.get('/me');
                setEmployee(response.data);
            } catch (error) {
                console.error("Not logged in or no employee record found", error);
            }
        };
        fetchUser();
    }, []);

    const getInitials = () => {
        if (!employee) return "??";
        return `${employee.firstName[0]}${employee.lastName[0]}`.toUpperCase();
    };

    return (
        /* Changed bg-white to bg-hanover-blue and text-black to text-white */
        <nav className='grid grid-cols-3 items-center px-8 min-w-full text-white shadow-md bg-hanover-blue h-navbar-height'>
            
            {/* left side of navbar: Logo with inversion */}
            <div className="justify-self-start">
                <Link to="/">
                    <img 
                        src="/CombinationMark.png" 
                        alt="Logo" 
                        className="h-8 w-auto invert brightness-0 invert" 
                        /* Note: 'invert' makes black white. If your logo is colored, 
                           'brightness-0 invert' forces it to pure white. */
                    />
                </Link>
            </div> 

            {/* middle of navbar */}
            <div className="justify-self-center flex gap-1">
            </div>

            {/* right side of navbar */}
            <div className="justify-self-end">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
                            <Avatar size="default" className="cursor-pointer bg-white/20 hover:bg-white/30 transition-colors">
                                <AvatarFallback className="text-white bg-transparent font-medium">
                                    {getInitials()}
                                </AvatarFallback>
                            </Avatar>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Profile</DropdownMenuItem>
                        <DropdownMenuItem>Settings</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                            className="text-destructive" 
                            onClick={() => window.location.href = `${import.meta.env.VITE_BACKEND_URL}/logout`}
                        >
                            Sign out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </nav>
    )
}

export default Navbar