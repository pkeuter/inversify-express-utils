import { expect } from "chai";
import * as express from "express";
import { Container, injectable, inject } from "inversify";
import * as supertest from "supertest";
import {
    InversifyExpressServer,
    TYPE,
    controller,
    httpGet,
    BaseHttpController,
    interfaces
} from "../src/index";
import { cleanUpMetadata } from "../src/utils";

describe("BaseHttpController", () => {

    beforeEach((done) => {
        cleanUpMetadata();
        done();
    });

    it("Should contain httpContext instance", (done) => {

        interface SomeDependency {
            name: string;
        }

        @controller("/")
        class TestController extends BaseHttpController {
            private readonly _someDependency: SomeDependency;
            public constructor(
                @inject("SomeDependency") someDependency: SomeDependency
            ) {
                super();
                this._someDependency = someDependency;
            }
            @httpGet("/")
            public async getTest() {
                const headerVal = this.httpContext.request.headers["x-custom"];
                const name = this._someDependency.name;
                const isAuthenticated = await this.httpContext.user.isAuthenticated();
                expect(isAuthenticated).eq(false);
                return `${headerVal} & ${name}`;
            }
        }

        const container = new Container();

        container.bind<SomeDependency>("SomeDependency")
                .toConstantValue({ name: "SomeDependency!" });

        const server = new InversifyExpressServer(container);

        supertest(server.build())
            .get("/")
            .set("x-custom", "test-header!")
            .expect(200, `test-header! & SomeDependency!`, done);

    });

});
