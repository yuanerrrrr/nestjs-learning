import { Injectable } from "@nestjs/common";

@Injectable()
export class DemoService {

    helloDemo(): string {
        return 'get demo hello';
    }
    greetName(name: string): string {
        return `the name is ${name}`;
    }
    searchDemo(id: string, page: string): string {
        return `Search for ${id} on page ${page}`;
    }
    echoDemo(body: any): string {
        return body;
    }
    updateDemo(id:string, body: any): string {
        return `update ${id} with body ${JSON.stringify(body)}`;
    }
    deleteDemo(id: string): string {
        return `user with id ${id} removed`;
    }
}