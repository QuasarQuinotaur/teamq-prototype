import {
    Combobox, ComboboxChip, ComboboxChips, ComboboxChipsInput,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList, ComboboxValue, useComboboxAnchor,
} from "@/components/Combobox.tsx"
import {useState, useEffect} from "react";
import type {Employee} from "db";
import * as React from "react";

export default function EmployeeCombobox({ isUpdate, ownerID, setNewOwner }) {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [owner, setOwner] = useState<string>("");

    function fetchStates() {
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/employee`, { credentials: 'include' })
            .then(res => res.json())
            .then((data: Employee[]) => {
                setEmployees(data);
            })
            .finally(() => setLoading(false));
    }

    // function fetchMe() {
    //     fetch(`${import.meta.env.VITE_BACKEND_URL}/api/me`, { credentials: 'include' })
    //         .then(res => res.json())
    //         .then((data: Employee) => {
    //             setOwner(data);
    //         })
    //         .finally(() => setLoading(false));
    // }

    function fetchOwner(ownerID: number) {
        const url = ownerID ? `${import.meta.env.VITE_BACKEND_URL}/api/employee/${ownerID}/0` : `${import.meta.env.VITE_BACKEND_URL}/api/me`
        fetch(url, { credentials: 'include' })
            .then(res => res.json())
            .then((data: Employee) => {
                setOwner(`${data.firstName} ${data.lastName}`);
            })
            .finally(() => setLoading(false));
    }

    useEffect(() => {
        fetchOwner(ownerID)
        fetchStates()
    }, [ownerID]);

    const ownerName = owner//`${owner.firstName} ${owner.lastName}`

    return (
        <Combobox
            items={employees}
            defaultValue={ownerName}
            autoHighlight
            onValueChange={(value) => {
                setNewOwner(value)
            }}
        >
            <ComboboxInput placeholder={ownerName} showClear />
            <ComboboxContent>
                <ComboboxEmpty>No items found.</ComboboxEmpty>
                <ComboboxList>
                    {(item) => (
                        <ComboboxItem key={`${item.firstName} ${item.lastName}`} value={`${item.firstName} ${item.lastName}`}>
                            {`${item.firstName} ${item.lastName}`}
                        </ComboboxItem>
                    )}
                </ComboboxList>
            </ComboboxContent>
        </Combobox>
        // <Combobox
        //     autoHighlight
        //     items={employees}
        //     onValueChange={(newValues) => {
        //         setUserName(newValues)
        //     }}
        // >
        //     <ComboboxChips ref={anchor} className="w-full max-w-xs">
        //         <ComboboxValue>
        //             <>
        //                 {/*{employees.map((value) => (*/}
        //                 {/*    <ComboboxChip key={value.id}>*/}
        //                 {/*        {`${value.firstName} ${value.lastName}`}*/}
        //                 {/*    </ComboboxChip>*/}
        //                 {/*))}*/}
        //                 <ComboboxChipsInput
        //                     placeholder={userName}
        //                     showClear
        //                 />
        //             </>
        //         </ComboboxValue>
        //     </ComboboxChips>
        //     <ComboboxContent anchor={anchor} className={"pointer-events-auto"}>
        //         <ComboboxList>
        //             {(item) => (
        //                 <ComboboxItem key={item} value={item}>
        //                     {`${item.firstName} ${item.lastName}`}
        //                 </ComboboxItem>
        //             )}
        //         </ComboboxList>
        //     </ComboboxContent>
        // </Combobox>
    )
}
