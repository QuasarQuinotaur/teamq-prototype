import { prisma } from "db";
import type { NotificationRepository } from "./NotificationRepository.ts";

export const DOCUMENT_EXPIRING_SOON_TYPE = "Document expiring soon";
export const DOCUMENT_EXPIRED_TYPE = "Document expired";
export const DOCUMENT_EDITED_BY_OTHER_TYPE = "Your document was updated";
export const DOCUMENT_OWNERSHIP_TRANSFERRED_TYPE = "Document ownership transferred to you";

/** Aligns with dashboard expiration line widget (30-day horizon). */
const EXPIRY_SOON_DAYS = 30;

function startOfLocalDay(d: Date): Date {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}

function addDaysLocal(start: Date, days: number): Date {
    const x = new Date(start);
    x.setDate(x.getDate() + days);
    return x;
}

type ContentForAccessNotify = {
    id: number;
    title: string;
    expirationDate: Date;
    ownerId: number;
    hasBeenNotifiedExpiringSoon: boolean;
    hasBeenNotifiedOfExpiration: boolean;
};

/**
 * When anyone accesses a document (including the owner), notify the owner if it is
 * expired or expiring within {@link EXPIRY_SOON_DAYS} days. Uses Content booleans so each
 * alert fires once until the document is updated (flags reset on save).
 */
export async function notifyOwnerOnDocumentAccess(
    content: ContentForAccessNotify,
): Promise<void> {
    const today = startOfLocalDay(new Date());
    const expDay = startOfLocalDay(new Date(content.expirationDate));
    const soonEnd = addDaysLocal(today, EXPIRY_SOON_DAYS);

    const isExpired = expDay < today;
    const isSoon = !isExpired && expDay <= soonEnd;

    if (!isExpired && !isSoon) {
        return;
    }

    const expStr = expDay.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });

    if (isExpired) {
        if (content.hasBeenNotifiedOfExpiration) {
            return;
        }
        await prisma.$transaction(async (tx) => {
            const claimed = await tx.content.updateMany({
                where: {
                    id: content.id,
                    hasBeenNotifiedOfExpiration: false,
                },
                data: { hasBeenNotifiedOfExpiration: true },
            });
            if (claimed.count === 0) {
                return;
            }
            await tx.notification.create({
                data: {
                    type: DOCUMENT_EXPIRED_TYPE,
                    customMsg: `"${content.title}" expired on ${expStr}. Consider updating or replacing it.`,
                    employeeNotified: { connect: { id: content.ownerId } },
                    contentsUsed: { connect: [{ id: content.id }] },
                },
            });
        });
        return;
    }

    if (content.hasBeenNotifiedExpiringSoon) {
        return;
    }

    await prisma.$transaction(async (tx) => {
        const claimed = await tx.content.updateMany({
            where: {
                id: content.id,
                hasBeenNotifiedExpiringSoon: false,
            },
            data: { hasBeenNotifiedExpiringSoon: true },
        });
        if (claimed.count === 0) {
            return;
        }
        await tx.notification.create({
            data: {
                type: DOCUMENT_EXPIRING_SOON_TYPE,
                customMsg: `"${content.title}" expires on ${expStr} (within ${EXPIRY_SOON_DAYS} days).`,
                employeeNotified: { connect: { id: content.ownerId } },
                contentsUsed: { connect: [{ id: content.id }] },
            },
        });
    });
}

export async function notifyDocumentEditedByOther(
    contentId: number,
    contentTitle: string,
    previousOwnerId: number,
    editor: { firstName: string; lastName: string },
    notificationRepo: NotificationRepository,
): Promise<void> {
    const who = `${editor.firstName} ${editor.lastName}`.trim() || "Another user";
    await notificationRepo.create({
        type: DOCUMENT_EDITED_BY_OTHER_TYPE,
        employeeNotifiedID: previousOwnerId,
        contentIds: [contentId],
        customMsg: `${who} updated "${contentTitle}".`,
    });
}

export async function notifyOwnershipTransferred(
    contentId: number,
    contentTitle: string,
    newOwnerId: number,
    previousOwner: { firstName: string; lastName: string },
    notificationRepo: NotificationRepository,
): Promise<void> {
    const from = `${previousOwner.firstName} ${previousOwner.lastName}`.trim() || "The previous owner";
    await notificationRepo.create({
        type: DOCUMENT_OWNERSHIP_TRANSFERRED_TYPE,
        employeeNotifiedID: newOwnerId,
        contentIds: [contentId],
        customMsg: `You are now the owner of "${contentTitle}" (transferred from ${from}).`,
    });
}
