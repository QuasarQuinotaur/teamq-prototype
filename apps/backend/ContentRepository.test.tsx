import{expect, test, describe} from "vitest"
import {ContentRepository} from "./src/ContentRepository";

test('testname', () =>{
    //test code
    const result = 3;
    expect(result).toBe(3);
});

const contentRepository = new ContentRepository();
const now = new Date();


test('getAll', () =>{
    contentRepository.create({title: "test", link: "test.com", ownerName: "KylieW", jobPosition: "admin",
        contentType: "doc", status: "idk", expirationDate: now, ownerId: 2} )
    const result = contentRepository.getAll();
    expect(result).toBe({title: "test", link: "test.com", ownerName: "KylieW", jobPosition: "admin",
        contentType: "doc", status: "idk", expirationDate: now, ownerId: 2});
})