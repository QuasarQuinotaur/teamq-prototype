import { Link } from 'react-router-dom';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

// const components: { title: string; href: string; description: string }[] = [
//   // {
//   //   title: "Documents",
//   //   href: "/documents",
//   //   description: "All your documents.",
//   // },
//   // {
//   //   title: "About",
//   //   href: "/about",
//   //   description: "More information about our firm.",
//   // },
// ]

function Navbar() {
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
                {/* <NavigationMenu>
                    <NavigationMenuList>
                        <NavigationMenuLink asChild>
                            <Link to="/clients" className='font-medium hover:text-white/80 transition-colors'>
                                Clients
                            </Link>
                        </NavigationMenuLink>
                    </NavigationMenuList>
                </NavigationMenu>
                
                <NavigationMenu>
                    <NavigationMenuList>
                        <NavigationMenuItem>
                            <NavigationMenuTrigger className="bg-transparent hover:bg-white/10 text-white focus:bg-white/10">
                                More
                            </NavigationMenuTrigger>
                            <NavigationMenuContent>
                                <ul className="w-96 p-4 bg-white text-black"> 
                                    
                                    {components.map((component) => (
                                        <ListItem
                                            key={component.title}
                                            title={component.title}
                                            href={component.href}
                                        >
                                            {component.description}
                                        </ListItem>
                                    ))}
                                </ul>
                            </NavigationMenuContent>
                        </NavigationMenuItem>
                    </NavigationMenuList>
                </NavigationMenu> */}
            </div>

            {/* right side of navbar */}
            <div className="justify-self-end">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
                            <Avatar size="default" className="cursor-pointer bg-white/20 hover:bg-white/30 transition-colors">
                                <AvatarFallback className="text-white bg-transparent font-medium">JD</AvatarFallback>
                            </Avatar>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Profile</DropdownMenuItem>
                        <DropdownMenuItem>Settings</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">Sign out</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </nav>
    )
}

function ListItem({
  title,
  children,
  href,
  className, // Extract className if you want to apply it to the li
  ...props   // These are now li-specific props
}: React.ComponentPropsWithoutRef<"li"> & { href: string }) {
  return (
    <li {...props} className={className}> 
      <NavigationMenuLink asChild>
        <Link 
          to={href} 
          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  )
}

export default Navbar