import type {Content, Employee} from "db";
import Detail from "@/components/paging/details/Detail.tsx";
import {formatDate, formatDateWithTime, isSupabasePath} from "@/lib/utils.ts";
import path from "path";
import {useEffect, useState} from "react";
import axios from "axios";
import {Avatar, AvatarFallback, AvatarImage} from "@/elements/avatar.tsx";
import {Separator} from "@/elements/separator.tsx";


export type ContentDetailsProps = {
    content: Content;
}
export default function ContentDetails({
                                           content
}: ContentDetailsProps) {
    console.log(content);
    const filePath = content.filePath;
    const ownerId = content.ownerId;
    const expirationDate = new Date(content.expirationDate)

    const isExpired = Date.now() > expirationDate.getTime()
    const isFile = isSupabasePath(filePath);

    const [owner, setOwner] = useState<Employee | null>()
    const [ownerPhoto, setOwnerPhoto] = useState<string | null>(null)
    const getInitials = () => {
        if (!owner) return "??";
        return `${owner.firstName[0]}${owner.lastName[0]}`.toUpperCase();
    };

    useEffect(() => {
        const fetchOwnerName = async () => {
            try {
                const ownerResponse = await fetch(
                    `${import.meta.env.VITE_BACKEND_URL}/api/employee/${ownerId}/0`,
                    { credentials: "include" }
                );
                const owner: Employee = await ownerResponse.json()
                setOwner(owner)
            } catch (error) {
                console.error(error);
            }
        };
        const fetchOwnerPhoto = async () => {
            try {
                const photoResponse = await fetch(
                    `${import.meta.env.VITE_BACKEND_URL}/api/photos/photo/${ownerId}`,
                    { credentials: "include" }
                );
                const photoData = photoResponse.ok ? await photoResponse.json() : null
                setOwnerPhoto(photoData?.url)
            } catch (error) {
                console.error(error);
            }
        }
        void Promise.all([fetchOwnerName(), fetchOwnerPhoto()])
    }, []);

    return (
        <>
            <div>
                <div className={"flex flex-col gap-3"}>
                    <Detail
                        label={"Content Name"}
                        value={content.title}
                    />
                    <Detail
                        label={"Content Owner"}
                        value={
                            <div className={"flex gap-2 items-center"}>
                                <Avatar size="sm" className="bg-red/20 hover:bg-white/30 transition-colors">
                                    {ownerPhoto && (
                                        <AvatarImage src={ownerPhoto} alt="Profile" />
                                    )}
                                    {!ownerPhoto && (
                                        <AvatarFallback className="text-white font-medium">
                                            {getInitials()}
                                        </AvatarFallback>
                                    )}

                                </Avatar>
                                {owner ? `${owner.firstName} ${owner.lastName}` : ""}
                            </div>
                        }
                    />
                    <Detail
                        label={isFile ? "File Path" : "URL"}
                        value={isFile ? filePath : (
                            <a
                                className={"text-primary"}
                                href={filePath}
                                target="_blank"
                            >
                                <u>{filePath}</u>
                            </a>
                        )}
                    />
                    <Detail
                        label={"Status"}
                        value={isExpired ? "Expired" : "Active"}
                    />
                    <Detail
                        label={"Tags"}
                        value={"(To be added)"}
                    />
                </div>
                <Separator className={"mb-4 mt-4"} />
                <div  className={"flex flex-col gap-3"}>
                    <Detail
                        label={"Expiration Date"}
                        value={formatDate(expirationDate)}
                    />
                    <Detail
                        label={"Last Updated"}
                        value={formatDateWithTime(new Date(content.dateUpdated))}
                    />
                    <Detail
                        label={"Created"}
                        value={formatDateWithTime(new Date(content.dateAdded))}
                    />
                </div>
            </div>
        </>
    )
}