import EmployeeCard from "@/components/cards/EmployeeCard.tsx";

export default function Test() {

    const testEntry = {
        title: "Testing",
        link: "https://google.com",
        item: {
            id: 0,
        },
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
                    // action="Visit Site"
                />
            </div>
        </>
    )
}