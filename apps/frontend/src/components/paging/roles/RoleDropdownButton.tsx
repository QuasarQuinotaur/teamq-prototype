
import { Button } from "@/elements/buttons/button";
import { AddressBookIcon, LockKeyIcon, PencilIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
import useJobInfoMap from '@/hooks/useJobInfoMap';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/DropdownMenu.tsx";
import RoleFormDialog from "@/components/paging/roles/RoleFormDialog";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/dialog/Dialog.tsx";
import { useEffect, useMemo, useState } from "react";
import { ScrollArea } from "@/elements/scroll-area";
import { TableBody, TableRow } from "@/components/Table";
import DeleteConfirmDialog from "@/components/dialog/DeleteConfirmDialog";
import useGetPermissionLevel from "@/hooks/useGetPermissionLevel";
import axios from "axios"
import type { Employee } from "db";
import { cn } from "@/lib/utils";


export default function RoleDropdownButton() { 
    const { jobInfoMap, refetchRoles } = useJobInfoMap();
    const { getPermissionLevel } = useGetPermissionLevel();

    const [modifyRolesOpen, setModifyRolesOpen] = useState(false)
    const [employee, setEmployee] = useState<Employee | null>(null);
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/me`, {
                  withCredentials: true,
                });
                setEmployee(response.data);
            } catch (error) {
                console.error("Not logged in or no employee record found", error);
            }
        };
        fetchUser();
    }, [getPermissionLevel]);
    const employeePermissionLevel = useMemo(() => {
        return getPermissionLevel(employee)
    }, [employee])


    const jobRoleList = useMemo(() => {
        return Object.values(jobInfoMap)
            // .filter(role => employeePermissionLevel >= role.permissionLevel)
            .sort((a, b) => b.permissionLevel - a.permissionLevel)
    }, [jobInfoMap, employeePermissionLevel])
    
    useEffect(() => {
        if (jobRoleList.length === 0) {
            setModifyRolesOpen(false)
        }
    }, [jobRoleList]);


    function onRolesModified() {
        refetchRoles()
    }


    async function deleteByRoleId(roleId: number) {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/roles/${roleId}`, {
            method: "DELETE",
            credentials: "include",
        })
        const result = await response.json()
        if (result && result.success) {
            onRolesModified()
        } else {
            throw new Error(result ? result.error : `Failed to delete role`)
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                // variant="outline"
                    className={
                        "px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-hanover-blue/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    }
                >
                    <AddressBookIcon/>
                    Roles
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuGroup>
                
                    {/*Create Role option*/}
                    <RoleFormDialog
                        header={"Create Role"}
                        onSubmitted={onRolesModified}
                        permissionLevel={employeePermissionLevel}
                    >
                        <DropdownMenuItem
                            onSelect={(e) => {
                                e.preventDefault();
                            }}
                        >
                            <PlusIcon/>
                            Create new role
                        </DropdownMenuItem>
                    </RoleFormDialog>

                    {/*Modify Roles option*/}
                    {jobRoleList.length > 0 && (
                        <Dialog open={modifyRolesOpen} onOpenChange={setModifyRolesOpen}>
                            <DialogTrigger asChild>
                                <DropdownMenuItem
                                    onSelect={(e) => {
                                        e.preventDefault();
                                    }}
                                >
                                    <PencilIcon/>
                                    Modify roles
                                </DropdownMenuItem>
                            </DialogTrigger>
                            <DialogContent
                                className={`w-fit min-w-70 max-w-[90vw] sm:max-w-150 sm:min-w-90 p-5 text-sm gap-4
                                 sm:p-6 sm:pr-10 sm:text-base max-h-[min(90dvh,720px)] overflow-y-auto overflow-x-hidden`}
                            >
                                <DialogHeader className="gap-1.5 pb-0 sm:gap-2 sm:pb-1">
                                    <DialogTitle className="text-base font-semibold sm:text-lg">
                                        Role Manager
                                    </DialogTitle>
                                </DialogHeader>
                                <ScrollArea className={"min-h-0 max-h-120"}>
                                    <TableBody className={"flex flex-col gap-1 pr-3"}>
                                        {jobRoleList.map(role => {
                                            const isAboveRole = employeePermissionLevel > role.permissionLevel
                                            const isAtLeastRole = employeePermissionLevel >= role.permissionLevel
                                            const isHigherRole = !isAtLeastRole
                                            return (
                                                <TableRow className={"w-full justify-between text-base p-1 pl-2 flex flex-nowrap items-center  hover:bg-background"}>
                                                    <div
                                                        className={cn(
                                                            "flex items-center gap-1",
                                                            isHigherRole && "pb-1"
                                                        )}
                                                    >
                                                        {isHigherRole && <LockKeyIcon weight="fill"/>}
                                                        {role.name}
                                                    </div>
                                                    <div className={"justify-self-end flex gap-1"}>
                                                        {isAtLeastRole && (
                                                            <RoleFormDialog
                                                                header={"Edit Role"}
                                                                onSubmitted={onRolesModified}
                                                                baseItem={role}
                                                                permissionLevel={employeePermissionLevel}
                                                            >
                                                                <Button variant={"outline"}>
                                                                    <PencilIcon/>
                                                                </Button>
                                                            </RoleFormDialog>
                                                        )}
                                                        {isAboveRole && (
                                                            <DeleteConfirmDialog
                                                                onDelete={() => void deleteByRoleId(role.id)}
                                                            >
                                                                <Button variant={"outline"}>
                                                                    <TrashIcon color={"var(--destructive)"}/>
                                                                </Button>
                                                            </DeleteConfirmDialog>
                                                        )}
                                                    </div>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </ScrollArea>
                            </DialogContent>
                        </Dialog>
                    )}
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}