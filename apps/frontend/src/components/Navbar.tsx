import { Link } from 'react-router-dom';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"

function Navbar() {
    return (
        <nav className='grid grid-cols-3 items-center px-8 py-4 text-black shadow-md'>
            {/* left side of navbar */}
            <div className="justify-self-start text-xl font-bold tracking-tight">
                <Link to="/">
                    Hanover Insurance
                </Link>
            </div>

            {/* middle of navbar */}
            <div className="justify-self-center flex gap-6">
                <NavigationMenu>
                    <NavigationMenuList>
                        <NavigationMenuItem>
                            <NavigationMenuTrigger><Link to="/clients">Clients</Link></NavigationMenuTrigger>
                            <NavigationMenuContent>
                                <NavigationMenuLink><Link to="/about">About</Link></NavigationMenuLink>
                                <NavigationMenuLink><Link to="/documents">Documents</Link></NavigationMenuLink>
                            </NavigationMenuContent>
                        </NavigationMenuItem>
                    </NavigationMenuList>
                </NavigationMenu>
            </div>

            {/* right side of navbar */}
            <div className="justify-self-right">

            </div>

        </nav>
    )
}

export default Navbar