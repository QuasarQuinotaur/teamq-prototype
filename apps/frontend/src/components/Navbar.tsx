import { Link } from 'react-router-dom';

function Navbar() {
    return (
        <nav className='grid grid-cols-3 items-center px-8 py-4 bg-slate-900 text-white shadow-md'>
            <div className="justify-self-start text-xl font-bold tracking-tight">
                <Link to="/">
                    Hanover Insurance
                </Link>
            </div>

            <div className="justify-self-center flex gap-6">
                <Link to="/people">
                    <span className='p-5'>People</span>
                </Link>
                <Link to="/about">
                    <span className='p-5'>About</span>
                </Link>
            </div>

            <div className="justify-self-right">
            </div>

        </nav>
    )
}

export default Navbar