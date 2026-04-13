import Confetti, { type ConfettiHandle } from '@/components/Confetti';
import Hero from '../components/Hero';
import { Button } from '@/elements/buttons/button';
import { useRef } from 'react';

function Home() {
    const confettiRef = useRef<ConfettiHandle>(null);
    
    return (
    <div className="text-lg min-w-full bg-white">
        <Hero />
        <div className='px-80 pt-20'>
            <h1>About us</h1>
            <p className='pt-10'>Founded in 1852 in Manhattan, The Hanover Insurance Group has established one of the longest and most respected records in the property and casualty insurance industry. With over 170 years of experience, the company has built a reputation for resilience and reliability, notably by fulfilling all claim obligations following historic events like the Great Chicago Fire of 1871 and the 1906 San Francisco earthquake. Today, headquartered in Worcester, Massachusetts, The Hanover is dedicated to a mission of helping independent partner agents and policyholders prepare for and recover from the unexpected.</p>
            <h1 className='pt-10'>Values</h1>
            <p className='pt-5'>The company’s unique culture is anchored by its core CARE values—Collaboration, Accountability, Respect, and Empowerment—which drive its commitment to technical excellence, innovative insurance solutions, and maintaining an inclusive environment for its 4,800 employees.</p>
            <h1 className='pt-10'>Strategy</h1>
            <p className='pt-5 pb-20'>As a premier property and casualty franchise, The Hanover continues to leverage advanced data analytics and a people-first approach to provide comprehensive protection for the cars people drive, the businesses they own, and the places they call home.</p>
        </div>
        <div className='flex flex-col items-center justify-center p-8'>
          <Confetti ref={confettiRef}/>
          <Button size="lg" onClick={() => confettiRef.current?.fire()}>Yay!</Button>
        </div>
        <div className='px-80 py-6 border-t border-gray-200'>
            <p className='text-sm text-red-500 text-center'>
                <strong>Disclaimer:</strong> This website has been created for WPI's CS 3733 Software Engineering as a class project and is not in use by Hanover Insurance.
            </p>
        </div>
    </div>
    )
}

export default Home