import Hero from '../components/Hero';
import EmployeeForm from "@/components/forms/EmployeeForm.tsx";

function Home() {
    return (
    <div className="text-xl min-w-full justify-center bg-white">
        <Hero />
        <div className='px-100 pt-20'>
            <h1>About us</h1>
            <p className='pt-10'>Lorem, ipsum dolor sit amet consectetur adipisicing elit. Ratione quo natus omnis deserunt commodi perferendis nobis officiis minus quia modi dolorem, alias excepturi aliquam reiciendis soluta blanditiis. Sit, minus quo!</p>
            <p className='pt-5'>Lorem, ipsum dolor sit amet consectetur adipisicing elit. Ratione quo natus omnis deserunt commodi perferendis nobis officiis minus quia modi dolorem, alias excepturi aliquam reiciendis soluta blanditiis. Sit, minus quo! Lorem ipsum dolor sit, amet consectetur adipisicing elit. Voluptatibus, deleniti? Excepturi blanditiis accusamus ducimus architecto quos ex, unde repellendus, odit impedit dolorem itaque. Dignissimos quam culpa enim adipisci iure soluta!</p>
            <p className='pt-5 pb-20'>Lorem, ipsum dolor sit amet consectetur adipisicing elit. Ratione quo natus omnis deserunt commodi perferendis nobis officiis minus quia modi dolorem, alias excepturi aliquam reiciendis soluta blanditiis. Sit, minus quo!</p>
        </div>
        <EmployeeForm/>
    </div>
    )
}

export default Home