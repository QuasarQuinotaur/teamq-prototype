import EmployeeCard from "@/components/EmployeeCard.tsx";

export default function Test() {

    const testEntry = {
        title: "Testing",
        link: "https://google.com",
        item: {},
        fullName: "Theron Boozer",
        image: "/blank-pfp.png",
        role: "Admin",
        email: "wtboozer@wpi.edu"
        //badge: "CEO",
    };

    return (
        <>
            <h1>Test Page</h1>
            <div className="p-10">
                <EmployeeCard
                    entry={testEntry}
                    badges={["Tech", "Featured"]}
                    action="Visit Site"
                />
            </div>
        </>
    )
}