import { Link } from 'react-router-dom';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import Brand from '@/components/Brand';

const components: { title: string; href: string; description: string }[] = [
  {
    title: "Documents",
    href: "/documents",
    description:
      "All your documents.",
  },
  {
    title: "About",
    href: "/about",
    description:
      "More information about our firm.",
  },
]

function Navbar() {
    return (
        <nav className='grid grid-cols-3 items-center px-8 py-4 text-black shadow-md fixed top-0 left-0 right-0 z-50 bg-white'>
            {/* left side of navbar */}
            <div className="justify-self-start text-xl font-bold tracking-tight">
                <Brand />
            </div> 

            {/* middle of navbar */}
            <div className="justify-self-center flex gap-1">
                <NavigationMenu>
                    <NavigationMenuList>
                        <NavigationMenuLink asChild>
                            <Link to="/clients" className='font-medium'>Clients</Link>
                        </NavigationMenuLink>
                    </NavigationMenuList>
                </NavigationMenu>
                <NavigationMenu>
                    <NavigationMenuList>
                        <NavigationMenuItem>
                            <NavigationMenuTrigger>More</NavigationMenuTrigger>
                            <NavigationMenuContent>
                                <ul className="w-96">
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
                </NavigationMenu>
            </div>

            {/* right side of navbar */}
            <div className="justify-self-right">

            </div>

        </nav>
    )
}

function ListItem({
  title,
  children,
  href,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & { href: string }) {
  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <Link to={href} className="min-w-full">
          <div className="flex flex-col gap-1 text-sm">
            <div className="leading-none font-medium">{title}</div>
            <div className="line-clamp-2 text-muted-foreground">{children}</div>
          </div>
        </Link>
      </NavigationMenuLink>
    </li>
  )
}

export default Navbar
