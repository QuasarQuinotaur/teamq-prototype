// EmployeeEntryPage used for User Management page
// It makes an EntryPage with Card + List view showing all employees

import {useEffect, useState} from "react";
import type {CardEntry} from "@/components/cards/Card.tsx";
import type {Employee} from "db";
import EmployeeCard from "@/components/cards/EmployeeCard.tsx";
import * as React from "react";
import EntryPage from "@/components/paging/EntryPage.tsx";
import FormAddButton from "@/components/forms/FormAddButton.tsx";
import ModifyDropdown from "@/components/paging/ModifyDropdown.tsx";
import type {FormOfTypeProps} from "@/components/forms/FormOfType.tsx";
import type {QueryProps} from "@/components/paging/toolbar/Toolbar.tsx";
import useEmployeeQueryEntries from "@/components/paging/hooks/employee-query-entries.tsx";
import FilterEmployeeFields, {type EmployeeFieldsFilter} from "@/components/paging/toolbar/FilterEmployeeFields.tsx";
import type {SortFields} from "@/components/forms/SortForm.tsx";
import {DEFAULT_SORT_FIELDS} from "@/components/paging/hooks/sort-function.tsx";
import useEmployeeSortFunction from "@/components/paging/hooks/employee-sort-function.tsx";
import FilterDocumentFields from "@/components/paging/toolbar/FilterDocumentFields.tsx";
import {EMPLOYEE_SORT_BY_MAP} from "@/components/input/constants.tsx";
import RoleDropdownButton from "./roles/RoleDropdownButton";


export default function EmployeeEntryPage() {
    const [entries, setEntries] = useState<CardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    // Get all employees
    function fetchEmployees() {
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/employee`, { credentials: 'include' })
            .then(res => res.json())
            .then((data: Employee[]) => {
                const mapped: CardEntry[] = data.map((item) => ({
                    item,
                    title: `${item.firstName} ${item.lastName}`,
                    link: item.email,
                    owner: item.email,
                    badge: item.jobPosition ? item.jobPosition.charAt(0).toUpperCase() + item.jobPosition.slice(1) : item.jobPosition,
                    image: (item as { image?: string }).image,
                }));
                setEntries(mapped);
            })
            .finally(() => setLoading(false));
    }
    useEffect(() => {
        fetchEmployees()
    }, []);

    // Delete employee
    async function handleDelete(entry: CardEntry) {
        try {
            const item = entry.item as { id: number };
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/employee/${item.id}`, {
                method: "DELETE",
                credentials: "include",
            });
            if (!res.ok) {
                throw new Error("Delete failed");
            }
            setEntries((prev) => prev.filter(
                (e) => e.item!.id !== entry.item.id));
        } catch (err) {
            console.error("Delete failed:", err);
        }
    }

    // Use Employee form
    const formOfTypeProps: FormOfTypeProps = {
        formType: "Employee",
        onCancel: fetchEmployees,
    }

    // Create toolbar button for Add Employee Form
    const formAddButton = <FormAddButton {...formOfTypeProps}/>

    // Make card "..." show dropdown to modify employees
    const createOptionsElement =
        (entry: CardEntry, trigger: React.ReactNode) => (
            ModifyDropdown({
                entry,
                trigger,
                ...formOfTypeProps,
                handleDelete: handleDelete,
            })
        )

    // Filtering using search and key matching
    const defaultFieldsFilter: EmployeeFieldsFilter = {}
    const [fieldsFilter, setFieldsFilter] = useState<EmployeeFieldsFilter>(defaultFieldsFilter)
    const defaultSortFields: SortFields = DEFAULT_SORT_FIELDS
    const [sortFields, setSortFields] = useState(defaultSortFields)
    const sortFunction = useEmployeeSortFunction({sortFields})
    const [searchPhrase, setSearchPhrase] = useState("")
    const queryEntries = useEmployeeQueryEntries({
        entries,
        searchPhrase,
        fieldsFilter,
        sortFunction
    })

    // Track properties to update querying
    const queryProps: QueryProps<EmployeeFieldsFilter> = {
        searchBarProps: {
            setFilter: setSearchPhrase
        },
        filterButtonProps: {
            emptyFields: {},
            defaultFields: defaultFieldsFilter,
            fields: fieldsFilter,
            setFields: setFieldsFilter,
            createFieldsElement: FilterEmployeeFields,
        },
        sortButtonProps: {
            sortByMap: EMPLOYEE_SORT_BY_MAP,
            defaultSortFields,
            sortFields,
            setSortFields,
        }
    }


    return (
        <EntryPage
            entries={queryEntries}
            createOptionsElement={createOptionsElement}
            listColumnOptions={{ omitExpiration: true }}
            listEntriesPerPage={28}
            cardGridProps={{
                renderCard: ((state) => (
                    // Uses employee card for grid
                    <EmployeeCard
                        key={state.entry.item.id}
                        {...state}
                    />
                )),
            }}
            extraToolbarElements={[
                formAddButton,
                <RoleDropdownButton/>
            ]}
            queryProps={queryProps}
        />
    )
}