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
import {ScrollArea} from "@/elements/scroll-area.tsx";

type EmployeeComboboxProps = {
    isUpdate: boolean;
    ownerID: number;
    setNewOwner: (owner: Employee) => void;
    disabled?: boolean;
};

export default function EmployeeCombobox({
    isUpdate,
    ownerID,
    setNewOwner,
    disabled = false,
}: EmployeeComboboxProps) {
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

    function fetchMe(ownerID: number, isUpdate: boolean) {
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/me`, { credentials: 'include' })
            .then(res => res.json())
            .then((data: Employee) => {
                setMyName(`${data.firstName} ${data.lastName}`);
                setMyID(data.id);
                setPermissions((data.id === ownerID || !ownerID) && isUpdate);
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
        fetchMe(ownerID, isUpdate)
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
                    if (disabled) return;
                    setNewOwner(value)
                }}
            >
                <ComboboxInput placeholder={isUpdate ? ownerName : myName} showClear disabled={disabled || !permissions} />
                <ScrollArea><ComboboxContent className="pointer-events-auto overflow-scroll">

                    <ComboboxEmpty>No items found.</ComboboxEmpty>
                    <ComboboxList>
                        {(item) => (
                            <ComboboxItem key={item.id} value={item}>
                                <Item size="xs">
                                    <ItemMedia variant="icon">
                                        <Avatar size="sm">
                                            <img className="rounded-4xl" src={item.image} alt={"profile"}/>
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
                </ComboboxContent></ScrollArea>
            </Combobox>


    )
}
