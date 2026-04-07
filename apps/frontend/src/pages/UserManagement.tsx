import EntryPage from "@/components/EntryPage.tsx";
import {useOutletContext} from "react-router-dom";
import type {Content, EmployeeWithContents} from "db";

export default function UserManagement() {
    const employee: EmployeeWithContents = useOutletContext();
    const contentList = employee.contents;

    return (
        <EntryPage
            getItems={(): Content[] => contentList}
            defaultBadge={"Employee"}
            formButtonProps={{formType: "Employee"}}
        />
    )
}