import { Controller, Get, Post, Delete, Param, Query, Body } from "@nestjs/common";
import { DemoService } from "./demo.service";

@Controller('demo')
export class DemoController {
    constructor(private readonly demoService: DemoService) {}

    @Get('hello') // GET /demo/hello
    helloDemo(): string {
        return this.demoService.helloDemo();
    }

    @Get('greet/:name') // GET /demo/greet/:name
    greetName(@Param('name') name: string): string {
        return this.demoService.greetName(name);
    }

    @Post('search') // POST /demo/search?id=1&page=2
    searchDemo(@Query('id') id: string, @Query('page') page: string): string {
        return this.demoService.searchDemo(id, page);
    }

    @Post('echo') // POST /demo/echo
    echoDemo(@Body() body: any): string {
        return this.demoService.echoDemo(body);
    }

    @Post('update/:id') // POST /demo/update/:id
    updateDemo(@Param('id') id: string, @Body() body: any): string {
        return this.demoService.updateDemo(id, body);
    }
    
    @Delete('delete/:id') // DELETE /demo/delete/:id
    removeUser(@Param('id') id: string): string {
        return this.demoService.deleteDemo(id);
    }
}