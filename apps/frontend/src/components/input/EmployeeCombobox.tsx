import {
    Combobox, ComboboxChip, ComboboxChips, ComboboxChipsInput,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList, ComboboxValue, useComboboxAnchor,
} from "@/components/Combobox.tsx"
import {
    Item,
    ItemContent,
    ItemDescription,
    ItemTitle,
    ItemMedia,
} from "@/elements/item"
import {useState, useEffect} from "react";
import type {Employee} from "db";
import * as React from "react";
import {Avatar} from "@/elements/avatar.tsx";

export default function EmployeeCombobox({ isUpdate, ownerID, setNewOwner }) {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [ownerName, setOwnerName] = useState<string>("");
    const [myName, setMyName] = useState<string>("");
    const [myID, setMyID] = useState<number>(0);
    const [permissions, setPermissions] = useState<boolean>(false);

    function fetchStates() {
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/employee`, { credentials: 'include' })
            .then(res => res.json())
            .then((data: Employee[]) => {
                setEmployees(data);
            })
            .finally(() => setLoading(false));
    }

    function fetchMe(ownerID: number) {
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/me`, { credentials: 'include' })
            .then(res => res.json())
            .then((data: Employee) => {
                setMyName(`${data.firstName} ${data.lastName}`);
                setMyID(data.id);
                setPermissions(data.id === ownerID);
            })
            .finally(() => setLoading(false));
    }

    function fetchOwner(ownerID: number) {
        const url = ownerID ? `${import.meta.env.VITE_BACKEND_URL}/api/employee/${ownerID}/0` : `${import.meta.env.VITE_BACKEND_URL}/api/me`
        fetch(url, { credentials: 'include' })
            .then(res => res.json())
            .then((data: Employee) => {
                setOwnerName(`${data.firstName} ${data.lastName}`);
            })
            .finally(() => setLoading(false));
    }

    useEffect(() => {
        if(isUpdate) {fetchOwner(ownerID)}
        fetchMe(ownerID)
        fetchStates()
    }, [ownerID, isUpdate]);

    return (
        <Combobox
            items={employees}
            value={null}
            itemToStringValue = {(item: Employee) =>
                `${item.firstName} ${item.lastName}`
            }

            onValueChange={(value) => {
                setNewOwner(value)
            }}
        >
            <ComboboxInput placeholder={isUpdate ? ownerName : myName} showClear />
            <ComboboxContent className="pointer-events-auto scroll-auto">
                <ComboboxEmpty>No items found.</ComboboxEmpty>
                <ComboboxList>
                    {(item) => (
                        <ComboboxItem key={item.id} value={item}>
                            <Item size="xs">
                                <ItemMedia variant="icon">
                                    <Avatar size="sm">
                                        <img src={item.image} alt={"profile"}/>
                                    </Avatar>
                                </ItemMedia>
                                <ItemContent>
                                    <ItemTitle>
                                        {`${item.firstName} ${item.lastName}`}
                                    </ItemTitle>
                                    <ItemDescription>
                                        {item.jobPosition}
                                    </ItemDescription>
                                </ItemContent>
                            </Item>
                        </ComboboxItem>
                    )}
                </ComboboxList>
            </ComboboxContent>
        </Combobox>
    )
}
