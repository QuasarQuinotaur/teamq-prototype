import {useEffect, useRef, useState} from "react";
import type {Employee} from "db";
import {Avatar} from "radix-ui";
import EmployeeProfileCard from "@/components/cards/EmployeeProfileCard.tsx";

export default function Profile(){
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [updateEmployee, setUpdateEmployee] = useState(false)

    useEffect(() => {
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/me`, {
            credentials: "include",
        })
            .then(res => {
                if (!res.ok) throw new Error("Not authenticated");
                return res.json();
            })
            .then((data: Employee) => {
                setEmployee(data);
                setUpdateEmployee(false);
                return fetchProfilePhoto();
            })
            .catch(err => console.error(err));
    }, [updateEmployee]);

    function refetchEmployee() {
        setUpdateEmployee(true)
    }


    const fileInputRef = useRef<HTMLInputElement | null>(null);

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file); // ✅ MUST match backend

        try {
            const res = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/api/photos/upload-photo`,
                {
                    method: "POST",
                    credentials: "include",
                    body: formData,
                }
            );

            if (!res.ok) throw new Error("Upload failed");

            const data = await res.json();

            console.log("Uploaded:", data);

            await fetchProfilePhoto();

        } catch (err) {
            console.error(err);
        } finally {
            e.target.value = "";
        }
    }

    async function fetchProfilePhoto() {
        try {
            const res = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/api/photos/photo`,
                { credentials: "include" }
            );

            if (!res.ok) return;

            const data = await res.json();

            setEmployee(prev =>
                prev ? { ...prev, image: data.url } : prev
            );

        } catch (err) {
            console.error(err);
        }
    }

    return (
        <>
            {employee && (
                <EmployeeProfileCard
                    employee={employee}
                    onUploadClick={() => fileInputRef.current?.click()}
                    refetchEmployee={refetchEmployee}
                />
            )}

            <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
            />
        </>
    )
}